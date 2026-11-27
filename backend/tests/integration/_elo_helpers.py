"""
Shared helpers for ELO integration tests.

Extracted from test_elo_cascade.py per CLAUDE.md §3 (no code duplication).
Used by test_elo_routes.py (Phase 8). The original copies in test_elo_cascade.py
remain in place — consolidating that file is OUT OF SCOPE for Phase 8.

The leading underscore marks this module as test-internal. Pytest does NOT
collect modules whose name starts with `_`, so this file is not a test file.
"""


def _player_result(player_id: str, terraform_rating: int, corp: str = "Credicor") -> dict:
    return {
        "player_id": player_id,
        "corporation": corp,
        "scores": {
            "terraform_rating": terraform_rating,
            "milestone_points": 0,
            "milestones": [],
            "award_points": 0,
            "card_points": 0,
            "card_resource_points": 0,
            "greenery_points": 0,
            "city_points": 0,
            "turmoil_points": None,
        },
        "end_stats": {"mc_total": 0},
    }


_CORP_BY_PLAYER = {"p1": "Credicor", "p2": "Ecoline", "p3": "Helion"}


def _pr(player_id: str, terraform_rating: int) -> dict:
    return _player_result(player_id, terraform_rating, _CORP_BY_PLAYER[player_id])


def _game_payload(game_id: str, on_date: str, results: list[dict]) -> dict:
    return {
        "id": game_id,
        "date": on_date,
        "map": "Hellas",
        "expansions": [],
        "draft": False,
        "generations": 10,
        "player_results": results,
        "awards": [],
    }


def _post_game(client, payload: dict) -> str:
    res = client.post("/games/", json=payload)
    assert res.status_code == 200, res.json()
    return res.json()["id"]
