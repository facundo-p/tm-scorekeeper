"""Temporadas y bitácora (F25, SEAS-01, STAT-12)."""
from typing import Optional

from models.game_subset import ALL_GAMES, GameSubset
from services.achievement_evaluators.derive import derive_achievements
from services.stats.context import StatsContext
from services.stats.feed import build_feed
from services.stats.seasons import season_race, season_spans, season_view, seasons


class UnknownSeason(KeyError):
    pass


class SeasonsService:
    def __init__(self, games_repository, players_repository):
        self.games_repository = games_repository
        self.players_repository = players_repository

    def _all(self) -> StatsContext:
        return StatsContext.load(self.games_repository)

    def seasons(self) -> list[dict]:
        return seasons(self._all())

    def season(self, number: Optional[int], category: str = "total", player_count: Optional[int] = None) -> dict:
        """Una temporada (la actual si `number` es None) con la carrera de la categoría y la mesa pedidas."""
        ctx = self._all()
        spans = season_spans(ctx)
        span = spans[-1] if number is None and spans else next((s for s in spans if s.number == number), None)
        if span is None:
            raise UnknownSeason(number)
        by_id = {gs.id: gs for gs in ctx.games}
        return {**season_view(span, by_id), "race": season_race(span, by_id, category, player_count)}

    def feed(self, subset: GameSubset = ALL_GAMES, limit: Optional[int] = None) -> list[dict]:
        players = self.players_repository.get_all()
        ctx = StatsContext.load(self.games_repository, subset)
        achievements = derive_achievements(ctx, [p.player_id for p in players])
        items = build_feed(ctx, achievements, self.seasons(), {p.player_id: p.name for p in players})
        return items[:limit] if limit else items
