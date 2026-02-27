import json
from datetime import date

import pytest

from backend.models.player import Player
from backend.mappers.game_mapper import game_dto_to_model
from backend.schemas.game import GameDTO
from backend.schemas.player import PlayerResultDTO, PlayerScoreDTO, PlayerEndStatsDTO
from backend.models.enums import Corporation, MapName


def test_create_game_and_query_results(client, players_repo):
    # insert two players directly into the database
    players_repo.create(Player(player_id="p1", name="Alice"))
    players_repo.create(Player(player_id="p2", name="Bob"))

    payload = {
        "date": "2026-01-01",
        "map": "Hellas",
        "expansions": [],
        "draft": False,
        "generations": 1,
        "player_results": [
            {"player_id": "p1", "corporation": "Credicor", "scores": {
                "terraform_rating": 10,
                "milestone_points": 0,
                "milestones": [],
                "award_points": 0,
                "card_points": 0,
                "card_resource_points": 0,
                "greenery_points": 0,
                "city_points": 0,
                "turmoil_points": None
            }, "end_stats": {"mc_total": 5}},
            {"player_id": "p2", "corporation": "Ecoline", "scores": {
                "terraform_rating": 5,
                "milestone_points": 0,
                "milestones": [],
                "award_points": 0,
                "card_points": 0,
                "card_resource_points": 0,
                "greenery_points": 0,
                "city_points": 0,
                "turmoil_points": None
            }, "end_stats": {"mc_total": 3}}
        ],
        "awards": []
    }

    resp = client.post("/games/", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    game_id = data["id"]

    # fetch results via API and check that Alice finished first
    r2 = client.get(f"/games/{game_id}/results")
    assert r2.status_code == 200
    results = r2.json()["results"]
    assert results[0]["player_id"] == "p1"
    assert results[0]["position"] == 1


def test_player_profile_endpoint(client, players_repo, games_repo):
    # register a player
    players_repo.create(Player(player_id="p3", name="Carol"))

    # create a game domain object and persist it via repository
    from backend.models.game import Game
    from backend.models.player_result import PlayerResult, PlayerScore, PlayerEndStats

    game = Game(
        game_id=None,
        date=date(2026, 2, 2),
        map_name=MapName.HELLAS,
        expansions=[],
        draft=False,
        generations=1,
        player_results=[
            PlayerResult(
                player_id="p3",
                corporation=Corporation.CREDICOR,
                scores=PlayerScore(
                    terraform_rating=20,
                    milestone_points=0,
                    milestones=[],
                    award_points=0,
                    card_points=0,
                    card_resource_points=0,
                    greenery_points=0,
                    city_points=0,
                    turmoil_points=None,
                ),
                end_stats=PlayerEndStats(mc_total=7),
            )
        ],
        awards=[],
    )
    games_repo.create(game)

    r = client.get("/players/p3/profile")
    assert r.status_code == 200
    profile = r.json()
    assert profile["player_id"] == "p3"
    assert profile["stats"]["games_played"] == 1
