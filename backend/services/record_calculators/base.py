from abc import ABC, abstractmethod
from typing import List
from models.record_entry import RecordEntry
from models.game import Game
from models.record_comparison import RecordComparison


class RecordCalculator(ABC):

    code: str
    description: str

    @abstractmethod
    def calculate(self, games: List[Game]) -> RecordEntry | None:
        pass

    def evaluate(self, games_until_current: List[Game]) -> RecordComparison | None:

        if not games_until_current:
            return None

        current_game = games_until_current[-1]
        previous_games = games_until_current[:-1]

        record_before = self.calculate(previous_games)
        record_after = self.calculate(games_until_current)

        if record_after is None:
            return None

        if record_before is None:
            achieved = True
            compared = None

        elif record_after.value > record_before.value:
            achieved = True
            compared = record_before

        else:
            achieved = False
            compared = record_before

        return RecordComparison(
            code=self.code,
            description=self.description,
            achieved=achieved,
            current=record_after,
            compared=compared,
        )