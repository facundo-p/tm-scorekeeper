from models.game import Game
from models.achievement_definition import AchievementDefinition
from models.achievement_progress import Progress
from services.achievement_evaluators.base import AchievementEvaluator
from services.helpers.results import calculate_results


class WinStreakEvaluator(AchievementEvaluator):
    """
    Custom evaluator for win streak achievements.
    compute_tier uses the maximum streak over the player's entire history.
    get_progress uses the current active streak (from end of chronological history).

    CRITICAL: Games are sorted by date before calculating streaks.
    GamesRepository.get_games_by_player() does NOT guarantee order.
    """

    def __init__(self, definition: AchievementDefinition):
        self.definition = definition

    def compute_tier(self, player_id: str, games: list[Game]) -> int:
        max_streak = self._calculate_max_streak(player_id, games)
        achieved_tier = 0
        for tier in self.definition.tiers:
            if max_streak >= tier.threshold:
                achieved_tier = tier.level
        return achieved_tier

    def get_progress(self, player_id: str, games: list[Game], current_tier: int) -> Progress | None:
        current_streak = self._calculate_current_streak(player_id, games)
        next_tier = self._next_tier(current_tier)
        if not next_tier:
            return None
        return Progress(current=current_streak, target=next_tier.threshold)

    def _calculate_max_streak(self, player_id: str, games: list[Game]) -> int:
        """Maximum consecutive wins over entire history (chronological)."""
        sorted_games = sorted(games, key=lambda g: g.date)
        streak = 0
        max_streak = 0
        for game in sorted_games:
            # Only consider games where this player participated
            if not any(pr.player_id == player_id for pr in game.player_results):
                continue
            game_result = calculate_results(game)
            winner = game_result.results[0]
            if winner.player_id == player_id and not winner.tied:
                streak += 1
                max_streak = max(max_streak, streak)
            else:
                streak = 0
        return max_streak

    def _calculate_current_streak(self, player_id: str, games: list[Game]) -> int:
        """Active streak from the END of chronological history (for progress display)."""
        sorted_games = sorted(games, key=lambda g: g.date)
        streak = 0
        for game in reversed(sorted_games):
            # Skip games where player didn't participate
            if not any(pr.player_id == player_id for pr in game.player_results):
                continue
            game_result = calculate_results(game)
            winner = game_result.results[0]
            if winner.player_id == player_id and not winner.tied:
                streak += 1
            else:
                break
        return streak
