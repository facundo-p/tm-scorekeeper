from abc import ABC, abstractmethod
from typing import List
from models.game import Game
from models.record_entry import RecordEntry


class RecordCalculator(ABC):

    code: str
    description: str

    @abstractmethod
    def calculate(self, games: List[Game]) -> RecordEntry | None:
        """
        Recibe una lista de juegos y devuelve el RecordEntry correspondiente.
        Devuelve None si no puede calcularse (por ejemplo, lista vacía).
        """
        pass