"""Tests for AchievementsService.

TDD RED phase: tests define expected behavior before implementation.
"""
import pytest
from datetime import date
from unittest.mock import MagicMock, patch

from models.achievement_tier import AchievementTier
from models.achievement_definition import AchievementDefinition
from models.achievement_progress import Progress
from models.evaluation_result import EvaluationResult
from models.game import Game
from models.player_result import PlayerResult, PlayerEndStats
from models.player_score import PlayerScore
from models.enums import MapName, Corporation, Expansion


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_player_score(terraform_rating=20):
    return PlayerScore(
        terraform_rating=terraform_rating,
        milestone_points=0,
        milestones=[],
        award_points=0,
        card_points=0,
        card_resource_points=0,
        greenery_points=0,
        city_points=0,
        turmoil_points=None,
    )


def make_player_result(player_id, total_points=20):
    return PlayerResult(
        player_id=player_id,
        corporation=Corporation.CREDICOR,
        scores=make_player_score(terraform_rating=total_points),
        end_stats=PlayerEndStats(mc_total=30),
    )


def make_game(player_ids, game_id="g1", game_date=None):
    if game_date is None:
        game_date = date(2026, 1, 1)
    return Game(
        game_id=game_id,
        date=game_date,
        map_name=MapName.THARSIS,
        expansions=[],
        draft=False,
        generations=10,
        player_results=[make_player_result(pid) for pid in player_ids],
        awards=[],
    )


def make_mock_achievement(player_id, code, tier, unlocked_at=None):
    """Create a mock PlayerAchievement ORM object."""
    a = MagicMock()
    a.player_id = player_id
    a.code = code
    a.tier = tier
    a.unlocked_at = unlocked_at or date(2026, 1, 1)
    return a


def make_mock_player(player_id, name):
    """Create a mock Player ORM object."""
    p = MagicMock()
    p.player_id = player_id
    p.name = name
    return p


def make_definition(code, tiers=None, show_progress=False):
    if tiers is None:
        tiers = [
            AchievementTier(level=1, threshold=5, title="Tier 1"),
            AchievementTier(level=2, threshold=10, title="Tier 2"),
            AchievementTier(level=3, threshold=20, title="Tier 3"),
        ]
    return AchievementDefinition(
        code=code,
        description=f"Test {code}",
        icon=None,
        fallback_icon="star",
        tiers=tiers,
        show_progress=show_progress,
    )


def make_mock_evaluator(code, new_tier=None, is_new=False, is_upgrade=False, show_progress=False):
    """Mock evaluator that always returns the same EvaluationResult."""
    ev = MagicMock()
    ev.code = code
    ev.definition = make_definition(code, show_progress=show_progress)
    ev.evaluate.return_value = EvaluationResult(new_tier=new_tier, is_new=is_new, is_upgrade=is_upgrade)
    ev.get_progress.return_value = None
    return ev


def make_service(games_repo=None, achievement_repo=None, players_repo=None):
    from services.achievements_service import AchievementsService
    return AchievementsService(
        games_repository=games_repo or MagicMock(),
        achievement_repository=achievement_repo or MagicMock(),
        players_repository=players_repo or MagicMock(),
    )


# ── evaluate_for_game Tests ────────────────────────────────────────────────────

class TestEvaluateForGame:
    def test_returns_empty_dict_when_game_not_found(self):
        games_repo = MagicMock()
        games_repo.get.return_value = None
        service = make_service(games_repo=games_repo)

        result = service.evaluate_for_game("nonexistent-game-id")

        assert result == {}

    def test_returns_achievements_by_player_for_unlocked(self):
        """Players that unlocked something appear in result."""
        game = make_game(["p1"])
        games_repo = MagicMock()
        games_repo.get.return_value = game
        games_repo.get_games_by_player.return_value = [game]

        achievement_repo = MagicMock()
        achievement_repo.get_for_player.return_value = []

        mock_evaluator = make_mock_evaluator("high_score", new_tier=1, is_new=True)

        service = make_service(games_repo=games_repo, achievement_repo=achievement_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", [mock_evaluator]):
            result = service.evaluate_for_game("g1")

        assert "p1" in result
        assert len(result["p1"]) == 1
        assert result["p1"][0].code == "high_score"
        assert result["p1"][0].is_new is True

    def test_omits_players_with_no_new_achievements(self):
        """Players where no evaluator triggered are not in result."""
        game = make_game(["p1"])
        games_repo = MagicMock()
        games_repo.get.return_value = game
        games_repo.get_games_by_player.return_value = [game]

        achievement_repo = MagicMock()
        achievement_repo.get_for_player.return_value = []

        mock_evaluator = make_mock_evaluator("high_score", new_tier=None)  # no change

        service = make_service(games_repo=games_repo, achievement_repo=achievement_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", [mock_evaluator]):
            result = service.evaluate_for_game("g1")

        assert "p1" not in result
        assert result == {}

    def test_get_games_by_player_called_once_per_player(self):
        """No N+1: games loaded once per player regardless of evaluator count."""
        game = make_game(["p1"])
        games_repo = MagicMock()
        games_repo.get.return_value = game
        games_repo.get_games_by_player.return_value = [game]

        achievement_repo = MagicMock()
        achievement_repo.get_for_player.return_value = []

        # 3 evaluators — should still only call get_games_by_player once
        mock_evaluators = [
            make_mock_evaluator("ev1", new_tier=None),
            make_mock_evaluator("ev2", new_tier=None),
            make_mock_evaluator("ev3", new_tier=None),
        ]

        service = make_service(games_repo=games_repo, achievement_repo=achievement_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", mock_evaluators):
            service.evaluate_for_game("g1")

        assert games_repo.get_games_by_player.call_count == 1

    def test_is_new_true_when_persisted_tier_was_zero(self):
        """First-time unlock => is_new=True."""
        game = make_game(["p1"])
        games_repo = MagicMock()
        games_repo.get.return_value = game
        games_repo.get_games_by_player.return_value = [game]

        achievement_repo = MagicMock()
        achievement_repo.get_for_player.return_value = []  # no persisted achievements

        mock_evaluator = make_mock_evaluator("games_played", new_tier=1, is_new=True, is_upgrade=False)

        service = make_service(games_repo=games_repo, achievement_repo=achievement_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", [mock_evaluator]):
            result = service.evaluate_for_game("g1")

        assert result["p1"][0].is_new is True
        assert result["p1"][0].is_upgrade is False

    def test_is_upgrade_true_when_persisted_tier_greater_than_zero(self):
        """Tier upgrade => is_upgrade=True."""
        game = make_game(["p1"])
        games_repo = MagicMock()
        games_repo.get.return_value = game
        games_repo.get_games_by_player.return_value = [game]

        persisted = make_mock_achievement("p1", "games_played", tier=1)
        achievement_repo = MagicMock()
        achievement_repo.get_for_player.return_value = [persisted]

        mock_evaluator = make_mock_evaluator("games_played", new_tier=2, is_new=False, is_upgrade=True)

        service = make_service(games_repo=games_repo, achievement_repo=achievement_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", [mock_evaluator]):
            result = service.evaluate_for_game("g1")

        assert result["p1"][0].is_upgrade is True
        assert result["p1"][0].is_new is False

    def test_single_item_per_achievement_even_if_multiple_tiers_crossed(self):
        """evaluate() returns final tier — service should produce 1 item per achievement code."""
        game = make_game(["p1"])
        games_repo = MagicMock()
        games_repo.get.return_value = game
        games_repo.get_games_by_player.return_value = [game]

        achievement_repo = MagicMock()
        achievement_repo.get_for_player.return_value = []

        # evaluator returns final tier (e.g. jumped from 0 to tier 3)
        mock_evaluator = make_mock_evaluator("high_score", new_tier=3, is_new=True)

        service = make_service(games_repo=games_repo, achievement_repo=achievement_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", [mock_evaluator]):
            result = service.evaluate_for_game("g1")

        assert len(result["p1"]) == 1
        assert result["p1"][0].tier == 3

    def test_never_raises_returns_empty_dict_on_exception(self):
        """Service catches all exceptions and returns empty dict."""
        games_repo = MagicMock()
        games_repo.get.side_effect = RuntimeError("DB is down")

        service = make_service(games_repo=games_repo)

        result = service.evaluate_for_game("some-game-id")

        assert result == {}


# ── get_player_achievements Tests ─────────────────────────────────────────────

class TestGetPlayerAchievements:
    def test_returns_all_achievements_locked_and_unlocked(self):
        """All evaluators produce a DTO, even if player has never unlocked it."""
        games_repo = MagicMock()
        games_repo.get_games_by_player.return_value = []

        achievement_repo = MagicMock()
        achievement_repo.get_for_player.return_value = []  # nothing persisted

        ev1 = make_mock_evaluator("high_score")
        ev2 = make_mock_evaluator("games_played")

        service = make_service(games_repo=games_repo, achievement_repo=achievement_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", [ev1, ev2]):
            result = service.get_player_achievements("p1")

        assert len(result) == 2
        for dto in result:
            assert dto.unlocked is False
            assert dto.tier == 0

    def test_returns_correct_tier_for_unlocked_achievement(self):
        games_repo = MagicMock()
        games_repo.get_games_by_player.return_value = []

        persisted = make_mock_achievement("p1", "games_played", tier=2, unlocked_at=date(2026, 2, 1))
        achievement_repo = MagicMock()
        achievement_repo.get_for_player.return_value = [persisted]

        ev = make_mock_evaluator("games_played", show_progress=False)

        service = make_service(games_repo=games_repo, achievement_repo=achievement_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", [ev]):
            result = service.get_player_achievements("p1")

        assert len(result) == 1
        assert result[0].tier == 2
        assert result[0].unlocked is True
        assert result[0].unlocked_at == date(2026, 2, 1)

    def test_computes_progress_for_show_progress_evaluators(self):
        """show_progress=True evaluators have get_progress called."""
        games_repo = MagicMock()
        games_repo.get_games_by_player.return_value = []

        achievement_repo = MagicMock()
        achievement_repo.get_for_player.return_value = []

        ev = make_mock_evaluator("games_played", show_progress=True)
        ev.get_progress.return_value = Progress(current=7, target=10)

        service = make_service(games_repo=games_repo, achievement_repo=achievement_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", [ev]):
            result = service.get_player_achievements("p1")

        ev.get_progress.assert_called_once()
        assert result[0].progress is not None
        assert result[0].progress.current == 7
        assert result[0].progress.target == 10


# ── get_catalog Tests ──────────────────────────────────────────────────────────

class TestGetCatalog:
    def test_returns_one_item_per_evaluator(self):
        achievement_repo = MagicMock()
        achievement_repo.get_all.return_value = []

        players_repo = MagicMock()
        players_repo.get_all.return_value = []

        ev1 = make_mock_evaluator("high_score")
        ev2 = make_mock_evaluator("games_played")

        service = make_service(achievement_repo=achievement_repo, players_repo=players_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", [ev1, ev2]):
            result = service.get_catalog()

        assert len(result) == 2
        codes = {item.code for item in result}
        assert codes == {"high_score", "games_played"}

    def test_catalog_holders_populated_from_repository(self):
        """Holders list shows players who unlocked the achievement."""
        achievement_repo = MagicMock()
        ach = make_mock_achievement("p1", "high_score", tier=2, unlocked_at=date(2026, 1, 15))
        achievement_repo.get_all.return_value = [ach]

        player = MagicMock()
        player.player_id = "p1"
        player.name = "Alice"
        players_repo = MagicMock()
        players_repo.get_all.return_value = [player]

        ev = make_mock_evaluator("high_score")

        service = make_service(achievement_repo=achievement_repo, players_repo=players_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", [ev]):
            result = service.get_catalog()

        assert len(result) == 1
        assert len(result[0].holders) == 1
        assert result[0].holders[0].player_id == "p1"
        assert result[0].holders[0].player_name == "Alice"

    def test_catalog_empty_holders_when_no_one_unlocked(self):
        achievement_repo = MagicMock()
        achievement_repo.get_all.return_value = []

        players_repo = MagicMock()
        players_repo.get_all.return_value = []

        ev = make_mock_evaluator("high_score")

        service = make_service(achievement_repo=achievement_repo, players_repo=players_repo)

        with patch("services.achievements_service.ALL_EVALUATORS", [ev]):
            result = service.get_catalog()

        assert result[0].holders == []
