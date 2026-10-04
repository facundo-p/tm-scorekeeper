"""Informe de partida y filas del archivo (F24, STAT-09, STAT-10)."""
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


def _award(opened_by, first):
    return {"name": "Magnate", "opened_by": opened_by, "first_place": first, "second_place": []}


def test_creating_a_game_returns_its_report(client, players):
    body = client.post("/games/", json=_game_payload("g1", "2026-01-01", [_pr("p1", 50), _pr("p2", 30)])).json()
    assert body["id"] == "g1" and body["game"]["map"] == "Hellas"
    report = body["report"]
    assert report["winners"] == ["p1"] and report["margin"] == 20 and not report["decided_by_mc"]
    assert [r["player_name"] for r in report["results"]] == ["Alice", "Bob"]
    assert {e["player_id"]: e["delta"] for e in report["elo"]} == {"p1": 16, "p2": -16}
    assert report["records_broken"] == []  # la primera partida establece, no rompe (D-05)


def test_report_shows_broken_records_with_the_previous_holder_and_stolen_awards(client, players):
    _post_game(client, _game_payload("g1", "2026-01-01", [_pr("p1", 50), _pr("p2", 30)]))
    payload = _game_payload("g2", "2026-01-02", [_pr("p2", 60), _pr("p1", 40)])
    payload["awards"] = [_award("p1", ["p2"])]
    report = client.get(f"/games/{_post_game(client, payload)}/report").json()
    score = {r["code"]: r for r in report["records_broken"]}["highest_single_game_score"]
    assert score["value"] == 60 and score["player_id"] == "p2"
    assert score["previous"] == {"value": 50, "player_id": "p1", "holders": ["p1"]}
    assert score["description"]  # el informe muestra qué mide el récord (F29)
    assert report["stolen_awards"] == [{"award": "Magnate", "player_id": "p2", "opened_by": "p1"}]


def test_report_lists_near_records_and_unlocked_achievements(client, players):
    _post_game(client, _game_payload("g1", "2026-01-01", [_pr("p1", 50), _pr("p2", 30)]))
    report = client.get(f"/games/{_post_game(client, _game_payload('g2', '2026-01-02', [_pr('p1', 48), _pr('p2', 30)]))}/report").json()
    near = {n["code"]: n for n in report["near"]}
    assert near["highest_single_game_score"]["gap"] == 2 and near["highest_single_game_score"]["before"] == 50
    unlocks = {a["code"]: a for a in report["achievements_by_player"]["p1"]}
    assert "win_streak" in unlocks
    assert unlocks["win_streak"]["max_tier"] > 1 and unlocks["win_streak"]["levels"] >= 1  # «Nivel N de M» (F29)


def test_report_of_a_missing_game_is_404(client):
    assert client.get("/games/no-existe/report").status_code == 404


def test_summaries_are_newest_first_and_follow_the_subset(client, players):
    _post_game(client, _game_payload("g1", "2026-01-01", [_pr("p1", 50), _pr("p2", 30)]))
    _post_game(client, _game_payload("g2", "2026-01-02", [_pr("p3", 50), _pr("p2", 50), _pr("p1", 10)]))
    rows = client.get("/games/summaries").json()
    assert [r["id"] for r in rows] == ["g2", "g1"]
    assert rows[0]["decided_by_mc"] and rows[0]["player_count"] == 3
    assert [r["id"] for r in client.get("/games/summaries?player_count=2").json()] == ["g1"]
    assert client.get("/games/summaries?player_count=7").status_code == 422


def test_a_tie_on_points_decided_by_mc_in_a_two_player_game(client, players):
    payload = _game_payload("g1", "2026-01-01", [_pr("p1", 40), _pr("p2", 40)])
    payload["player_results"][1]["end_stats"]["mc_total"] = 9
    report = client.post("/games/", json=payload).json()["report"]
    assert report["decided_by_mc"] and report["winners"] == ["p2"] and report["margin"] == 0


def test_editing_returns_the_report_and_the_old_message(client, players):
    _post_game(client, _game_payload("g1", "2026-01-01", [_pr("p1", 50), _pr("p2", 30)]))
    body = client.put("/games/g1", json=_game_payload("g1", "2026-01-01", [_pr("p1", 30), _pr("p2", 50)])).json()
    assert body["message"] == "Game updated successfully" and body["report"]["winners"] == ["p2"]


def test_shared_records_list_every_holder(client, players):
    _post_game(client, _game_payload("g1", "2026-01-01", [_pr("p1", 50), _pr("p2", 50)]))
    report = client.get(f"/games/{_post_game(client, _game_payload('g2', '2026-01-02', [_pr('p3', 50), _pr('p1', 20)]))}/report").json()
    tied = {t["code"]: t for t in report["records_tied"]}["highest_single_game_score"]
    assert tied["holders"] == ["p3"] and tied["value"] == 50
    report = client.get(f"/games/{_post_game(client, _game_payload('g3', '2026-01-03', [_pr('p2', 60), _pr('p1', 20)]))}/report").json()
    broken = {b["code"]: b for b in report["records_broken"]}["highest_single_game_score"]
    assert sorted(broken["previous"]["holders"]) == ["p1", "p2", "p3"]


def test_an_empty_subset_has_no_summaries(client, players):
    _post_game(client, _game_payload("g1", "2026-01-01", [_pr("p1", 50), _pr("p2", 30)]))
    assert client.get("/games/summaries?map=Tharsis").json() == []
