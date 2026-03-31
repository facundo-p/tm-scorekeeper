import pytest
from datetime import date
from models.achievement_tier import AchievementTier
from models.achievement_definition import AchievementDefinition
from models.achievement_progress import Progress
from models.evaluation_result import EvaluationResult
from models.game import Game
from models.player_result import PlayerResult, PlayerEndStats
from models.player_score import PlayerScore
from models.enums import MapName, Corporation, Expansion
from services.achievement_evaluators.base import AchievementEvaluator


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_definition(code="test", tiers=None, show_progress=False):
    if tiers is None:
        tiers = [
            AchievementTier(level=1, threshold=5, title="Tier 1"),
            AchievementTier(level=2, threshold=10, title="Tier 2"),
            AchievementTier(level=3, threshold=20, title="Tier 3"),
        ]
    return AchievementDefinition(
        code=code, description="Test achievement",
        icon=None, fallback_icon="star", tiers=tiers, show_progress=show_progress,
    )


def make_player_score(terraform_rating=20, card_points=0, city_points=0, greenery_points=0,
                       milestone_points=0, award_points=0, card_resource_points=0, turmoil_points=None, mc_total=30):
    return PlayerScore(
        terraform_rating=terraform_rating,
        milestone_points=milestone_points,
        milestones=[],
        award_points=award_points,
        card_points=card_points,
        card_resource_points=card_resource_points,
        greenery_points=greenery_points,
        city_points=city_points,
        turmoil_points=turmoil_points,
    )


def make_player_result(player_id, total_points=20, mc_total=30):
    """Make PlayerResult where total_points = terraform_rating (simplest case)."""
    scores = make_player_score(terraform_rating=total_points)
    return PlayerResult(
        player_id=player_id,
        corporation=Corporation.CREDICOR,
        scores=scores,
        end_stats=PlayerEndStats(mc_total=mc_total),
    )


def make_game(player_ids, map_name=MapName.THARSIS, game_date=None, scores_by_player=None):
    """Create a Game with given players. scores_by_player: dict of player_id -> total_points."""
    if game_date is None:
        game_date = date(2026, 1, 1)
    player_results = []
    for pid in player_ids:
        pts = scores_by_player.get(pid, 20) if scores_by_player else 20
        player_results.append(make_player_result(pid, total_points=pts))
    return Game(
        game_id="g1",
        date=game_date,
        map_name=map_name,
        expansions=[],
        draft=False,
        generations=10,
        player_results=player_results,
        awards=[],
    )


# ── Base Evaluator Tests ───────────────────────────────────────────────────────

class ConcreteEvaluator(AchievementEvaluator):
    """Concrete stub for testing the base class."""
    def __init__(self, definition, fixed_tier=0):
        self.definition = definition
        self._fixed_tier = fixed_tier

    def compute_tier(self, player_id, games):
        return self._fixed_tier


class TestAchievementEvaluatorBase:
    def test_code_property(self):
        defn = make_definition(code="my_achievement")
        ev = ConcreteEvaluator(defn)
        assert ev.code == "my_achievement"

    def test_evaluate_returns_none_when_no_change(self):
        ev = ConcreteEvaluator(make_definition(), fixed_tier=2)
        result = ev.evaluate("p1", [], persisted_tier=2)
        assert result.new_tier is None

    def test_evaluate_returns_none_when_downgrade(self):
        ev = ConcreteEvaluator(make_definition(), fixed_tier=1)
        result = ev.evaluate("p1", [], persisted_tier=3)
        assert result.new_tier is None

    def test_evaluate_is_new_on_first_unlock(self):
        ev = ConcreteEvaluator(make_definition(), fixed_tier=1)
        result = ev.evaluate("p1", [], persisted_tier=0)
        assert result.new_tier == 1
        assert result.is_new is True
        assert result.is_upgrade is False

    def test_evaluate_is_upgrade_on_tier_increase(self):
        ev = ConcreteEvaluator(make_definition(), fixed_tier=3)
        result = ev.evaluate("p1", [], persisted_tier=2)
        assert result.new_tier == 3
        assert result.is_new is False
        assert result.is_upgrade is True

    def test_get_progress_default_none(self):
        ev = ConcreteEvaluator(make_definition())
        assert ev.get_progress("p1", [], current_tier=0) is None

    def test_next_tier_returns_correct(self):
        ev = ConcreteEvaluator(make_definition())
        nt = ev._next_tier(1)
        assert nt is not None
        assert nt.level == 2

    def test_next_tier_returns_none_at_max(self):
        ev = ConcreteEvaluator(make_definition())
        assert ev._next_tier(3) is None
