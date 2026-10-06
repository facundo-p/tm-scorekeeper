"""Las partidas de un jugador dentro de un subconjunto, con lo que piden las estadísticas."""
from dataclasses import dataclass

from schemas.result import PlayerResultDTO
from services.stats.context import GameStats, StatsContext

# Categorías de puntaje en el orden del mockup (CATEGORIES en catalog.js).
CATEGORIES = ("terraform_rating", "award_points", "milestone_points", "card_resource_points",
              "card_points", "greenery_points", "city_points", "turmoil_points")


@dataclass(frozen=True)
class PlayerRow:
    gs: GameStats
    result: PlayerResultDTO

    @property
    def player_id(self) -> str:
        return self.result.player_id

    @property
    def n(self) -> int:
        return len(self.gs.results)

    @property
    def position(self) -> int:
        return self.result.position

    @property
    def total(self) -> int:
        return self.result.total_points

    @property
    def won(self) -> bool:
        return self.result.position == 1

    @property
    def scores(self):
        return self.gs.scores_of(self.player_id)

    @property
    def corporation(self) -> str:
        return next(p.corporation for p in self.gs.game.player_results if p.player_id == self.player_id).value

    def category(self, key: str) -> int:
        return getattr(self.scores, key) or 0


def all_rows(ctx: StatsContext) -> list[PlayerRow]:
    """Todas las filas del subconjunto: partidas en orden canónico, jugadores por posición."""
    return [PlayerRow(gs, r) for gs in ctx.games for r in gs.results]


def player_rows(ctx: StatsContext, player_id: str) -> list[PlayerRow]:
    return [row for row in all_rows(ctx) if row.player_id == player_id]
