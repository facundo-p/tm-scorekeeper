from typing import List
from models.game import Game
from models.record_entry import RecordEntry, RecordAttribute, LABEL_PLAYER, LABEL_DATE
from services.record_calculators.base import RecordCalculator
from services.helpers.results import calculate_results


class HighestSingleGameScoreCalculator(RecordCalculator):

    code = "highest_single_game_score"
    description = "Mayor PUNTUACIÓN FINAL en una sola partida"

    def calculate(self, games: List[Game]) -> RecordEntry | None:
        if not games:
            return None

        max_points = None
        record_player_id = None
        record_date = None

        for game in games:
            results = calculate_results(game)

            for result in results.results:
                if max_points is None or result.total_points > max_points:
                    max_points = result.total_points
                    record_player_id = result.player_id
                    record_date = game.date

        if max_points is None:
            return None

        return RecordEntry(
            value=max_points,
            attributes=[
                RecordAttribute(label=LABEL_PLAYER, value=record_player_id),
                RecordAttribute(label=LABEL_DATE, value=str(record_date)),
            ],
        )
