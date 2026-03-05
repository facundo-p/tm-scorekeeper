from typing import List
from models.game import Game
from models.record_entry import RecordEntry
from services.record_calculators.base import RecordCalculator
from helpers.results import calculate_results


class HighestSingleGameScoreCalculator(RecordCalculator):

    code = "highest_single_game_score"
    description = "Highest single game score"

    def calculate(self, games: List[Game]) -> RecordEntry | None:
        if not games:
            return None

        max_points = None
        record_player_id = None
        record_game_id = None

        for game in games:
            results = calculate_results(game)

            for result in results.results:
                if max_points is None or result.total_points > max_points:
                    max_points = result.total_points
                    record_player_id = result.player_id
                    record_game_id = game.id

        if max_points is None:
            return None

        return RecordEntry(
            code=self.code,
            description=self.description,
            value=max_points,
            player_id=record_player_id,
            game_id=record_game_id,
        )