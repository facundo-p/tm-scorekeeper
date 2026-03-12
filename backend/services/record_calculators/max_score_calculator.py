from typing import List, Callable
from models.game import Game
from models.record_entry import RecordEntry, RecordAttribute, LABEL_PLAYER, LABEL_DATE
from services.record_calculators.base import RecordCalculator


class MaxScoreCalculator(RecordCalculator):

    def __init__(self, extractor: Callable, code: str, description: str):
        self.extractor = extractor
        self.code = code
        self.description = description

    def calculate(self, games: List[Game]) -> RecordEntry | None:

        if not games:
            return None

        max_value = None
        record_player_id = None
        record_date = None

        for game in games:
            for p in game.player_results:

                value = self.extractor(p)

                if max_value is None or value > max_value:
                    max_value = value
                    record_player_id = p.player_id
                    record_date = game.date

        if max_value is None:
            return None

        return RecordEntry(
            value=max_value,
            attributes=[
                RecordAttribute(label=LABEL_PLAYER, value=record_player_id),
                RecordAttribute(label=LABEL_DATE, value=str(record_date)),
            ],
        )