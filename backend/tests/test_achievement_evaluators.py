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


# ── Generic Evaluator Tests ────────────────────────────────────────────────────

from services.achievement_evaluators.single_game_threshold import SingleGameThresholdEvaluator
from services.achievement_evaluators.accumulated import AccumulatedEvaluator
from services.helpers.results import calculate_results


# High score definition for tests
HIGH_SCORE_DEF = AchievementDefinition(
    code="high_score", description="Score points in one game", icon=None, fallback_icon="trophy",
    tiers=[
        AchievementTier(level=1, threshold=50,  title="Colono"),
        AchievementTier(level=2, threshold=75,  title="Joven Promesa"),
        AchievementTier(level=3, threshold=100, title="Gran Terraformador"),
        AchievementTier(level=4, threshold=125, title="Leyenda de Marte"),
        AchievementTier(level=5, threshold=150, title="Emperador de Marte"),
    ],
    show_progress=False,
)

# Games played definition for tests
GAMES_PLAYED_DEF = AchievementDefinition(
    code="games_played", description="Play games", icon=None, fallback_icon="gamepad",
    tiers=[
        AchievementTier(level=1, threshold=5,   title="Novato"),
        AchievementTier(level=2, threshold=10,  title="Habitué"),
        AchievementTier(level=3, threshold=25,  title="Veterano"),
        AchievementTier(level=4, threshold=50,  title="Terraformador Nato"),
        AchievementTier(level=5, threshold=100, title="Adicto a Marte"),
    ],
    show_progress=True,
)


def _high_score_extractor(player_id, game, game_result):
    """Extract total_points for player from GameResultDTO."""
    for r in game_result.results:
        if r.player_id == player_id:
            return r.total_points
    return 0


def _count_games(player_id, games):
    return sum(1 for g in games if any(pr.player_id == player_id for pr in g.player_results))


class TestSingleGameThreshold:
    def test_compute_tier_0_no_games(self):
        ev = SingleGameThresholdEvaluator(HIGH_SCORE_DEF, extractor=_high_score_extractor)
        assert ev.compute_tier("p1", []) == 0

    def test_compute_tier_0_below_first_threshold(self):
        ev = SingleGameThresholdEvaluator(HIGH_SCORE_DEF, extractor=_high_score_extractor)
        game = make_game(["p1"], scores_by_player={"p1": 45})
        assert ev.compute_tier("p1", [game]) == 0

    def test_compute_tier_1_at_first_threshold(self):
        ev = SingleGameThresholdEvaluator(HIGH_SCORE_DEF, extractor=_high_score_extractor)
        game = make_game(["p1"], scores_by_player={"p1": 50})
        assert ev.compute_tier("p1", [game]) == 1

    def test_compute_tier_3_at_100_points(self):
        ev = SingleGameThresholdEvaluator(HIGH_SCORE_DEF, extractor=_high_score_extractor)
        game = make_game(["p1"], scores_by_player={"p1": 100})
        assert ev.compute_tier("p1", [game]) == 3

    def test_compute_tier_uses_best_game(self):
        ev = SingleGameThresholdEvaluator(HIGH_SCORE_DEF, extractor=_high_score_extractor)
        game_low = make_game(["p1"], scores_by_player={"p1": 30}, game_date=date(2026, 1, 1))
        game_high = make_game(["p1"], scores_by_player={"p1": 130}, game_date=date(2026, 1, 2))
        assert ev.compute_tier("p1", [game_low, game_high]) == 4

    def test_compute_tier_ignores_other_players(self):
        ev = SingleGameThresholdEvaluator(HIGH_SCORE_DEF, extractor=_high_score_extractor)
        game = make_game(["p1", "p2"], scores_by_player={"p1": 30, "p2": 200})
        # p1 only has 30, so tier 0
        assert ev.compute_tier("p1", [game]) == 0


class TestAccumulatedEvaluator:
    def test_compute_tier_0_no_games(self):
        ev = AccumulatedEvaluator(GAMES_PLAYED_DEF, counter=_count_games)
        assert ev.compute_tier("p1", []) == 0

    def test_compute_tier_1_at_threshold_5(self):
        ev = AccumulatedEvaluator(GAMES_PLAYED_DEF, counter=_count_games)
        games = [make_game(["p1"], game_date=date(2026, 1, i)) for i in range(1, 6)]
        assert ev.compute_tier("p1", games) == 1

    def test_compute_tier_3_at_threshold_25(self):
        ev = AccumulatedEvaluator(GAMES_PLAYED_DEF, counter=_count_games)
        games = [make_game(["p1"], game_date=date(2026, 1, 1)) for _ in range(25)]
        assert ev.compute_tier("p1", games) == 3

    def test_get_progress_returns_correct(self):
        ev = AccumulatedEvaluator(GAMES_PLAYED_DEF, counter=_count_games)
        games = [make_game(["p1"], game_date=date(2026, 1, 1)) for _ in range(7)]
        # 7 games: at tier 1 (threshold 5), next tier at 10
        progress = ev.get_progress("p1", games, current_tier=1)
        assert progress is not None
        assert progress.current == 7
        assert progress.target == 10

    def test_get_progress_returns_none_at_max_tier(self):
        ev = AccumulatedEvaluator(GAMES_PLAYED_DEF, counter=_count_games)
        games = [make_game(["p1"], game_date=date(2026, 1, 1)) for _ in range(100)]
        progress = ev.get_progress("p1", games, current_tier=5)
        assert progress is None


# ── Custom Evaluator Tests ─────────────────────────────────────────────────────

from services.achievement_evaluators.win_streak import WinStreakEvaluator
from services.achievement_evaluators.all_maps import AllMapsEvaluator
from services.achievement_evaluators.registry import (
    ALL_EVALUATORS, _milestone_master_extractor, _no_milestone_win_extractor,
    _award_master_extractor, _no_award_win_extractor, _stolen_awards_extractor,
    _card_points_extractor,
)
from models.enums import MapName


WIN_STREAK_DEF = AchievementDefinition(
    code="win_streak", description="Win consecutively", icon=None, fallback_icon="flame",
    tiers=[
        AchievementTier(level=1, threshold=2, title="Racha"),
        AchievementTier(level=2, threshold=3, title="Imparable"),
        AchievementTier(level=3, threshold=5, title="Invencible"),
    ],
    show_progress=True,
)

ALL_MAPS_DEF = AchievementDefinition(
    code="all_maps", description="Play all maps", icon=None, fallback_icon="map",
    tiers=[
        AchievementTier(level=1, threshold=2, title="Explorador"),
        AchievementTier(level=2, threshold=3, title="Cartógrafo"),
        AchievementTier(level=3, threshold=5, title="Conquistador de Marte"),
    ],
    show_progress=True,
)


def make_win_game(winner_id, loser_id, game_date, map_name=MapName.THARSIS):
    """Create a game where winner_id clearly beats loser_id (winner has 100 pts, loser 20)."""
    return make_game(
        [winner_id, loser_id],
        map_name=map_name,
        game_date=game_date,
        scores_by_player={winner_id: 100, loser_id: 20},
    )


class TestWinStreakEvaluator:
    def test_compute_tier_0_no_games(self):
        ev = WinStreakEvaluator(WIN_STREAK_DEF)
        assert ev.compute_tier("p1", []) == 0

    def test_compute_tier_0_no_wins(self):
        ev = WinStreakEvaluator(WIN_STREAK_DEF)
        games = [make_win_game("p2", "p1", date(2026, 1, i)) for i in range(1, 4)]
        assert ev.compute_tier("p1", games) == 0

    def test_compute_tier_1_with_streak_of_2(self):
        ev = WinStreakEvaluator(WIN_STREAK_DEF)
        games = [
            make_win_game("p1", "p2", date(2026, 1, 1)),
            make_win_game("p1", "p2", date(2026, 1, 2)),
        ]
        assert ev.compute_tier("p1", games) == 1

    def test_compute_tier_uses_max_not_current_streak(self):
        ev = WinStreakEvaluator(WIN_STREAK_DEF)
        games = [
            make_win_game("p1", "p2", date(2026, 1, 1)),  # win
            make_win_game("p1", "p2", date(2026, 1, 2)),  # win (streak=2)
            make_win_game("p1", "p2", date(2026, 1, 3)),  # win (streak=3, tier 2)
            make_win_game("p2", "p1", date(2026, 1, 4)),  # loss (streak reset)
        ]
        # Current streak = 0, but max was 3 → tier 2
        assert ev.compute_tier("p1", games) == 2

    def test_compute_tier_handles_out_of_order_games(self):
        """Games not in chronological order must still compute correctly."""
        ev = WinStreakEvaluator(WIN_STREAK_DEF)
        games = [
            make_win_game("p1", "p2", date(2026, 1, 3)),  # provided last
            make_win_game("p1", "p2", date(2026, 1, 1)),  # provided first
            make_win_game("p1", "p2", date(2026, 1, 2)),  # provided middle
        ]
        # Sorted: 3 consecutive wins → tier 2
        assert ev.compute_tier("p1", games) == 2

    def test_get_progress_returns_current_streak(self):
        ev = WinStreakEvaluator(WIN_STREAK_DEF)
        games = [
            make_win_game("p2", "p1", date(2026, 1, 1)),  # loss
            make_win_game("p1", "p2", date(2026, 1, 2)),  # win (current streak=1)
        ]
        progress = ev.get_progress("p1", games, current_tier=0)
        assert progress is not None
        assert progress.current == 1
        assert progress.target == 2  # next tier threshold


class TestAllMapsEvaluator:
    def test_compute_tier_0_no_games(self):
        ev = AllMapsEvaluator(ALL_MAPS_DEF)
        assert ev.compute_tier("p1", []) == 0

    def test_compute_tier_0_one_map(self):
        ev = AllMapsEvaluator(ALL_MAPS_DEF)
        game = make_game(["p1"], map_name=MapName.THARSIS)
        assert ev.compute_tier("p1", [game]) == 0

    def test_compute_tier_1_two_maps(self):
        ev = AllMapsEvaluator(ALL_MAPS_DEF)
        games = [
            make_game(["p1"], map_name=MapName.THARSIS, game_date=date(2026, 1, 1)),
            make_game(["p1"], map_name=MapName.HELLAS, game_date=date(2026, 1, 2)),
        ]
        assert ev.compute_tier("p1", games) == 1

    def test_compute_tier_2_three_maps(self):
        ev = AllMapsEvaluator(ALL_MAPS_DEF)
        games = [
            make_game(["p1"], map_name=MapName.THARSIS, game_date=date(2026, 1, 1)),
            make_game(["p1"], map_name=MapName.HELLAS, game_date=date(2026, 1, 2)),
            make_game(["p1"], map_name=MapName.ELYSIUM, game_date=date(2026, 1, 3)),
        ]
        assert ev.compute_tier("p1", games) == 2

    def test_compute_tier_3_all_five_maps(self):
        ev = AllMapsEvaluator(ALL_MAPS_DEF)
        maps = [MapName.THARSIS, MapName.HELLAS, MapName.ELYSIUM, MapName.BOREALIS, MapName.AMAZONIS]
        games = [make_game(["p1"], map_name=m, game_date=date(2026, 1, i+1)) for i, m in enumerate(maps)]
        assert ev.compute_tier("p1", games) == 3

    def test_compute_tier_ignores_duplicate_maps(self):
        ev = AllMapsEvaluator(ALL_MAPS_DEF)
        games = [make_game(["p1"], map_name=MapName.THARSIS, game_date=date(2026, 1, i)) for i in range(1, 10)]
        # 9 games on the same map → still tier 0 (only 1 unique map)
        assert ev.compute_tier("p1", games) == 0

    def test_get_progress_returns_correct(self):
        ev = AllMapsEvaluator(ALL_MAPS_DEF)
        games = [
            make_game(["p1"], map_name=MapName.THARSIS, game_date=date(2026, 1, 1)),
            make_game(["p1"], map_name=MapName.HELLAS, game_date=date(2026, 1, 2)),
        ]
        progress = ev.get_progress("p1", games, current_tier=1)
        assert progress is not None
        assert progress.current == 2
        assert progress.target == 3  # next tier threshold


# ── Milestone Master (SingleGameThreshold) Tests ─────────────────────────────

class TestMilestoneMaster:
    def _make_game_with_milestones(self, player_id, milestones, total_points, opponent_points=20):
        """Create a game where player has specific milestones and points."""
        from models.enums import Milestone
        player_score = PlayerScore(
            terraform_rating=total_points,
            milestone_points=len(milestones) * 5,
            milestones=[Milestone(m) for m in milestones],
            award_points=0,
            card_points=0,
            card_resource_points=0,
            greenery_points=0,
            city_points=0,
            turmoil_points=None,
        )
        opponent_score = make_player_score(terraform_rating=opponent_points)
        return Game(
            game_id="g1",
            date=date(2026, 1, 1),
            map_name=MapName.THARSIS,
            expansions=[],
            draft=False,
            generations=10,
            player_results=[
                PlayerResult(player_id=player_id, corporation=Corporation.CREDICOR,
                             scores=player_score, end_stats=PlayerEndStats(mc_total=30)),
                PlayerResult(player_id="opponent", corporation=Corporation.CREDICOR,
                             scores=opponent_score, end_stats=PlayerEndStats(mc_total=30)),
            ],
            awards=[],
        )

    def test_win_with_3_milestones_unlocks(self):
        from services.achievement_evaluators.definitions import MILESTONE_MASTER
        ev = SingleGameThresholdEvaluator(MILESTONE_MASTER, extractor=_milestone_master_extractor)
        game = self._make_game_with_milestones("p1", ["Terraformer", "Mayor", "Gardener"], total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 1

    def test_win_with_2_milestones_does_not_unlock(self):
        from services.achievement_evaluators.definitions import MILESTONE_MASTER
        ev = SingleGameThresholdEvaluator(MILESTONE_MASTER, extractor=_milestone_master_extractor)
        game = self._make_game_with_milestones("p1", ["Terraformer", "Mayor"], total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 0

    def test_lose_with_3_milestones_does_not_unlock(self):
        from services.achievement_evaluators.definitions import MILESTONE_MASTER
        ev = SingleGameThresholdEvaluator(MILESTONE_MASTER, extractor=_milestone_master_extractor)
        game = self._make_game_with_milestones("p1", ["Terraformer", "Mayor", "Gardener"], total_points=50, opponent_points=80)
        assert ev.compute_tier("p1", [game]) == 0

    def test_no_milestones_win_does_not_unlock(self):
        from services.achievement_evaluators.definitions import MILESTONE_MASTER
        ev = SingleGameThresholdEvaluator(MILESTONE_MASTER, extractor=_milestone_master_extractor)
        game = self._make_game_with_milestones("p1", [], total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 0


# ── No Milestone Win (SingleGameThreshold) Tests ─────────────────────────────

class TestNoMilestoneWin:
    def _make_game_with_milestones(self, player_id, milestones, total_points, opponent_points=20, opponent_mc=30):
        """Create a game where player has specific milestones and points."""
        from models.enums import Milestone
        player_score = PlayerScore(
            terraform_rating=total_points,
            milestone_points=len(milestones) * 5,
            milestones=[Milestone(m) for m in milestones],
            award_points=0,
            card_points=0,
            card_resource_points=0,
            greenery_points=0,
            city_points=0,
            turmoil_points=None,
        )
        opponent_score = make_player_score(terraform_rating=opponent_points)
        return Game(
            game_id="g1",
            date=date(2026, 1, 1),
            map_name=MapName.THARSIS,
            expansions=[],
            draft=False,
            generations=10,
            player_results=[
                PlayerResult(player_id=player_id, corporation=Corporation.CREDICOR,
                             scores=player_score, end_stats=PlayerEndStats(mc_total=30)),
                PlayerResult(player_id="opponent", corporation=Corporation.CREDICOR,
                             scores=opponent_score, end_stats=PlayerEndStats(mc_total=opponent_mc)),
            ],
            awards=[],
        )

    def test_win_with_0_milestones_unlocks(self):
        from services.achievement_evaluators.definitions import NO_MILESTONE_WIN
        ev = SingleGameThresholdEvaluator(NO_MILESTONE_WIN, extractor=_no_milestone_win_extractor)
        game = self._make_game_with_milestones("p1", [], total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 1

    def test_win_with_1_milestone_does_not_unlock(self):
        from services.achievement_evaluators.definitions import NO_MILESTONE_WIN
        ev = SingleGameThresholdEvaluator(NO_MILESTONE_WIN, extractor=_no_milestone_win_extractor)
        game = self._make_game_with_milestones("p1", ["Terraformer"], total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 0

    def test_lose_with_0_milestones_does_not_unlock(self):
        from services.achievement_evaluators.definitions import NO_MILESTONE_WIN
        ev = SingleGameThresholdEvaluator(NO_MILESTONE_WIN, extractor=_no_milestone_win_extractor)
        game = self._make_game_with_milestones("p1", [], total_points=50, opponent_points=80)
        assert ev.compute_tier("p1", [game]) == 0

    def test_tied_first_with_0_milestones_unlocks(self):
        from services.achievement_evaluators.definitions import NO_MILESTONE_WIN
        ev = SingleGameThresholdEvaluator(NO_MILESTONE_WIN, extractor=_no_milestone_win_extractor)
        # Same total points and same MC = real tie, both position 1
        game = self._make_game_with_milestones("p1", [], total_points=80, opponent_points=80, opponent_mc=30)
        assert ev.compute_tier("p1", [game]) == 1
        assert ev.compute_tier("opponent", [game]) == 1


# ── Award-based achievement helpers ──────────────────────────────────────────

def _make_award(award_name, opened_by, first_place, second_place=None):
    from models.award_result import AwardResult
    from models.enums import Award
    return AwardResult(
        award=Award(award_name),
        opened_by=opened_by,
        first_place=first_place,
        second_place=second_place or [],
    )


def _make_game_with_awards(player_id, awards, total_points, opponent_points=20, opponent_mc=30):
    """Create a game with specific awards and points."""
    player_score = make_player_score(terraform_rating=total_points)
    opponent_score = make_player_score(terraform_rating=opponent_points)
    return Game(
        game_id="g1",
        date=date(2026, 1, 1),
        map_name=MapName.THARSIS,
        expansions=[],
        draft=False,
        generations=10,
        player_results=[
            PlayerResult(player_id=player_id, corporation=Corporation.CREDICOR,
                         scores=player_score, end_stats=PlayerEndStats(mc_total=30)),
            PlayerResult(player_id="opponent", corporation=Corporation.CREDICOR,
                         scores=opponent_score, end_stats=PlayerEndStats(mc_total=opponent_mc)),
        ],
        awards=awards,
    )


# ── Award Master (SingleGameThreshold) Tests ─────────────────────────────────

class TestAwardMaster:
    def test_win_with_3_first_place_awards_unlocks(self):
        from services.achievement_evaluators.definitions import AWARD_MASTER
        ev = SingleGameThresholdEvaluator(AWARD_MASTER, extractor=_award_master_extractor)
        awards = [
            _make_award("Terrateniente", "p1", ["p1"]),
            _make_award("Banquero", "p1", ["p1"]),
            _make_award("Científico", "opponent", ["p1"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 1

    def test_win_with_2_first_place_awards_does_not_unlock(self):
        from services.achievement_evaluators.definitions import AWARD_MASTER
        ev = SingleGameThresholdEvaluator(AWARD_MASTER, extractor=_award_master_extractor)
        awards = [
            _make_award("Terrateniente", "p1", ["p1"]),
            _make_award("Banquero", "p1", ["p1"]),
            _make_award("Científico", "opponent", ["opponent"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 0

    def test_lose_with_3_first_place_awards_does_not_unlock(self):
        from services.achievement_evaluators.definitions import AWARD_MASTER
        ev = SingleGameThresholdEvaluator(AWARD_MASTER, extractor=_award_master_extractor)
        awards = [
            _make_award("Terrateniente", "p1", ["p1"]),
            _make_award("Banquero", "p1", ["p1"]),
            _make_award("Científico", "p1", ["p1"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=50, opponent_points=80)
        assert ev.compute_tier("p1", [game]) == 0

    def test_shared_first_place_counts(self):
        from services.achievement_evaluators.definitions import AWARD_MASTER
        ev = SingleGameThresholdEvaluator(AWARD_MASTER, extractor=_award_master_extractor)
        awards = [
            _make_award("Terrateniente", "p1", ["p1", "opponent"]),
            _make_award("Banquero", "p1", ["p1"]),
            _make_award("Científico", "p1", ["p1", "opponent"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 1


# ── No Award Win (SingleGameThreshold) Tests ─────────────────────────────────

class TestNoAwardWin:
    def test_win_with_no_first_place_awards_unlocks(self):
        from services.achievement_evaluators.definitions import NO_AWARD_WIN
        ev = SingleGameThresholdEvaluator(NO_AWARD_WIN, extractor=_no_award_win_extractor)
        awards = [
            _make_award("Terrateniente", "p1", ["opponent"]),
            _make_award("Banquero", "opponent", ["opponent"]),
            _make_award("Científico", "opponent", ["opponent"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 1

    def test_win_with_one_first_place_does_not_unlock(self):
        from services.achievement_evaluators.definitions import NO_AWARD_WIN
        ev = SingleGameThresholdEvaluator(NO_AWARD_WIN, extractor=_no_award_win_extractor)
        awards = [
            _make_award("Terrateniente", "p1", ["p1"]),
            _make_award("Banquero", "opponent", ["opponent"]),
            _make_award("Científico", "opponent", ["opponent"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 0

    def test_lose_with_no_first_place_does_not_unlock(self):
        from services.achievement_evaluators.definitions import NO_AWARD_WIN
        ev = SingleGameThresholdEvaluator(NO_AWARD_WIN, extractor=_no_award_win_extractor)
        awards = [
            _make_award("Terrateniente", "p1", ["opponent"]),
            _make_award("Banquero", "opponent", ["opponent"]),
            _make_award("Científico", "opponent", ["opponent"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=50, opponent_points=80)
        assert ev.compute_tier("p1", [game]) == 0

    def test_no_awards_in_game_unlocks(self):
        from services.achievement_evaluators.definitions import NO_AWARD_WIN
        ev = SingleGameThresholdEvaluator(NO_AWARD_WIN, extractor=_no_award_win_extractor)
        game = _make_game_with_awards("p1", [], total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 1


# ── Stolen Awards (SingleGameThreshold) Tests ────────────────────────────────

class TestStolenAwards:
    def test_steal_1_award_unlocks_tier_1(self):
        from services.achievement_evaluators.definitions import STOLEN_AWARDS
        ev = SingleGameThresholdEvaluator(STOLEN_AWARDS, extractor=_stolen_awards_extractor)
        awards = [
            _make_award("Terrateniente", "opponent", ["p1"]),       # stolen: sole 1st, not opener
            _make_award("Banquero", "p1", ["p1"]),               # not stolen: p1 opened it
            _make_award("Científico", "opponent", ["opponent"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 1

    def test_steal_3_awards_unlocks_tier_3(self):
        from services.achievement_evaluators.definitions import STOLEN_AWARDS
        ev = SingleGameThresholdEvaluator(STOLEN_AWARDS, extractor=_stolen_awards_extractor)
        awards = [
            _make_award("Terrateniente", "opponent", ["p1"]),
            _make_award("Banquero", "opponent", ["p1"]),
            _make_award("Científico", "opponent", ["p1"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 3

    def test_shared_first_place_does_not_count_as_stolen(self):
        from services.achievement_evaluators.definitions import STOLEN_AWARDS
        ev = SingleGameThresholdEvaluator(STOLEN_AWARDS, extractor=_stolen_awards_extractor)
        awards = [
            _make_award("Terrateniente", "opponent", ["p1", "opponent"]),  # shared, not sole
            _make_award("Banquero", "opponent", ["p1"]),                # stolen
            _make_award("Científico", "opponent", ["opponent"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 1

    def test_opened_by_self_does_not_count(self):
        from services.achievement_evaluators.definitions import STOLEN_AWARDS
        ev = SingleGameThresholdEvaluator(STOLEN_AWARDS, extractor=_stolen_awards_extractor)
        awards = [
            _make_award("Terrateniente", "p1", ["p1"]),   # p1 opened it, not stolen
            _make_award("Banquero", "p1", ["p1"]),
            _make_award("Científico", "p1", ["p1"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 0

    def test_no_stolen_awards_tier_0(self):
        from services.achievement_evaluators.definitions import STOLEN_AWARDS
        ev = SingleGameThresholdEvaluator(STOLEN_AWARDS, extractor=_stolen_awards_extractor)
        awards = [
            _make_award("Terrateniente", "opponent", ["opponent"]),
            _make_award("Banquero", "opponent", ["opponent"]),
            _make_award("Científico", "opponent", ["opponent"]),
        ]
        game = _make_game_with_awards("p1", awards, total_points=80, opponent_points=50)
        assert ev.compute_tier("p1", [game]) == 0


# ── Card Points (SingleGameThreshold) Tests ──────────────────────────────────

class TestCardPoints:
    def test_card_points_tier_1(self):
        from services.achievement_evaluators.definitions import CARD_POINTS
        ev = SingleGameThresholdEvaluator(CARD_POINTS, extractor=_card_points_extractor)
        game = make_game(["p1", "p2"], scores_by_player={"p1": 20, "p2": 20})
        # Default make_player_score has card_points=0, need custom score
        game.player_results[0].scores.card_points = 15
        assert ev.compute_tier("p1", [game]) == 1

    def test_card_points_tier_5(self):
        from services.achievement_evaluators.definitions import CARD_POINTS
        ev = SingleGameThresholdEvaluator(CARD_POINTS, extractor=_card_points_extractor)
        game = make_game(["p1", "p2"], scores_by_player={"p1": 20, "p2": 20})
        game.player_results[0].scores.card_points = 55
        assert ev.compute_tier("p1", [game]) == 5

    def test_card_points_below_threshold(self):
        from services.achievement_evaluators.definitions import CARD_POINTS
        ev = SingleGameThresholdEvaluator(CARD_POINTS, extractor=_card_points_extractor)
        game = make_game(["p1", "p2"], scores_by_player={"p1": 20, "p2": 20})
        game.player_results[0].scores.card_points = 5
        assert ev.compute_tier("p1", [game]) == 0

    def test_card_points_best_across_games(self):
        from services.achievement_evaluators.definitions import CARD_POINTS
        ev = SingleGameThresholdEvaluator(CARD_POINTS, extractor=_card_points_extractor)
        game1 = make_game(["p1", "p2"], scores_by_player={"p1": 20, "p2": 20})
        game1.player_results[0].scores.card_points = 15
        game2 = make_game(["p1", "p2"], scores_by_player={"p1": 20, "p2": 20})
        game2.player_results[0].scores.card_points = 35
        assert ev.compute_tier("p1", [game1, game2]) == 3  # best is 35 -> tier 3


class TestRegistry:
    def test_all_evaluators_has_twelve_entries(self):
        assert len(ALL_EVALUATORS) == 12

    def test_all_codes_unique(self):
        codes = [ev.code for ev in ALL_EVALUATORS]
        assert len(codes) == len(set(codes)), "Registry has duplicate codes"

    def test_expected_codes_present(self):
        codes = {ev.code for ev in ALL_EVALUATORS}
        assert codes == {
            "high_score", "games_played", "games_won", "win_streak", "greenery_tiles",
            "all_maps", "milestone_master", "no_milestone_win",
            "award_master", "no_award_win", "stolen_awards", "card_points",
        }

    def test_all_evaluators_are_evaluator_instances(self):
        from services.achievement_evaluators.base import AchievementEvaluator
        for ev in ALL_EVALUATORS:
            assert isinstance(ev, AchievementEvaluator), f"{ev} is not an AchievementEvaluator"
