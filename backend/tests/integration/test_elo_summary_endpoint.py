"""
Integration tests for the player ELO summary endpoint.

Covers all backend behaviors mandated by Phase 9 PROF-01..PROF-04:
current_elo, last_delta, peak_elo, rank (with active-only scope and
player_id ASC tie-break per CONTEXT D-04 / D-06), 0-games nullable
shape (D-05), inactive-player rank null (D-18), single-active-player
case (#1 of 1), 404 for unknown player, and cascade-after-edit
freshness (D-19, no-cache discipline).

Tests are intentionally RED on the first commit (Task 1 / Wave 0):
the endpoint, schema, repository methods and service method do not
yet exist. They go GREEN once Tasks 2 and 3 complete.
"""
from datetime import date

import pytest

from fastapi.testclient import TestClient
from main import app
from models.player import Player


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def players_repo():
    from repositories.player_repository import PlayersRepository
    return PlayersRepository()


@pytest.fixture
def elo_repo():
    from repositories.elo_repository import EloRepository
    return EloRepository()


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


# Distinct corps per player so each game passes the unique-corp validation.
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


def _seed_three_players(players_repo) -> list[str]:
    players_repo.create(Player(player_id="p1", name="Alice"))
    players_repo.create(Player(player_id="p2", name="Bob"))
    players_repo.create(Player(player_id="p3", name="Cara"))
    return ["p1", "p2", "p3"]


# --------------------------- PROF-01: current_elo ---------------------------


def test_returns_current_elo(client, players_repo):
    """GET /players/{p1}/elo-summary returns current_elo == players.elo after a game."""
    _seed_three_players(players_repo)
    _post_game(
        client,
        _game_payload(
            "g1", "2026-01-01",
            [_pr("p1", 80), _pr("p2", 50), _pr("p3", 30)],
        ),
    )

    response = client.get("/players/p1/elo-summary")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["current_elo"], int)
    expected_elo = players_repo.get("p1").elo
    assert body["current_elo"] == expected_elo
    # Must have moved from seed (winner gains).
    assert body["current_elo"] != 1000


# --------------------------- PROF-02: last_delta ---------------------------


def test_returns_last_delta_after_win(client, players_repo):
    """After p1 wins one game, last_delta is a positive int."""
    _seed_three_players(players_repo)
    _post_game(
        client,
        _game_payload(
            "g1", "2026-01-01",
            [_pr("p1", 80), _pr("p2", 50), _pr("p3", 30)],
        ),
    )

    response = client.get("/players/p1/elo-summary")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["last_delta"], int)
    assert body["last_delta"] > 0


# ----------------------- PROF-02 / PROF-03 / PROF-04 ------------------------


def test_zero_games_returns_nulls(client, players_repo):
    """Player with 0 games: current_elo=1000 seed, peak_elo / last_delta null.

    Per D-05 the endpoint always returns 200; per D-18 a single active
    player still receives rank = {1, 1}.
    """
    players_repo.create(Player(player_id="p1", name="Alice", is_active=True))

    response = client.get("/players/p1/elo-summary")

    assert response.status_code == 200
    body = response.json()
    assert body["current_elo"] == 1000
    assert body["peak_elo"] is None
    assert body["last_delta"] is None
    assert body["rank"] == {"position": 1, "total": 1}


# ----------------------------- PROF-03: peak_elo ----------------------------


def test_returns_peak_elo(client, players_repo):
    """peak_elo == max(elo_after) over all PlayerEloHistory rows for the player."""
    _seed_three_players(players_repo)
    _post_game(
        client,
        _game_payload("g1", "2026-01-01",
                      [_pr("p1", 80), _pr("p2", 50), _pr("p3", 30)]),
    )
    _post_game(
        client,
        _game_payload("g2", "2026-02-01",
                      [_pr("p2", 80), _pr("p3", 50), _pr("p1", 30)]),
    )
    _post_game(
        client,
        _game_payload("g3", "2026-03-01",
                      [_pr("p1", 80), _pr("p3", 50), _pr("p2", 30)]),
    )

    response = client.get("/players/p1/elo-summary")
    assert response.status_code == 200
    body = response.json()

    # Compute expected peak directly from the elo-history rows for p1.
    from db.session import get_session
    from db.models import PlayerEloHistory as PlayerEloHistoryORM

    with get_session() as session:
        elo_afters = [
            r.elo_after
            for r in session.query(PlayerEloHistoryORM)
            .filter(PlayerEloHistoryORM.player_id == "p1")
            .all()
        ]
    expected_peak = max(elo_afters)
    assert body["peak_elo"] == expected_peak
    # Must be at least the player's current elo (peak ≥ current trivially).
    assert body["peak_elo"] >= body["current_elo"]


# ------------------------------- PROF-04: rank ------------------------------


def test_returns_rank_for_active_player(client, players_repo):
    """rank.position is 1-based and rank.total counts active players."""
    _seed_three_players(players_repo)
    _post_game(
        client,
        _game_payload("g1", "2026-01-01",
                      [_pr("p1", 80), _pr("p2", 50), _pr("p3", 30)]),
    )

    response = client.get("/players/p1/elo-summary")
    assert response.status_code == 200
    body = response.json()
    assert body["rank"] is not None
    assert body["rank"]["total"] == 3
    # p1 won → top of the active rank
    assert body["rank"]["position"] == 1


def test_tie_break_by_player_id(client, players_repo):
    """When two active players share elo, player_id ASC breaks the tie (D-06)."""
    players_repo.create(Player(player_id="aa", name="Alice", is_active=True))
    players_repo.create(Player(player_id="bb", name="Bob", is_active=True))

    a = client.get("/players/aa/elo-summary").json()
    b = client.get("/players/bb/elo-summary").json()

    assert a["rank"] == {"position": 1, "total": 2}
    assert b["rank"] == {"position": 2, "total": 2}


def test_inactive_excluded_from_rank_total(client, players_repo):
    """rank.total counts only active players (D-04)."""
    players_repo.create(Player(player_id="p1", name="Alice", is_active=True))
    players_repo.create(Player(player_id="p2", name="Bob", is_active=True))
    players_repo.create(Player(player_id="p3", name="Cara", is_active=False))

    response = client.get("/players/p1/elo-summary")
    assert response.status_code == 200
    body = response.json()
    assert body["rank"] is not None
    assert body["rank"]["total"] == 2


def test_inactive_player_gets_null_rank(client, players_repo):
    """Inactive player → rank == None (D-18)."""
    players_repo.create(Player(player_id="p1", name="Alice", is_active=True))
    players_repo.create(Player(player_id="p2", name="Inactive", is_active=False))

    response = client.get("/players/p2/elo-summary")
    assert response.status_code == 200
    body = response.json()
    assert body["rank"] is None


def test_single_active_player_rank_one_of_one(client, players_repo):
    """Single active player → rank == {1, 1} (D-18)."""
    players_repo.create(Player(player_id="p1", name="Alice", is_active=True))

    response = client.get("/players/p1/elo-summary")
    assert response.status_code == 200
    body = response.json()
    assert body["rank"] == {"position": 1, "total": 1}


# ------------------- D-19 cascade reflection (no client cache) --------------


def test_summary_reflects_cascade_after_edit(client, players_repo):
    """Editing an earlier game must cascade and the summary reflects it."""
    _seed_three_players(players_repo)
    _post_game(
        client,
        _game_payload("g1", "2026-01-01",
                      [_pr("p1", 80), _pr("p2", 50), _pr("p3", 30)]),
    )
    _post_game(
        client,
        _game_payload("g2", "2026-02-01",
                      [_pr("p2", 80), _pr("p3", 50), _pr("p1", 30)]),
    )

    before = client.get("/players/p1/elo-summary").json()

    # Flip g1 outcome: p3 wins instead of p1
    res = client.put(
        "/games/g1",
        json=_game_payload(
            "g1", "2026-01-01",
            [_pr("p3", 80), _pr("p2", 50), _pr("p1", 30)],
        ),
    )
    assert res.status_code == 200, res.json()

    after = client.get("/players/p1/elo-summary").json()

    # At least one of the elo-derived fields must change after the cascade.
    changed = (
        after["current_elo"] != before["current_elo"]
        or after["last_delta"] != before["last_delta"]
        or after["peak_elo"] != before["peak_elo"]
    )
    assert changed, f"Expected cascade to mutate p1 summary; before={before} after={after}"


# ----------------------------- 404 handling ---------------------------------


def test_player_not_found_returns_404(client):
    """Unknown player_id → 404 with a helpful detail."""
    response = client.get("/players/does-not-exist/elo-summary")
    assert response.status_code == 404
    body = response.json()
    assert "does-not-exist" in body["detail"]
