"""Integration tests for achievements-related REST endpoints."""
from datetime import date

import pytest

from fastapi.testclient import TestClient
from main import app
from models.player import Player
from mappers.game_mapper import game_dto_to_model
from schemas.game import GameDTO
from schemas.player import PlayerResultDTO, PlayerScoreDTO, PlayerEndStatsDTO
from models.enums import Corporation


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def session_factory():
    from db.session import get_session
    return get_session


@pytest.fixture
def players_repo(session_factory):
    from repositories.player_repository import PlayersRepository
    return PlayersRepository(session_factory=session_factory)


@pytest.fixture
def games_repo(session_factory):
    from repositories.game_repository import GamesRepository
    return GamesRepository(session_factory=session_factory)


def _make_player_result(player_id: str, corp: str, score: int) -> dict:
    return {
        "player_id": player_id,
        "corporation": corp,
        "scores": {
            "terraform_rating": score,
            "milestone_points": 0,
            "milestones": [],
            "award_points": 0,
            "card_points": 0,
            "card_resource_points": 0,
            "greenery_points": 0,
            "city_points": 0,
            "turmoil_points": None,
        },
        "end_stats": {"mc_total": 5},
    }


def _create_game(client, game_id: str, players: list[dict]) -> str:
    payload = {
        "id": game_id,
        "date": "2026-01-01",
        "map": "Hellas",
        "expansions": [],
        "draft": False,
        "generations": 10,
        "player_results": players,
        "awards": [],
    }
    response = client.post("/games/", json=payload)
    assert response.status_code == 200
    return response.json()["id"]


def test_trigger_achievements_returns_200(client, players_repo):
    """POST /games/{game_id}/achievements returns 200 with achievements_by_player key."""
    players_repo.create(Player(player_id="p1", name="Alice"))
    players_repo.create(Player(player_id="p2", name="Bob"))

    game_id = _create_game(
        client,
        "game-ach-1",
        [
            _make_player_result("p1", "Credicor", 30),
            _make_player_result("p2", "Ecoline", 20),
        ],
    )

    response = client.post(f"/games/{game_id}/achievements")
    assert response.status_code == 200
    data = response.json()
    assert "achievements_by_player" in data


def test_trigger_achievements_nonexistent_game(client):
    """POST /games/nonexistent/achievements returns 200 with empty achievements_by_player (service catches, never 500)."""
    response = client.post("/games/nonexistent-game-id/achievements")
    assert response.status_code == 200
    data = response.json()
    assert "achievements_by_player" in data
    assert data["achievements_by_player"] == {}


def test_get_player_achievements(client, players_repo):
    """GET /players/{player_id}/achievements returns 200 with achievements list containing all defined achievements (6 items)."""
    players_repo.create(Player(player_id="p10", name="Charlie"))

    response = client.get("/players/p10/achievements")
    assert response.status_code == 200
    data = response.json()
    assert "achievements" in data
    # All 6 evaluators from ALL_EVALUATORS should appear (locked or unlocked)
    assert len(data["achievements"]) == 6
    for item in data["achievements"]:
        assert "code" in item
        assert "title" in item
        assert "tier" in item
        assert "unlocked" in item


def test_get_catalog(client):
    """GET /achievements/catalog returns 200 with achievements list containing all defined achievements (6 items)."""
    response = client.get("/achievements/catalog")
    assert response.status_code == 200
    data = response.json()
    assert "achievements" in data
    assert len(data["achievements"]) == 6


def test_catalog_has_tiers_and_holders(client):
    """Each catalog item has tiers array and holders array."""
    response = client.get("/achievements/catalog")
    assert response.status_code == 200
    data = response.json()
    for item in data["achievements"]:
        assert "tiers" in item
        assert isinstance(item["tiers"], list)
        assert "holders" in item
        assert isinstance(item["holders"], list)
        # Each tier has the expected fields
        for tier in item["tiers"]:
            assert "level" in tier
            assert "threshold" in tier
            assert "title" in tier


def test_reconcile_returns_200_with_summary(client):
    """POST /achievements/reconcile returns 200 with summary shape."""
    response = client.post("/achievements/reconcile")
    assert response.status_code == 200
    data = response.json()
    assert "total_players" in data
    assert "players_updated" in data
    assert isinstance(data["achievements_applied"], list)
    assert isinstance(data["errors"], list)
