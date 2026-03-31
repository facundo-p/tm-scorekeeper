from typing import Callable
from models.game import Game
from models.achievement_definition import AchievementDefinition
from services.achievement_evaluators.base import AchievementEvaluator
from services.helpers.results import calculate_results


class SingleGameThresholdEvaluator(AchievementEvaluator):
    """
    Generic evaluator for achievements based on a single game threshold.
    Example: "Reach 100 points in one game."

    The extractor receives (player_id: str, game: Game, game_result_dto: GameResultDTO) -> int
    and should return the value to compare against tier thresholds.

    Uses calculate_results(game) internally — do NOT access PlayerResult.scores directly,
    as PlayerResult has no total_score attribute.
    """

    def __init__(self, definition: AchievementDefinition, extractor: Callable):
        self.definition = definition
        self.extractor = extractor  # (player_id, game, game_result_dto) -> int

    def compute_tier(self, player_id: str, games: list[Game]) -> int:
        max_value = 0
        for game in games:
            game_result = calculate_results(game)
            for r in game_result.results:
                if r.player_id == player_id:
                    max_value = max(max_value, self.extractor(player_id, game, game_result))
        achieved_tier = 0
        for tier in self.definition.tiers:
            if max_value >= tier.threshold:
                achieved_tier = tier.level
        return achieved_tier
