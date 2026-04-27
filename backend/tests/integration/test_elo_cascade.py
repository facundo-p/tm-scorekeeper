"""
Integration tests for ELO cascade recompute on game create/update/delete.

Invariant: after any sequence of mutations, the persisted state must equal the
state produced by recomputing ELO from scratch over the current game set.
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


def _final_elo_snapshot(players_repo, ids: list[str]) -> dict[str, int]:
    return {pid: players_repo.get(pid).elo for pid in ids}


def _seed_three_players(players_repo) -> list[str]:
    players_repo.create(Player(player_id="p1", name="Alice"))
    players_repo.create(Player(player_id="p2", name="Bob"))
    players_repo.create(Player(player_id="p3", name="Cara"))
    return ["p1", "p2", "p3"]


def _post_three_games(client) -> tuple[str, str, str]:
    g1 = _post_game(client, _game_payload(
        "g-d1", "2026-01-01",
        [_pr("p1", 50), _pr("p2", 30), _pr("p3", 20)],
    ))
    g2 = _post_game(client, _game_payload(
        "g-d2", "2026-02-01",
        [_pr("p2", 50), _pr("p3", 30), _pr("p1", 20)],
    ))
    g3 = _post_game(client, _game_payload(
        "g-d3", "2026-03-01",
        [_pr("p3", 50), _pr("p1", 30), _pr("p2", 20)],
    ))
    return g1, g2, g3


class TestResponseShape:
    def test_post_response_excludes_elo_changes(self, client, players_repo):
        _seed_three_players(players_repo)
        payload = _game_payload(
            "g-shape-1", "2026-01-01",
            [_pr("p1", 50), _pr("p2", 30)],
        )
        res = client.post("/games/", json=payload)
        assert res.status_code == 200
        body = res.json()
        assert "id" in body
        assert "game" in body
        assert "elo_changes" not in body

    def test_put_response_excludes_elo_changes(self, client, players_repo):
        _seed_three_players(players_repo)
        gid = _post_game(client, _game_payload(
            "g-shape-2", "2026-01-01",
            [_pr("p1", 50), _pr("p2", 30)],
        ))

        update_payload = _game_payload(
            "g-shape-2", "2026-01-01",
            [_pr("p1", 30), _pr("p2", 50)],
        )
        res = client.put(f"/games/{gid}", json=update_payload)
        assert res.status_code == 200
        body = res.json()
        assert body == {"message": "Game updated successfully"}


class TestCascadeInvariant:
    def test_delete_then_recreate_yields_same_final_state(self, client, players_repo):
        ids = _seed_three_players(players_repo)
        g1, g2, g3 = _post_three_games(client)

        baseline = _final_elo_snapshot(players_repo, ids)

        # Delete the middle game...
        res = client.delete(f"/games/{g2}")
        assert res.status_code == 200
        # ...then re-create it identically.
        _post_game(client, _game_payload(
            g2, "2026-02-01",
            [_pr("p2", 50), _pr("p3", 30), _pr("p1", 20)],
        ))

        after = _final_elo_snapshot(players_repo, ids)
        assert after == baseline

    def test_delete_middle_changes_subsequent_history(self, client, players_repo, elo_repo):
        ids = _seed_three_players(players_repo)
        g1, g2, g3 = _post_three_games(client)

        before = elo_repo.get_changes_for_game(g3)
        client.delete(f"/games/{g2}")
        after = elo_repo.get_changes_for_game(g3)

        before_by_player = {c.player_id: c for c in before}
        after_by_player = {c.player_id: c for c in after}
        # Every player in g3 must see different elo_before because g2 no longer
        # contributed to their snapshot.
        for pid, c in after_by_player.items():
            assert c.elo_before != before_by_player[pid].elo_before

    def test_modify_middle_changes_subsequent_history(self, client, players_repo, elo_repo):
        _seed_three_players(players_repo)
        g1, g2, g3 = _post_three_games(client)

        before = {c.player_id: c.elo_before for c in elo_repo.get_changes_for_game(g3)}

        # Flip the order of g2: p1 wins instead of p2
        client.put(f"/games/{g2}", json=_game_payload(
            g2, "2026-02-01",
            [_pr("p1", 50), _pr("p2", 30), _pr("p3", 20)],
        ))

        after = {c.player_id: c.elo_before for c in elo_repo.get_changes_for_game(g3)}
        assert after != before

    def test_create_backdated_recomputes_subsequent_games(self, client, players_repo, elo_repo):
        _seed_three_players(players_repo)
        g1, g2, g3 = _post_three_games(client)

        # Snapshot g3's history before the backdated insert
        before = {c.player_id: c.elo_before for c in elo_repo.get_changes_for_game(g3)}

        # Insert a game with an earlier date than all existing ones
        _post_game(client, _game_payload(
            "g-d0", "2025-12-01",
            [_pr("p3", 50), _pr("p2", 30), _pr("p1", 20)],
        ))

        after = {c.player_id: c.elo_before for c in elo_repo.get_changes_for_game(g3)}
        assert after != before

    def test_player_elo_matches_last_history_after_after_mutations(
        self, client, players_repo, elo_repo
    ):
        ids = _seed_three_players(players_repo)
        g1, g2, g3 = _post_three_games(client)

        client.delete(f"/games/{g2}")

        for pid in ids:
            history = sorted(
                _all_history_for_player(elo_repo, pid),
                key=lambda c: c["recorded_at"],
            )
            if not history:
                assert players_repo.get(pid).elo == 1000
            else:
                assert players_repo.get(pid).elo == history[-1]["elo_after"]


def _all_history_for_player(elo_repo, player_id: str) -> list[dict]:
    """Read every history row across all games for a player."""
    from db.session import get_session
    from db.models import PlayerEloHistory as PlayerEloHistoryORM

    with get_session() as session:
        rows = (
            session.query(PlayerEloHistoryORM)
            .filter(PlayerEloHistoryORM.player_id == player_id)
            .all()
        )
        return [
            {"recorded_at": r.recorded_at, "elo_after": r.elo_after, "game_id": r.game_id}
            for r in rows
        ]
