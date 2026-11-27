"""Temporadas y bitácora (F25, SEAS-01, STAT-12)."""
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
    for day in range(1, 5):
        _post_game(client, _game_payload(f"g{day}", f"2026-01-0{day}", [_pr("p1", 50), _pr("p2", 30)]))
    _post_game(client, _game_payload("g5", "2026-01-05", [_pr("p3", 60), _pr("p2", 30), _pr("p1", 20)]))


def test_without_games_there_are_no_seasons(client):
    assert client.get("/seasons").json() == {"seasons": [], "champions": []}
    assert client.get("/seasons/current").status_code == 404
    assert client.get("/feed").json() == []


def test_the_current_season_is_open_and_has_no_champion(client, games):
    season = client.get("/seasons/current").json()
    assert season["number"] == 1 and season["end"] is None and season["champion"] is None
    assert season["temperature"] == -30 + 2 * 4  # 5 × 0,8 = 4 pasos
    qualified = [r["player_id"] for r in season["race"]["qualified"]]
    assert qualified == ["p1", "p2"] and season["race"]["pending"][0] == {
        "player_id": "p3", "games": 1, "avg": 60, "best": 60, "missing": 2}


def test_the_race_follows_the_category_and_the_table(client, games):
    race = client.get("/seasons/1?category=terraform_rating&player_count=3").json()["race"]
    assert race["category"] == "terraform_rating" and race["games"] == 1 and race["qualified"] == []
    assert client.get("/seasons/1?category=puntos").status_code == 422
    assert client.get("/seasons/9").status_code == 404


def test_feed_is_newest_first_and_follows_limit_and_table(client, games):
    feed = client.get("/feed").json()
    assert feed[0]["date"] == "2026-01-05" and [i["date"] for i in feed] == sorted((i["date"] for i in feed), reverse=True)
    assert feed[0]["type"] in ("record", "achievement")  # en el mismo día van antes que la partida
    assert len(client.get("/feed?limit=2").json()) == 2
    assert {i["game_id"] for i in client.get("/feed?player_count=3").json() if i["type"] == "game"} == {"g5"}
    assert client.get("/feed?limit=0").status_code == 422
