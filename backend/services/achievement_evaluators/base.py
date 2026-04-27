from abc import ABC, abstractmethod
from models.game import Game
from models.achievement_definition import AchievementDefinition
from models.achievement_tier import AchievementTier
from models.achievement_progress import Progress
from models.evaluation_result import EvaluationResult


class AchievementEvaluator(ABC):
    definition: AchievementDefinition

    @property
    def code(self) -> str:
        return self.definition.code

    @abstractmethod
    def compute_tier(self, player_id: str, games: list[Game]) -> int:
        """Return the maximum tier achieved (0 = none)."""

    def get_progress(self, player_id: str, games: list[Game], current_tier: int) -> Progress | None:
        """Progress toward the next tier. Returns None if not applicable."""
        return None

    def _next_tier(self, current_tier: int) -> AchievementTier | None:
        """Return the AchievementTier at level current_tier+1, or None."""
        for tier in self.definition.tiers:
            if tier.level == current_tier + 1:
                return tier
        return None

    def evaluate(self, player_id: str, games: list[Game], persisted_tier: int) -> EvaluationResult:
        """Compare computed tier vs persisted tier. Returns EvaluationResult with new_tier=None if no change."""
        computed = self.compute_tier(player_id, games)
        if computed > persisted_tier:
            return EvaluationResult(
                new_tier=computed,
                is_new=(persisted_tier == 0),
                is_upgrade=(persisted_tier > 0),
            )
        return EvaluationResult(new_tier=None)
