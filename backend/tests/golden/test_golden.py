"""Compara la API contra fixtures/golden.json (generado desde el mockup)."""
import pytest

from models.game_subset import GameSubset
from repositories.container import games_repository
from services.stats.context import StatsContext
from services.stats.elo_replay import replay_elo
from tests.golden.adapters import (
    achievements_from_api,
    elo_from_changes,
    elo_from_golden,
    elo_from_replay,
    insights_from_api,
    positions_from_golden,
    positions_from_results,
    ranking_row_from_api,
    record_shape,
    report_from_api,
    summary_from_api,
    summary_stats_from_api,
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
def test_achievements(client, golden, scope):
    """Logros derivados de cada jugador, sin filtro (guardados) y por mesa (STAT-04, STAT-07)."""
    expected = golden_scope(golden, scope)["achievements"]
    for pid, by_code in expected.items():
        got = achievements_from_api(client.get(f"/players/{pid}/achievements{_query(scope)}").json())
        assert got == by_code, pid


def test_stored_unlocks_match_the_derived_view(client, golden):
    """La tabla achievement_unlocks (escrita al cargar) es la vista sin filtro."""
    from repositories.achievement_repository import AchievementRepository

    stored = {(r.player_id, r.code, r.tier, r.game_id, r.unlocked_on.isoformat()) for r in AchievementRepository().get_all()}
    derived = {(pid, code, u["level"], u["game_id"], u["date"])
               for pid, by_code in golden["all"]["achievements"].items()
               for code, a in by_code.items() for u in a["unlocked"]}
    assert stored == derived


@pytest.mark.parametrize("scope", enabled_scopes("summaries"))
def test_summaries(client, golden, scope):
    """Filas del archivo, de la más nueva a la más vieja (STAT-09)."""
    got = [summary_from_api(s) for s in client.get(f"/games/summaries{_query(scope)}").json()]
    assert got == golden_scope(golden, scope)["summaries"]


@pytest.mark.parametrize("scope", enabled_scopes("reports"))
def test_reports(client, golden, scope):
    """Informe de cada partida (STAT-10): récords rotos, igualados y cerca, logros y robos."""
    for game_id, expected in golden_scope(golden, scope)["reports"].items():
        body = client.get(f"/games/{game_id}/report").json()
        assert report_from_api(body) == expected, game_id
        assert positions_from_results({"results": body["results"]}) == positions_from_golden(
            golden_scope(golden, scope)["positions"][game_id]), game_id


@pytest.mark.parametrize("scope", enabled_scopes("players"))
def test_player_insights(client, golden, scope):
    """Ficha de cada jugador frente al grupo (STAT-11), sin filtro y por mesa."""
    for pid, expected in golden_scope(golden, scope)["players"].items():
        got = insights_from_api(client.get(f"/players/{pid}/insights{_query(scope)}").json())
        assert got == expected, pid


@pytest.mark.parametrize("scope", enabled_scopes("summary"))
def test_group_summary(client, golden, scope):
    got = summary_stats_from_api(client.get(f"/stats/summary{_query(scope)}").json())
    assert got == golden_scope(golden, scope)["summary"]


@pytest.mark.parametrize("scope", enabled_scopes("head_to_head"))
def test_head_to_head(client, golden, scope):
    body = client.get(f"/stats/head-to-head{_query(scope)}").json()
    assert body["matrix"] == golden_scope(golden, scope)["head_to_head"]
    players = golden_scope(golden, scope)["players"]
    for pid, rivals in body["rivals"].items():
        assert rivals == {"nemesis": players[pid]["nemesis"], "victim": players[pid]["victim"]}, pid


@pytest.mark.parametrize("scope", enabled_scopes("lead_changes"))
def test_ranking_and_lead_changes(client, golden, scope):
    body = client.get(f"/ranking{_query(scope)}").json()
    assert body["lead_changes"] == golden_scope(golden, scope)["lead_changes"]
    players, per_game = golden_scope(golden, scope)["players"], golden_scope(golden, scope)["elo"]["perGame"]
    assert [r["rank"] for r in body["players"]] == list(range(1, len(body["players"]) + 1))
    for row in body["players"]:
        expected = {k: players[row["player_id"]][k] for k in ranking_row_from_api(row)}
        assert ranking_row_from_api(row) == expected, row["player_id"]
        assert [p["elo"] for p in row["elo_series"]] == [
            c["after"] for g in row["elo_series"] for c in per_game[g["game_id"]] if c["player_id"] == row["player_id"]]
