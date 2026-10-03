from typing import List, Callable
from models.game import Game
from models.record_entry import RecordEntry
from services.helpers.records import best_with_holders, holders_entry
from services.record_calculators.base import RecordCalculator


class MaxScoreCalculator(RecordCalculator):

    def __init__(self, extractor: Callable, code: str, description: str, title: str | None = None, emoji: str | None = None):
        self.extractor = extractor
        self.code = code
        self.description = description
        self.title = title
        self.emoji = emoji

    def calculate(self, games: List[Game]) -> RecordEntry | None:
        candidates = ((self.extractor(p), p.player_id, g.date) for g in games for p in g.player_results)
        best, holders = best_with_holders(candidates)
        return None if best is None else holders_entry(best, holders, self.title)
