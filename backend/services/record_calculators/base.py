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
        record_last_game = self.calculate([current_game])

        achieved = record_before is None or record_last_game.value > record_before.value

        return RecordComparison(
            code=self.code,
            description=self.description,
            achieved=achieved,
            current = record_last_game if achieved else record_before,
            compared = record_before if achieved else record_last_game,
        )