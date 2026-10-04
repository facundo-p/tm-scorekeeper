"""Compara la API contra fixtures/golden.json (generado desde el mockup)."""
import pytest

from models.game_subset import GameSubset
from repositories.container import games_repository
from services.achievement_evaluators.derive import derive_achievements
from services.stats.context import StatsContext
from services.stats.elo_replay import replay_elo
from tests.golden.adapters import (
    elo_from_changes,
    elo_from_golden,
    elo_from_replay,
    positions_from_golden,
    positions_from_results,
    record_shape,
)
from tests.golden.conftest import enabled_scopes, golden_scope


@pytest.mark.parametrize("scope", enabled_scopes("positions"))
def test_positions(client, golden, scope):
    expected = golden_scope(golden, scope)["positions"]
    for game_id, rows in expected.items():
        got = client.get(f"/games/{game_id}/results").json()
        assert positions_from_results(got) == positions_from_golden(rows), game_id


def _subset(scope: str) -> GameSubset:
    return GameSubset() if scope == "all" else GameSubset(player_count=int(scope))


def _query(scope: str) -> str:
    return "" if scope == "all" else f"?player_count={scope}"


@pytest.mark.parametrize("scope", [s for s in enabled_scopes("elo") if s == "all"])
def test_elo_per_game(client, golden, scope):
    expected = golden_scope(golden, scope)["elo"]["perGame"]
    for game_id, rows in expected.items():
        got = client.get(f"/games/{game_id}/elo").json()
        assert elo_from_changes(got) == elo_from_golden(rows), game_id


@pytest.mark.parametrize("scope", [s for s in enabled_scopes("elo") if s == "all"])
def test_final_elo(client, golden, scope):
    expected = golden_scope(golden, scope)["elo"]["final"]
    got = {p["player_id"]: p["elo"] for p in client.get("/players/").json()}
    assert {pid: got[pid] for pid in expected} == expected


@pytest.mark.parametrize("scope", enabled_scopes("elo"))
def test_elo_replay(seeded, golden, scope):
    """ELO reproducido (de mesa, o de todas = el guardado) contra el golden (STAT-02)."""
    expected = golden_scope(golden, scope)["elo"]
    replay = replay_elo(StatsContext.load(games_repository, _subset(scope)))
    assert {g: elo_from_replay(c) for g, c in replay.per_game.items()} == {
        g: elo_from_golden(rows) for g, rows in expected["perGame"].items()
    }
    assert {pid: replay.ratings[pid] for pid in expected["final"]} == expected["final"]


@pytest.mark.parametrize("scope", enabled_scopes("records"))
def test_records(client, golden, scope):
    expected = [record_shape(r) for r in golden_scope(golden, scope)["records"]]
    got = [record_shape(r) for r in client.get(f"/records/{_query(scope)}").json()]
    assert [r["code"] for r in got] == [r["code"] for r in expected]
    for g, e in zip(got, expected):
        assert g == e, g["code"]


def test_seed_loads_every_game(client, golden):
    assert len(client.get("/games/").json()) == len(golden["all"]["positions"])


def test_full_replay_equals_stored_history(client):
    """Reproducir todas las partidas da exactamente el historial guardado (STAT-02)."""
    replay = replay_elo(StatsContext.load(games_repository))
    for game_id, changes in replay.per_game.items():
        assert elo_from_changes(client.get(f"/games/{game_id}/elo").json()) == elo_from_replay(changes), game_id


@pytest.mark.parametrize("scope", enabled_scopes("achievements"))
def test_derived_achievements(seeded, golden, scope):
    """Motor de logros derivados (F23, STAT-04, STAT-06) contra el golden, sin filtro y por mesa."""
    expected = golden_scope(golden, scope)["achievements"]
    derived = derive_achievements(StatsContext.load(games_repository, _subset(scope)), list(expected))
    for pid, states in derived.items():
        got = {s.definition.code: {
            "tier": s.tier, "value": s.value, "progress": None if s.progress is None else vars(s.progress),
            "unlocked": [{"level": u.level, "date": u.date.isoformat(), "game_id": u.game_id} for u in s.unlocks],
        } for s in states}
        assert got == expected[pid], pid
