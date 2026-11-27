"""GET /players/{id}/insights (F25, STAT-11)."""
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
def players():
    for pid, name in (("p1", "Alice"), ("p2", "Bob"), ("p3", "Cara")):
        PlayersRepository().create(Player(player_id=pid, name=name))


def test_a_player_without_games_has_empty_insights(client, players):
    body = client.get("/players/p3/insights").json()
    assert body["games"] == 0 and body["archetype"] is None and body["rank"] is None
    assert body["equity"]["wins_ratio"] is None and body["best_game"] is None
    assert [t["avg_points"] for t in body["by_table"]] == [None, None, None, None]


def test_insights_follow_the_table_size(client, players):
    _post_game(client, _game_payload("g1", "2026-01-01", [_pr("p1", 50), _pr("p2", 30)]))
    _post_game(client, _game_payload("g2", "2026-01-02", [_pr("p2", 50), _pr("p1", 30), _pr("p3", 10)]))
    every = client.get("/players/p1/insights").json()
    assert every["view"] == "all" and every["games"] == 2 and every["wins"] == 1 and every["rank_total"] == 3
    three = client.get("/players/p1/insights?player_count=3").json()
    assert three["view"] == "mesa" and three["games"] == 1 and three["wins"] == 0
    assert three["by_table"][1] == {**three["by_table"][1], "n": 3, "games": 1}
    assert three["elo"] == 1000 and three["last_delta"] == 0  # 2.º de 3 con todos en 1000 (ELO de mesa)


def test_unknown_player_is_404_and_bad_table_is_422(client, players):
    assert client.get("/players/nadie/insights").status_code == 404
    assert client.get("/players/p1/insights?player_count=9").status_code == 422


def test_history_and_elo_series_newest_first_with_the_table_elo(client, players):
    _post_game(client, _game_payload("g1", "2026-01-01", [_pr("p1", 50), _pr("p2", 30)]))
    _post_game(client, _game_payload("g2", "2026-01-02", [_pr("p2", 50), _pr("p1", 30), _pr("p3", 10)]))
    every = client.get("/players/p1/insights").json()
    assert [h["game_id"] for h in every["history"]] == ["g2", "g1"]
    assert every["history"][1] == {**every["history"][1], "position": 1, "n": 2, "total": 50, "date": "2026-01-01"}
    assert [s["game_id"] for s in every["elo_series"]] == ["g1", "g2"]
    assert [h["delta"] for h in every["history"]] == [s["delta"] for s in reversed(every["elo_series"])]
    three = client.get("/players/p1/insights?player_count=3").json()
    assert [(h["game_id"], h["delta"]) for h in three["history"]] == [("g2", 0)]
    assert client.get("/players/p3/insights?player_count=2").json()["history"] == []
