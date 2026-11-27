"""Ranking, cara a cara y resumen del grupo (F25, STAT-12)."""
import pytest
from fastapi.testclient import TestClient

from main import app
from models.player import Player
from repositories.player_repository import PlayersRepository

from _elo_helpers import _game_payload, _post_game, _pr


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def games(client):
    for pid, name in (("p1", "Alice"), ("p2", "Bob"), ("p3", "Cara")):
        PlayersRepository().create(Player(player_id=pid, name=name))
    _post_game(client, _game_payload("g1", "2026-01-01", [_pr("p1", 50), _pr("p2", 30)]))
    _post_game(client, _game_payload("g2", "2026-03-01", [_pr("p2", 50), _pr("p3", 30), _pr("p1", 10)]))


def test_an_empty_group_has_an_empty_ranking_and_summary(client):
    assert client.get("/ranking").json() == {"view": "all", "players": [], "lead_changes": []}
    summary = client.get("/stats/summary").json()
    assert summary["games"] == 0 and summary["top_corp"] is None and summary["first"] is None


def test_ranking_lists_active_players_and_from_trims_only_the_elo_series(client, games):
    body = client.get("/ranking?from=2026-02-01").json()
    assert [r["player_id"] for r in body["players"]][0] == "p2" and len(body["players"]) == 3
    p1 = {r["player_id"]: r for r in body["players"]}["p1"]
    assert p1["games"] == 2 and [s["game_id"] for s in p1["elo_series"]] == ["g2"]
    assert [c["player_id"] for c in body["lead_changes"]] == ["p1", "p2"]


def test_inactive_players_leave_the_ranking(client, games):
    client.patch("/players/p3", json={"is_active": False})
    assert "p3" not in {r["player_id"] for r in client.get("/ranking").json()["players"]}


def test_head_to_head_and_summary_follow_the_table_size(client, games):
    h2h = client.get("/stats/head-to-head?player_count=3").json()
    assert h2h["view"] == "mesa" and h2h["matrix"]["p2"]["p1"] == {"games": 1, "ahead": 1, "behind": 0, "even": 0}
    assert h2h["rivals"]["p1"] == {"nemesis": None, "victim": None}  # menos de 4 partidas juntos
    assert client.get("/stats/summary?player_count=2").json()["games"] == 1


@pytest.mark.parametrize("path", ["/ranking?player_count=1", "/stats/summary?player_count=6",
                                  "/stats/head-to-head?player_count=0", "/ranking?from=ayer"])
def test_bad_filters_are_422(client, path):
    assert client.get(path).status_code == 422


def test_a_table_size_without_games_is_empty(client, games):
    assert client.get("/ranking?player_count=5").json() == {"view": "mesa", "players": [], "lead_changes": []}
    assert client.get("/stats/summary?player_count=5").json()["games"] == 0
