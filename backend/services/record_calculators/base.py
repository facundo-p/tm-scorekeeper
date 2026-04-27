from abc import ABC, abstractmethod
from typing import List
from models.record_entry import RecordEntry
from models.game import Game
from models.record_comparison import RecordComparison


class RecordCalculator(ABC):

    code: str
    description: str
    title: str | None = None
    emoji: str | None = None

    @abstractmethod
    def calculate(self, games: List[Game]) -> RecordEntry | None:
        pass

    def games_for_current(self, games_until_current: List[Game]) -> List[Game]:
        """
        Define qué partidas usar para evaluar el resultado actual del record.
        Por defecto usa solo la última partida.
        Los calculators acumulativos pueden sobrescribir este método.
        """
        return [games_until_current[-1]]
    
    def evaluate(self, games_until_current: List[Game]) -> RecordComparison | None:

        if not games_until_current:
            return None

        previous_games = games_until_current[:-1]

        record_before = self.calculate(previous_games)
        record_after = self.calculate(self.games_for_current(games_until_current))

        achieved = record_before is None or record_after.value > record_before.value

        return RecordComparison(
            code=self.code,
            description=self.description,
            title=self.title,
            emoji=self.emoji,
            achieved=achieved,
            current=record_after if achieved else record_before,
            compared=record_before if achieved else record_after,
        )