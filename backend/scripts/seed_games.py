"""
Seed script: creates sample games with full data for local development.

Usage:
    cd backend && python scripts/seed_games.py

Requires players to already exist (run seed.py first or SEED_DATA=true).
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests

BASE_URL = os.getenv("API_URL", "http://localhost:8000")

# Fetch player IDs by name
def get_players():
    resp = requests.get(f"{BASE_URL}/players/")
    resp.raise_for_status()
    return {p["name"]: p["player_id"] for p in resp.json()}


def create_game(game_data):
    resp = requests.post(f"{BASE_URL}/games/", json=game_data)
    if resp.status_code != 200:
        print(f"  ERROR: {resp.status_code} - {resp.text[:200]}")
        return None
    result = resp.json()
    print(f"  Created game {result['id']}")
    return result


def seed(players):
    p = players  # shorthand

    games = [
        # Game 1: Tharsis, 4 players, Prelude
        {
            "date": "2025-11-10",
            "map": "Tharsis",
            "expansions": ["Prelude"],
            "draft": True,
            "generations": 12,
            "player_results": [
                {
                    "player_id": p["Facu"],
                    "corporation": "Credicor",
                    "scores": {
                        "terraform_rating": 38,
                        "milestone_points": 10,
                        "milestones": ["Terraformer", "Builder"],
                        "award_points": 10,
                        "card_points": 18,
                        "card_resource_points": 6,
                        "greenery_points": 14,
                        "city_points": 12,
                        "turmoil_points": None,
                    },
                    "end_stats": {"mc_total": 45},
                },
                {
                    "player_id": p["Bru"],
                    "corporation": "Ecoline",
                    "scores": {
                        "terraform_rating": 34,
                        "milestone_points": 5,
                        "milestones": ["Gardener"],
                        "award_points": 5,
                        "card_points": 12,
                        "card_resource_points": 3,
                        "greenery_points": 18,
                        "city_points": 6,
                        "turmoil_points": None,
                    },
                    "end_stats": {"mc_total": 22},
                },
                {
                    "player_id": p["Marian"],
                    "corporation": "Thorgate",
                    "scores": {
                        "terraform_rating": 30,
                        "milestone_points": 0,
                        "milestones": [],
                        "award_points": 5,
                        "card_points": 15,
                        "card_resource_points": 8,
                        "greenery_points": 8,
                        "city_points": 10,
                        "turmoil_points": None,
                    },
                    "end_stats": {"mc_total": 38},
                },
                {
                    "player_id": p["Efra"],
                    "corporation": "Inventrix",
                    "scores": {
                        "terraform_rating": 28,
                        "milestone_points": 0,
                        "milestones": [],
                        "award_points": 0,
                        "card_points": 20,
                        "card_resource_points": 10,
                        "greenery_points": 6,
                        "city_points": 4,
                        "turmoil_points": None,
                    },
                    "end_stats": {"mc_total": 55},
                },
            ],
            "awards": [
                {"name": "Landlord", "opened_by": p["Facu"], "first_place": [p["Bru"]], "second_place": [p["Facu"]]},
                {"name": "Banker", "opened_by": p["Marian"], "first_place": [p["Efra"]], "second_place": [p["Marian"]]},
                {"name": "Scientist", "opened_by": p["Efra"], "first_place": [p["Facu"], p["Marian"]], "second_place": []},
            ],
        },
        # Game 2: Hellas, 5 players, Prelude+Colonies
        {
            "date": "2025-12-01",
            "map": "Hellas",
            "expansions": ["Prelude", "Colonies"],
            "draft": True,
            "generations": 14,
            "player_results": [
                {
                    "player_id": p["Bru"],
                    "corporation": "Arklight",
                    "scores": {
                        "terraform_rating": 42,
                        "milestone_points": 5,
                        "milestones": ["Diversifier"],
                        "award_points": 10,
                        "card_points": 22,
                        "card_resource_points": 12,
                        "greenery_points": 10,
                        "city_points": 14,
                        "turmoil_points": None,
                    },
                    "end_stats": {"mc_total": 30},
                },
                {
                    "player_id": p["Facu"],
                    "corporation": "Point Luna",
                    "scores": {
                        "terraform_rating": 36,
                        "milestone_points": 10,
                        "milestones": ["Tactician", "Polar Explorer"],
                        "award_points": 5,
                        "card_points": 16,
                        "card_resource_points": 4,
                        "greenery_points": 12,
                        "city_points": 8,
                        "turmoil_points": None,
                    },
                    "end_stats": {"mc_total": 18},
                },
                {
                    "player_id": p["Clau"],
                    "corporation": "Poseidon",
                    "scores": {
                        "terraform_rating": 32,
                        "milestone_points": 0,
                        "milestones": [],
                        "award_points": 5,
                        "card_points": 14,
                        "card_resource_points": 6,
                        "greenery_points": 6,
                        "city_points": 12,
                        "turmoil_points": None,
                    },
                    "end_stats": {"mc_total": 62},
                },
                {
                    "player_id": p["Albert"],
                    "corporation": "Saturn Systems",
                    "scores": {
                        "terraform_rating": 30,
                        "milestone_points": 0,
                        "milestones": [],
                        "award_points": 0,
                        "card_points": 10,
                        "card_resource_points": 2,
                        "greenery_points": 8,
                        "city_points": 6,
                        "turmoil_points": None,
                    },
                    "end_stats": {"mc_total": 40},
                },
                {
                    "player_id": p["Efra"],
                    "corporation": "Teractor",
                    "scores": {
                        "terraform_rating": 26,
                        "milestone_points": 0,
                        "milestones": [],
                        "award_points": 0,
                        "card_points": 24,
                        "card_resource_points": 14,
                        "greenery_points": 4,
                        "city_points": 4,
                        "turmoil_points": None,
                    },
                    "end_stats": {"mc_total": 70},
                },
            ],
            "awards": [
                {"name": "Cultivator", "opened_by": p["Bru"], "first_place": [p["Bru"]], "second_place": [p["Facu"]]},
                {"name": "Magnate", "opened_by": p["Efra"], "first_place": [p["Efra"]], "second_place": [p["Bru"]]},
            ],
        },
        # Game 3: Elysium, 3 players, Turmoil
        {
            "date": "2026-01-15",
            "map": "Elysium",
            "expansions": ["Turmoil"],
            "draft": False,
            "generations": 11,
            "player_results": [
                {
                    "player_id": p["Marian"],
                    "corporation": "Septem Tribus",
                    "scores": {
                        "terraform_rating": 35,
                        "milestone_points": 10,
                        "milestones": ["Generalist", "Tycoon"],
                        "award_points": 5,
                        "card_points": 14,
                        "card_resource_points": 5,
                        "greenery_points": 10,
                        "city_points": 16,
                        "turmoil_points": 8,
                    },
                    "end_stats": {"mc_total": 28},
                },
                {
                    "player_id": p["Facu"],
                    "corporation": "Pristar",
                    "scores": {
                        "terraform_rating": 32,
                        "milestone_points": 5,
                        "milestones": ["Legend"],
                        "award_points": 10,
                        "card_points": 10,
                        "card_resource_points": 3,
                        "greenery_points": 12,
                        "city_points": 10,
                        "turmoil_points": 12,
                    },
                    "end_stats": {"mc_total": 35},
                },
                {
                    "player_id": p["Clau"],
                    "corporation": "Helion",
                    "scores": {
                        "terraform_rating": 28,
                        "milestone_points": 0,
                        "milestones": [],
                        "award_points": 5,
                        "card_points": 8,
                        "card_resource_points": 2,
                        "greenery_points": 14,
                        "city_points": 8,
                        "turmoil_points": 6,
                    },
                    "end_stats": {"mc_total": 50},
                },
            ],
            "awards": [
                {"name": "Celebrity", "opened_by": p["Marian"], "first_place": [p["Marian"]], "second_place": [p["Facu"]]},
                {"name": "Estate Dealer", "opened_by": p["Facu"], "first_place": [p["Facu"]], "second_place": [p["Clau"]]},
            ],
        },
        # Game 4: Tharsis, 4 players, Prelude+Turmoil (high scores game)
        {
            "date": "2026-02-20",
            "map": "Tharsis",
            "expansions": ["Prelude", "Turmoil"],
            "draft": True,
            "generations": 13,
            "player_results": [
                {
                    "player_id": p["Efra"],
                    "corporation": "Vitor",
                    "scores": {
                        "terraform_rating": 40,
                        "milestone_points": 5,
                        "milestones": ["Planner"],
                        "award_points": 10,
                        "card_points": 28,
                        "card_resource_points": 16,
                        "greenery_points": 8,
                        "city_points": 10,
                        "turmoil_points": 10,
                    },
                    "end_stats": {"mc_total": 32},
                },
                {
                    "player_id": p["Facu"],
                    "corporation": "Tharsis Republic",
                    "scores": {
                        "terraform_rating": 36,
                        "milestone_points": 10,
                        "milestones": ["Mayor", "Terraformer"],
                        "award_points": 5,
                        "card_points": 12,
                        "card_resource_points": 4,
                        "greenery_points": 16,
                        "city_points": 18,
                        "turmoil_points": 6,
                    },
                    "end_stats": {"mc_total": 20},
                },
                {
                    "player_id": p["Bru"],
                    "corporation": "Phobolog",
                    "scores": {
                        "terraform_rating": 34,
                        "milestone_points": 0,
                        "milestones": [],
                        "award_points": 5,
                        "card_points": 16,
                        "card_resource_points": 8,
                        "greenery_points": 10,
                        "city_points": 8,
                        "turmoil_points": 4,
                    },
                    "end_stats": {"mc_total": 42},
                },
                {
                    "player_id": p["Albert"],
                    "corporation": "Utopia Invest",
                    "scores": {
                        "terraform_rating": 30,
                        "milestone_points": 0,
                        "milestones": [],
                        "award_points": 0,
                        "card_points": 10,
                        "card_resource_points": 5,
                        "greenery_points": 20,
                        "city_points": 4,
                        "turmoil_points": 8,
                    },
                    "end_stats": {"mc_total": 15},
                },
            ],
            "awards": [
                {"name": "Landlord", "opened_by": p["Facu"], "first_place": [p["Albert"]], "second_place": [p["Facu"]]},
                {"name": "Miner", "opened_by": p["Bru"], "first_place": [p["Bru"]], "second_place": [p["Efra"]]},
                {"name": "Thermalist", "opened_by": p["Efra"], "first_place": [p["Efra"]], "second_place": [p["Facu"]]},
            ],
        },
        # Game 5: Amazonis, 5 players, all expansions
        {
            "date": "2026-03-10",
            "map": "Amazonis Planitia",
            "expansions": ["Prelude", "Colonies", "Turmoil", "Venus next"],
            "draft": True,
            "generations": 15,
            "player_results": [
                {
                    "player_id": p["Facu"],
                    "corporation": "Morning Star Inc.",
                    "scores": {
                        "terraform_rating": 44,
                        "milestone_points": 10,
                        "milestones": ["Terran", "Sponsor"],
                        "award_points": 10,
                        "card_points": 20,
                        "card_resource_points": 8,
                        "greenery_points": 12,
                        "city_points": 14,
                        "turmoil_points": 14,
                    },
                    "end_stats": {"mc_total": 48},
                },
                {
                    "player_id": p["Marian"],
                    "corporation": "Stormcraft Incorporated",
                    "scores": {
                        "terraform_rating": 38,
                        "milestone_points": 5,
                        "milestones": ["Merchant"],
                        "award_points": 5,
                        "card_points": 18,
                        "card_resource_points": 10,
                        "greenery_points": 8,
                        "city_points": 12,
                        "turmoil_points": 10,
                    },
                    "end_stats": {"mc_total": 35},
                },
                {
                    "player_id": p["Efra"],
                    "corporation": "Celestic",
                    "scores": {
                        "terraform_rating": 34,
                        "milestone_points": 0,
                        "milestones": [],
                        "award_points": 5,
                        "card_points": 22,
                        "card_resource_points": 18,
                        "greenery_points": 6,
                        "city_points": 6,
                        "turmoil_points": 8,
                    },
                    "end_stats": {"mc_total": 60},
                },
                {
                    "player_id": p["Bru"],
                    "corporation": "Polyphemos",
                    "scores": {
                        "terraform_rating": 32,
                        "milestone_points": 0,
                        "milestones": [],
                        "award_points": 0,
                        "card_points": 14,
                        "card_resource_points": 6,
                        "greenery_points": 16,
                        "city_points": 10,
                        "turmoil_points": 4,
                    },
                    "end_stats": {"mc_total": 25},
                },
                {
                    "player_id": p["Clau"],
                    "corporation": "Aphrodite",
                    "scores": {
                        "terraform_rating": 30,
                        "milestone_points": 0,
                        "milestones": [],
                        "award_points": 5,
                        "card_points": 10,
                        "card_resource_points": 4,
                        "greenery_points": 10,
                        "city_points": 8,
                        "turmoil_points": 6,
                    },
                    "end_stats": {"mc_total": 42},
                },
            ],
            "awards": [
                {"name": "Collector", "opened_by": p["Efra"], "first_place": [p["Efra"]], "second_place": [p["Facu"]]},
                {"name": "Physicist", "opened_by": p["Facu"], "first_place": [p["Facu"]], "second_place": [p["Marian"]]},
                {"name": "Manufacturer", "opened_by": p["Marian"], "first_place": [p["Marian"]], "second_place": [p["Clau"]]},
            ],
        },
    ]

    print(f"Creating {len(games)} games...")
    for i, game in enumerate(games, 1):
        print(f"\nGame {i}: {game['map']} ({game['date']})")
        create_game(game)


if __name__ == "__main__":
    print("Fetching players...")
    players = get_players()
    print(f"Found {len(players)} players: {', '.join(players.keys())}")

    required = ["Facu", "Bru", "Marian", "Efra", "Clau", "Albert"]
    missing = [n for n in required if n not in players]
    if missing:
        print(f"\nERROR: Missing players: {missing}")
        print("Run the backend with SEED_DATA=true first, or create them via API.")
        sys.exit(1)

    seed(players)
    print("\nDone! 5 games created.")
