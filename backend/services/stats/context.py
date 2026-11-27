"""StatsContext: las partidas de un subconjunto, leídas una vez y en orden canónico, con sus
posiciones, ganadores y margen ya calculados (F22, STAT-01).
"""
from dataclasses import dataclass
from typing import Optional

from models.game import Game
from models.game_subset import ALL_GAMES, GameSubset
from schemas.result import PlayerResultDTO
from services.helpers.order import chronological
from services.helpers.results import calculate_results, winners


@dataclass(frozen=True)
class GameStats:
    game: Game
    results: list[PlayerResultDTO]
    winners: list[str]
    margin: int

    @property
    def id(self) -> str:
        return self.game.id

    @property
    def decided_by_mc(self) -> bool:
        """Los dos primeros empataron en puntos y desempató el M€ (o siguen empatados)."""
        return len(self.results) > 1 and self.results[0].total_points == self.results[1].total_points

    def scores_of(self, player_id: str):
        return next(p.scores for p in self.game.player_results if p.player_id == player_id)


def _margin(results: list[PlayerResultDTO]) -> int:
    """Total del primero menos el del primero que no comparte la posición 1 (0 si no hay)."""
    if len(results) < 2:
        return 0
    first = results[0].total_points
    runner_up = next((r.total_points for r in results if r.position > 1), first)
    return first - runner_up


def game_stats(game: Game) -> GameStats:
    result = calculate_results(game)
    return GameStats(game=game, results=result.results, winners=winners(result), margin=_margin(result.results))


class StatsContext:
    def __init__(self, games: list[Game], subset: GameSubset = ALL_GAMES):
        self.subset = subset
        self.games = [game_stats(g) for g in chronological(games) if subset.matches(g)]
        self._by_id = {gs.id: gs for gs in self.games}

    @classmethod
    def load(cls, games_repository, subset: GameSubset = ALL_GAMES) -> "StatsContext":
        return cls(games_repository.list_games(), subset)

    def get(self, game_id: str) -> Optional[GameStats]:
        return self._by_id.get(game_id)
