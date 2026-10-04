"""GET /records con subconjunto y GET /records/{code}/history (F22, STAT-01, STAT-03)."""
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
def seeded(client):
    for pid, name in (("p1", "Alice"), ("p2", "Bob"), ("p3", "Cara")):
        PlayersRepository().create(Player(player_id=pid, name=name))
    _post_game(client, _game_payload("g-2p", "2026-01-15", [_pr("p1", 50), _pr("p2", 30)]))
    _post_game(client, _game_payload("g-3p", "2026-02-15", [_pr("p2", 60), _pr("p3", 30), _pr("p1", 20)]))


def by_code(response):
    return {r["code"]: r for r in response.json()}


@pytest.mark.parametrize("query", ["player_count=1", "player_count=6", "map=Marte", "expansion=Nada"])
def test_out_of_range_subset_is_422(client, query):
    assert client.get(f"/records/?{query}").status_code == 422


def test_records_without_games_have_no_holders(client):
    records = client.get("/records/").json()
    assert len(records) == 16
    assert all(r["holders"] == [] and r["history"] == [] and r["value"] in (None, 0) for r in records)
    assert all("record" not in r and "emoji" not in r for r in records)  # contrato viejo retirado (35.2)


def test_records_carry_value_holders_and_history(client, seeded):
    score = by_code(client.get("/records/"))["highest_single_game_score"]
    assert score["value"] == 60
    assert score["scope"] == "game" and score["unit"] == "pts" and score["lower_is_better"] is False
    assert score["holders"] == [{"player_id": "p2", "player_name": "Bob", "game_id": "g-3p",
                                 "date": "2026-02-15", "map": "Hellas"}]
    assert [h["kind"] for h in score["history"]] == ["set", "broken"]


def test_records_follow_the_subset(client, seeded):
    score = by_code(client.get("/records/?player_count=2"))["highest_single_game_score"]
    assert score["value"] == 50 and score["holders"][0]["player_id"] == "p1"
    played = by_code(client.get("/records/?map=Tharsis"))["most_games_played"]
    assert played["value"] == 0 and played["holders"] == []


def test_a_shared_record_keeps_every_holder(client, seeded):
    played = by_code(client.get("/records/"))["most_games_played"]
    assert [h["player_name"] for h in played["holders"]] == ["Alice", "Bob"]
    _post_game(client, _game_payload("g-tie", "2026-03-01", [_pr("p3", 60), _pr("p1", 10)]))
    score = by_code(client.get("/records/"))["highest_single_game_score"]
    assert [(h["player_name"], h["date"]) for h in score["holders"]] == [("Bob", "2026-02-15"), ("Cara", "2026-03-01")]
    assert [h["kind"] for h in score["history"]] == ["set", "broken", "tied"]


def test_record_history(client, seeded):
    res = client.get("/records/most_games_played/history")
    assert res.status_code == 200
    body = res.json()
    assert body["code"] == "most_games_played" and body["value"] == 2
    assert sorted(h["player_id"] for h in body["holders"]) == ["p1", "p2"]
    assert body["history"][0] == {"value": 1, "player_id": "p1", "player_name": "Alice", "holders": ["p1", "p2"],
                                  "game_id": "g-2p", "date": "2026-01-15", "kind": "set"}


def test_unknown_record_history_is_404(client):
    assert client.get("/records/no_existe/history").status_code == 404
