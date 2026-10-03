"""Subconjunto de partidas para las estadísticas (F22, STAT-01, SEMANTICS §9).

Filtrar nunca escribe: solo elige qué partidas se leen. Sin filtros es «todas».
"""
from dataclasses import dataclass
from typing import Optional

from models.enums import Expansion, MapName


@dataclass(frozen=True)
class GameSubset:
    player_count: Optional[int] = None
    map: Optional[MapName] = None
    expansion: Optional[Expansion] = None

    @property
    def is_all(self) -> bool:
        return self.player_count is None and self.map is None and self.expansion is None

    def matches(self, game) -> bool:
        return ((self.player_count is None or len(game.player_results) == self.player_count)
                and (self.map is None or game.map_name == self.map)
                and (self.expansion is None or self.expansion in game.expansions))


ALL_GAMES = GameSubset()
