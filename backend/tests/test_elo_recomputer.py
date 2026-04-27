"""Unit tests for `EloService.recompute_from_date` using mocked repositories."""
from datetime import date
from unittest.mock import MagicMock

import pytest

from models.game import Game
from models.player import Player
from models.player_result import PlayerResult, PlayerEndStats
from models.player_score import PlayerScore
from models.enums import Corporation, MapName
from services.elo_service import EloService, DEFAULT_ELO


def _player_result(player_id: str, terraform_rating: int) -> PlayerResult:
    scores = PlayerScore(
        terraform_rating=terraform_rating,
        milestone_points=0,
        milestones=[],
        award_points=0,
        card_points=0,
        card_resource_points=0,
        greenery_points=0,
        city_points=0,
        turmoil_points=0,
    )
    return PlayerResult(
        player_id=player_id,
        corporation=Corporation.CREDICOR,
        scores=scores,
        end_stats=PlayerEndStats(mc_total=0),
    )


def _game(game_id: str, on_date: date, players: list[PlayerResult]) -> Game:
    return Game(
        game_id=game_id,
        date=on_date,
        map_name=MapName.HELLAS,
        expansions=[],
        draft=False,
        generations=10,
        player_results=players,
        awards=[],
    )


@pytest.fixture
def repos():
    return {
        "elo": MagicMock(),
        "players": MagicMock(),
        "games": MagicMock(),
    }


@pytest.fixture
def service(repos):
    return EloService(
        elo_repository=repos["elo"],
        players_repository=repos["players"],
        games_repository=repos["games"],
    )


class TestRecomputeFromDate:
    def test_no_games_only_does_baseline_update(self, service, repos):
        repos["players"].get_all.return_value = [
            Player(player_id="p1", name="Alice"),
            Player(player_id="p2", name="Bob"),
        ]
        repos["elo"].get_baseline_elo_before.return_value = {}
        repos["games"].list_games_from_date.return_value = []

        service.recompute_from_date(date(2026, 1, 1))

        repos["elo"].delete_changes_from_date.assert_called_once_with(date(2026, 1, 1))
        repos["elo"].save_elo_changes.assert_not_called()
        repos["players"].bulk_update_elo.assert_called_once_with(
            {"p1": DEFAULT_ELO, "p2": DEFAULT_ELO}
        )

    def test_single_game_persists_changes(self, service, repos):
        repos["players"].get_all.return_value = [
            Player(player_id="p1", name="Alice"),
            Player(player_id="p2", name="Bob"),
        ]
        repos["elo"].get_baseline_elo_before.return_value = {}
        game = _game("g1", date(2026, 1, 1), [
            _player_result("p1", 50),
            _player_result("p2", 30),
        ])
        repos["games"].list_games_from_date.return_value = [game]

        service.recompute_from_date(date(2026, 1, 1))

        # save_elo_changes called for the single game
        assert repos["elo"].save_elo_changes.call_count == 1
        kwargs = repos["elo"].save_elo_changes.call_args.kwargs
        assert kwargs["game_id"] == "g1"
        assert kwargs["recorded_at"] == date(2026, 1, 1)
        # Final bulk update reflects post-game ELO (winner > 1000, loser < 1000)
        final = repos["players"].bulk_update_elo.call_args.args[0]
        assert final["p1"] > DEFAULT_ELO
        assert final["p2"] < DEFAULT_ELO

    def test_baseline_overrides_default_for_known_players(self, service, repos):
        repos["players"].get_all.return_value = [
            Player(player_id="p1", name="Alice"),
            Player(player_id="p2", name="Bob"),
        ]
        repos["elo"].get_baseline_elo_before.return_value = {"p1": 1200}
        repos["games"].list_games_from_date.return_value = []

        service.recompute_from_date(date(2026, 1, 1))

        final = repos["players"].bulk_update_elo.call_args.args[0]
        assert final["p1"] == 1200  # from baseline
        assert final["p2"] == DEFAULT_ELO  # default for player without history

    def test_games_processed_in_chronological_order(self, service, repos):
        repos["players"].get_all.return_value = [
            Player(player_id="p1", name="Alice"),
            Player(player_id="p2", name="Bob"),
        ]
        repos["elo"].get_baseline_elo_before.return_value = {}
        # Provide games out of order; service must sort them
        g_late = _game("g_late", date(2026, 3, 1), [
            _player_result("p1", 30),
            _player_result("p2", 50),
        ])
        g_early = _game("g_early", date(2026, 1, 1), [
            _player_result("p1", 50),
            _player_result("p2", 30),
        ])
        repos["games"].list_games_from_date.return_value = [g_late, g_early]

        service.recompute_from_date(date(2026, 1, 1))

        # Two save calls; first must be the early game
        calls = repos["elo"].save_elo_changes.call_args_list
        assert calls[0].kwargs["game_id"] == "g_early"
        assert calls[1].kwargs["game_id"] == "g_late"

    def test_recompute_all_uses_date_min(self, service, repos):
        repos["players"].get_all.return_value = []
        repos["elo"].get_baseline_elo_before.return_value = {}
        repos["games"].list_games_from_date.return_value = []

        service.recompute_all()

        repos["elo"].delete_changes_from_date.assert_called_once_with(date.min)
        repos["games"].list_games_from_date.assert_called_once_with(date.min)
