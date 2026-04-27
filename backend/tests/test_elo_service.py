"""Unit tests for the pure ELO function `calculate_elo_changes`."""
from datetime import date

import pytest

from models.game import Game
from models.player_result import PlayerResult, PlayerEndStats
from models.player_score import PlayerScore
from models.enums import Corporation, MapName
from services.elo_service import calculate_elo_changes, K_FACTOR


def _player(player_id: str, terraform_rating: int) -> PlayerResult:
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


def _game(player_results: list[PlayerResult]) -> Game:
    return Game(
        game_id="g1",
        date=date(2026, 1, 1),
        map_name=MapName.HELLAS,
        expansions=[],
        draft=False,
        generations=10,
        player_results=player_results,
        awards=[],
    )


class TestCalculateEloChanges:
    def test_two_players_equal_elo_winner_takes_half_K(self):
        game = _game([_player("p1", 50), _player("p2", 30)])
        changes = calculate_elo_changes(game, {"p1": 1000, "p2": 1000})

        by_id = {c.player_id: c for c in changes}
        # Equal ELO, expected = 0.5; actual winner = 1.0; delta = K * (1 - 0.5) = 16
        assert by_id["p1"].delta == 16
        assert by_id["p2"].delta == -16
        assert by_id["p1"].elo_after == 1016
        assert by_id["p2"].elo_after == 984

    def test_deltas_sum_to_zero_two_players(self):
        game = _game([_player("p1", 50), _player("p2", 30)])
        changes = calculate_elo_changes(game, {"p1": 1200, "p2": 900})

        assert sum(c.delta for c in changes) == 0

    def test_three_players_ranking(self):
        game = _game([_player("p1", 60), _player("p2", 40), _player("p3", 20)])
        changes = calculate_elo_changes(game, {"p1": 1000, "p2": 1000, "p3": 1000})

        by_id = {c.player_id: c for c in changes}
        # p1 wins both pairwise comparisons; p3 loses both; p2 wins one and loses one.
        assert by_id["p1"].delta > 0
        assert by_id["p2"].delta == 0
        assert by_id["p3"].delta < 0
        # Sum should be ~0 (rounding may cause +/- 1)
        assert abs(sum(c.delta for c in changes)) <= 1

    def test_tied_game_gives_zero_delta(self):
        # Both players with identical scores -> tied -> delta 0 with equal ELO
        game = _game([_player("p1", 40), _player("p2", 40)])
        changes = calculate_elo_changes(game, {"p1": 1000, "p2": 1000})

        for c in changes:
            assert c.delta == 0
            assert c.elo_after == c.elo_before

    def test_underdog_winner_gets_more_delta(self):
        # p1 (1200) vs p2 (1000), p2 wins. p2 gains more than p1 would have gained
        # by winning at equal ELO (16).
        game = _game([_player("p2", 60), _player("p1", 30)])
        changes = calculate_elo_changes(game, {"p1": 1200, "p2": 1000})

        by_id = {c.player_id: c for c in changes}
        assert by_id["p2"].delta > 16
        assert by_id["p1"].delta < -16

    def test_elo_before_matches_input(self):
        game = _game([_player("p1", 50), _player("p2", 30)])
        changes = calculate_elo_changes(game, {"p1": 1234, "p2": 987})

        by_id = {c.player_id: c for c in changes}
        assert by_id["p1"].elo_before == 1234
        assert by_id["p2"].elo_before == 987

    def test_K_factor_is_32(self):
        # Sanity: the constant the algorithm rests on
        assert K_FACTOR == 32
