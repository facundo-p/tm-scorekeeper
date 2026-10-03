"""Compara la API contra fixtures/golden.json (generado desde el mockup)."""
import pytest

from tests.golden.adapters import (
    elo_from_changes,
    elo_from_golden,
    positions_from_golden,
    positions_from_results,
)
from tests.golden.conftest import enabled_scopes, golden_scope


@pytest.mark.parametrize("scope", enabled_scopes("positions"))
def test_positions(client, golden, scope):
    expected = golden_scope(golden, scope)["positions"]
    for game_id, rows in expected.items():
        got = client.get(f"/games/{game_id}/results").json()
        assert positions_from_results(got) == positions_from_golden(rows), game_id


@pytest.mark.parametrize("scope", enabled_scopes("elo"))
def test_elo_per_game(client, golden, scope):
    expected = golden_scope(golden, scope)["elo"]["perGame"]
    for game_id, rows in expected.items():
        got = client.get(f"/games/{game_id}/elo").json()
        assert elo_from_changes(got) == elo_from_golden(rows), game_id


@pytest.mark.parametrize("scope", enabled_scopes("elo"))
def test_final_elo(client, golden, scope):
    expected = golden_scope(golden, scope)["elo"]["final"]
    got = {p["player_id"]: p["elo"] for p in client.get("/players/").json()}
    assert {pid: got[pid] for pid in expected} == expected


def test_seed_loads_every_game(client, golden):
    assert len(client.get("/games/").json()) == len(golden["all"]["positions"])
