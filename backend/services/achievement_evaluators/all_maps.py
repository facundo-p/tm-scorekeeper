from models.game import Game
from models.achievement_definition import AchievementDefinition
from models.achievement_progress import Progress
from services.achievement_evaluators.base import AchievementEvaluator


class AllMapsEvaluator(AchievementEvaluator):
    """
    Custom evaluator for the "play on all maps" achievement.
    MapName enum has exactly 5 values. Tiers: 2 maps (tier 1), 3 maps (tier 2), 5 maps (tier 3).
    Counts unique maps in games where the player participated.
    """

    def __init__(self, definition: AchievementDefinition):
        self.definition = definition

    def compute_tier(self, player_id: str, games: list[Game]) -> int:
        played_maps = self._get_played_maps(player_id, games)
        count = len(played_maps)
        achieved_tier = 0
        for tier in self.definition.tiers:
            if count >= tier.threshold:
                achieved_tier = tier.level
        return achieved_tier

    def get_progress(self, player_id: str, games: list[Game], current_tier: int) -> Progress | None:
        played_maps = self._get_played_maps(player_id, games)
        next_tier = self._next_tier(current_tier)
        if not next_tier:
            return None
        return Progress(current=len(played_maps), target=next_tier.threshold)

    def _get_played_maps(self, player_id: str, games: list[Game]) -> set:
        """Return set of unique map_names for games where player participated."""
        return {
            game.map_name
            for game in games
            if any(pr.player_id == player_id for pr in game.player_results)
        }
