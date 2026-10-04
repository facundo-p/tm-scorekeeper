"""Logros derivados por HTTP (F23, STAT-04..07): recálculo en cada escritura, lectura
repetible de la partida, vista por mesa sin escritura y derived_version (D-13)."""
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from main import app
from models.player import Player
from repositories.achievement_repository import AchievementRepository, AppMetaRepository
from repositories.container import elo_repository, games_repository
from repositories.player_repository import PlayersRepository
from services.container import derived_service
from services.derived_service import DERIVED_VERSION, VERSION_KEY

from _elo_helpers import _game_payload, _post_game, _pr


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def players():
    for pid, name in (("p1", "Alice"), ("p2", "Bob"), ("p3", "Cara")):
        PlayersRepository().create(Player(player_id=pid, name=name))


def _win(game_id, day, winner, loser):
    return _game_payload(game_id, f"2026-01-{day:02d}", [_pr(winner, 50), _pr(loser, 30)])


def _codes(client, path):
    return {a["code"]: a for a in client.get(path).json()["achievements"]}


def test_creating_games_unlocks_levels_dated_with_their_game(client, players):
    _post_game(client, _win("g1", 1, "p1", "p2"))
    _post_game(client, _win("g2", 2, "p1", "p2"))
    streak = _codes(client, "/players/p1/achievements")["win_streak"]
    assert streak["tier"] == 1 and streak["value"] == 2 and streak["kind"] == "max"
    assert streak["unlocks"] == [{"level": 1, "date": "2026-01-02", "game_id": "g2"}]
    assert streak["unlocked_at"] == "2026-01-02" and streak["progress"] == {"current": 2, "target": 3}


def test_post_game_achievements_is_a_repeatable_read(client, players):
    _post_game(client, _win("g1", 1, "p1", "p2"))
    first = client.post("/games/g1/achievements").json()["achievements_by_player"]
    assert client.post("/games/g1/achievements").json()["achievements_by_player"] == first
    by_code = {a["code"]: a for a in first["p1"]}
    assert by_code["no_milestone_win"]["is_new"] and not by_code["no_milestone_win"]["is_upgrade"]
    assert by_code["no_milestone_win"]["title"] == "Lobo Solitario" and by_code["no_milestone_win"]["glyph"] == "lone"


def test_editing_and_deleting_games_update_the_unlocks(client, players):
    _post_game(client, _win("g1", 1, "p1", "p2"))
    _post_game(client, _win("g2", 2, "p1", "p2"))
    assert _codes(client, "/players/p1/achievements")["win_streak"]["tier"] == 1
    assert client.put("/games/g2", json=_win("g2", 2, "p2", "p1")).status_code == 200
    assert _codes(client, "/players/p1/achievements")["win_streak"]["tier"] == 0
    assert client.delete("/games/g1").status_code in (200, 204)
    assert {r.game_id for r in AchievementRepository().get_all()} == {"g2"}


def test_table_view_is_labelled_and_never_writes(client, players):
    _post_game(client, _win("g1", 1, "p1", "p2"))
    stored = AchievementRepository().get_all()
    body = client.get("/players/p1/achievements?player_count=3").json()
    assert body["view"] == "mesa" and all(a["tier"] == 0 for a in body["achievements"])
    assert client.get("/achievements/catalog?player_count=2").json()["view"] == "mesa"
    assert client.get("/players/p1/achievements").json()["view"] == "all"
    assert AchievementRepository().get_all() == stored


@pytest.mark.parametrize("path", ["/players/p1/achievements?player_count=1", "/achievements/catalog?player_count=6"])
def test_table_size_out_of_range_is_422(client, players, path):
    assert client.get(path).status_code == 422


def test_catalog_lists_the_eighteen_achievements_with_holders(client, players):
    _post_game(client, _win("g1", 1, "p1", "p2"))
    catalog = {a["code"]: a for a in client.get("/achievements/catalog").json()["achievements"]}
    assert len(catalog) == 18
    assert catalog["corp_collector"]["glyph"] == "corp" and catalog["corp_collector"]["tiers"][0]["threshold"] == 5
    holders = catalog["no_milestone_win"]["holders"]
    assert holders == [{"player_id": "p1", "player_name": "Alice", "tier": 1, "unlocked_at": "2026-01-01"}]


def test_player_without_games_has_every_achievement_locked(client, players):
    achievements = client.get("/players/p3/achievements").json()["achievements"]
    assert len(achievements) == 18 and not any(a["unlocked"] for a in achievements)


def test_reconcile_regenerates_and_reports_changes(client, players):
    _post_game(client, _win("g1", 1, "p1", "p2"))
    AchievementRepository().replace_all([])
    body = client.post("/achievements/reconcile").json()
    assert body["players_updated"] == 1 and body["errors"] == []
    assert {c["code"] for c in body["achievements_applied"]} >= {"no_milestone_win", "no_award_win"}


def test_startup_recomputes_when_derived_version_is_behind(players):
    with TestClient(app):
        pass
    assert AppMetaRepository().get(VERSION_KEY) == str(DERIVED_VERSION)
    assert derived_service.ensure_current() is False
    AppMetaRepository().set(VERSION_KEY, "0")
    assert derived_service.ensure_current() is True


def test_table_view_counts_only_games_of_that_size(client, players):
    _post_game(client, _win("g1", 1, "p1", "p2"))
    _post_game(client, _game_payload("g2", "2026-01-02", [_pr("p2", 50), _pr("p1", 30), _pr("p3", 20)]))
    two = _codes(client, "/players/p1/achievements?player_count=2")
    assert two["games_played"]["value"] == 1 and two["no_milestone_win"]["tier"] == 1
    three = _codes(client, "/players/p1/achievements?player_count=3")
    assert three["games_played"]["value"] == 1 and three["no_milestone_win"]["tier"] == 0
    catalog = {a["code"]: a for a in client.get("/achievements/catalog?player_count=3").json()["achievements"]}
    assert [h["player_id"] for h in catalog["no_milestone_win"]["holders"]] == ["p2"]


def test_a_failing_recompute_rolls_back_the_whole_write(client, players):
    with patch("services.container.achievements_service.recompute_all", side_effect=RuntimeError("boom")):
        with pytest.raises(RuntimeError):
            client.post("/games/", json=_win("g1", 1, "p1", "p2"))
    assert games_repository.get("g1") is None
    assert elo_repository.get_changes_for_game("g1") == []
    assert AchievementRepository().get_all() == []


def test_the_api_starts_even_if_the_startup_recompute_fails(players):
    with patch("main.derived_service.ensure_current", side_effect=RuntimeError("boom")):
        with TestClient(app) as started:
            assert started.get("/health").status_code == 200
    assert AppMetaRepository().get(VERSION_KEY) is None
