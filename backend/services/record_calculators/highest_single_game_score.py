from typing import List
from models.game import Game
from models.record_entry import RecordEntry
from services.helpers.records import best_with_holders, holders_entry
from services.record_calculators.base import RecordCalculator
from services.helpers.results import calculate_results


class HighestSingleGameScoreCalculator(RecordCalculator):

    code = "highest_single_game_score"
    description = "Mayor PUNTUACIÓN FINAL en una sola partida"
    title = "Emperador de Marte"
    emoji = "🏆"

    def calculate(self, games: List[Game]) -> RecordEntry | None:
        candidates = (
            (r.total_points, r.player_id, g.date) for g in games for r in calculate_results(g).results
        )
        best, holders = best_with_holders(candidates)
        return None if best is None else holders_entry(best, holders, self.title)
