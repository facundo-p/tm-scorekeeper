"""Temporadas: el Marte del grupo (F25, SEAS-01, SEMANTICS §10, D-15).

Cada partida sube la temperatura, el oxígeno (según la vegetación) y los océanos; la
temporada cierra cuando los tres llegan al tope. Los límites salen siempre de todas las
partidas; el filtro de mesa solo elige qué partidas entran en la carrera.
"""
from dataclasses import dataclass, field
from math import floor
from typing import Optional

from services.helpers.numbers import plain_sum
from services.stats.context import GameStats, StatsContext
from services.stats.player_rows import CATEGORIES

TEMP_PER_GAME, OXYGEN_PER_GREENERY, OCEANS_PER_GAME = 0.8, 1 / 52, 0.375
TEMP_MAX, OXYGEN_MAX, OCEANS_MAX = 19, 14, 9
MIN_SEASON_GAMES = 3
SEASON_CATEGORIES = ("total", *CATEGORIES)


@dataclass
class SeasonSpan:
    number: int
    start: object
    games: list[str] = field(default_factory=list)
    temp: float = 0
    oxygen: float = 0
    oceans: float = 0
    end: Optional[object] = None

    def add(self, gs: GameStats) -> None:
        greenery = plain_sum(gs.scores_of(r.player_id).greenery_points for r in gs.results)
        self.games.append(gs.id)
        self.temp = min(TEMP_MAX, self.temp + TEMP_PER_GAME)
        self.oxygen = min(OXYGEN_MAX, self.oxygen + greenery * OXYGEN_PER_GREENERY)
        self.oceans = min(OCEANS_MAX, self.oceans + OCEANS_PER_GAME)
        if self.temp >= TEMP_MAX and self.oxygen >= OXYGEN_MAX and self.oceans >= OCEANS_MAX:
            self.end = gs.game.date


def season_spans(ctx: StatsContext) -> list[SeasonSpan]:
    spans: list[SeasonSpan] = []
    current: Optional[SeasonSpan] = None
    for gs in ctx.games:
        current = current or SeasonSpan(number=len(spans) + 1, start=gs.game.date)
        current.add(gs)
        if current.end:
            spans.append(current)
            current = None
    return spans + ([current] if current else [])


def _value(gs: GameStats, result, category: str) -> int:
    if category == "total":
        return result.total_points
    return getattr(gs.scores_of(result.player_id), category) or 0


def _race_rows(games: list[GameStats], category: str) -> list[dict]:
    pool = [gs for gs in games if category != "turmoil_points" or "Turmoil" in {e.value for e in gs.game.expansions}]
    values: dict[str, list[int]] = {}
    for gs in pool:
        for r in gs.results:
            values.setdefault(r.player_id, []).append(_value(gs, r, category))
    return [{"player_id": pid, "games": len(v), "avg": plain_sum(v) / len(v), "best": max(v)} for pid, v in values.items()]


def season_race(span: SeasonSpan, by_id: dict[str, GameStats], category: str = "total",
                player_count: Optional[int] = None) -> dict:
    """Carrera por promedio (D-15): 3 partidas para clasificar; el resto aparte con lo que le falta."""
    games = [by_id[g] for g in span.games if player_count is None or len(by_id[g].results) == player_count]
    rows = sorted(_race_rows(games, category), key=lambda r: (-r["avg"], -r["games"], -r["best"], r["player_id"]))
    return {
        "category": category, "games": len(games),
        "qualified": [r for r in rows if r["games"] >= MIN_SEASON_GAMES],
        "pending": [{**r, "missing": MIN_SEASON_GAMES - r["games"]} for r in rows if r["games"] < MIN_SEASON_GAMES],
    }


def season_view(span: SeasonSpan, by_id: dict[str, GameStats]) -> dict:
    t, o, w = floor(span.temp), floor(span.oxygen), floor(span.oceans)
    race = season_race(span, by_id)
    champion = (race["qualified"][0]["player_id"] if race["qualified"] else None) if span.end else None
    return {
        "number": span.number, "start": span.start, "end": span.end, "games": span.games,
        "temp": span.temp, "oxygen": span.oxygen, "oceans": span.oceans,
        "temperature": -30 + t * 2, "oxygen_pct": o, "ocean_count": w,
        "pct": (t / TEMP_MAX + o / OXYGEN_MAX + w / OCEANS_MAX) / 3, "race": race, "champion": champion,
    }


def seasons(ctx: StatsContext) -> list[dict]:
    """Siempre sobre todas las partidas (las temporadas son del grupo)."""
    by_id = {gs.id: gs for gs in ctx.games}
    return [season_view(s, by_id) for s in season_spans(ctx)]
