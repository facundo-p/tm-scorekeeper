from typing import Callable
from models.game import Game
from models.achievement_definition import AchievementDefinition
from models.achievement_progress import Progress
from services.achievement_evaluators.base import AchievementEvaluator


class AccumulatedEvaluator(AchievementEvaluator):
    """
    Generic evaluator for achievements based on accumulated counts.
    Example: "Play 10 games", "Win 5 games."

    The counter receives (player_id: str, games: list[Game]) -> int
    and should return the total count.
    """

    def __init__(self, definition: AchievementDefinition, counter: Callable):
        self.definition = definition
        self.counter = counter  # (player_id, games) -> int

    def compute_tier(self, player_id: str, games: list[Game]) -> int:
        count = self.counter(player_id, games)
        achieved_tier = 0
        for tier in self.definition.tiers:
            if count >= tier.threshold:
                achieved_tier = tier.level
        return achieved_tier

    def get_progress(self, player_id: str, games: list[Game], current_tier: int) -> Progress | None:
        count = self.counter(player_id, games)
        next_tier = self._next_tier(current_tier)
        if not next_tier:
            return None
        return Progress(current=count, target=next_tier.threshold)
