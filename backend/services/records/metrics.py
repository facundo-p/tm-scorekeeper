"""Candidatos por partida de cada récord de partida: [(player_id, valor)] (SEMANTICS §4.1)."""
from typing import Callable

from services.stats.context import GameStats

Candidates = list[tuple[str, float]]


def _per_player(value_of: Callable) -> Callable[[GameStats], Candidates]:
    return lambda gs: [(r.player_id, value_of(gs, r)) for r in gs.results]


def _score(field: str) -> Callable[[GameStats], Candidates]:
    return _per_player(lambda gs, r: getattr(gs.scores_of(r.player_id), field) or 0)


def _single_winner_margin(gs: GameStats) -> Candidates:
    return [(gs.winners[0], gs.margin)] if len(gs.winners) == 1 else []


def _points_per_generation(gs: GameStats, r) -> float:
    return round(r.total_points / gs.game.generations * 10) / 10  # half-even (D-06)


GAME_METRICS: dict[str, Callable[[GameStats], Candidates]] = {
    "highest_single_game_score": _per_player(lambda gs, r: r.total_points),
    "highest_terraform_rating": _score("terraform_rating"),
    "highest_card_points": _score("card_points"),
    "highest_card_resource_points": _score("card_resource_points"),
    "highest_greenery_points": _score("greenery_points"),
    "highest_city_points": _score("city_points"),
    "highest_turmoil_points": _score("turmoil_points"),  # el 0 lo descarta game_best (D-30)
    "biggest_margin": _single_winner_margin,
    "closest_win": _single_winner_margin,
    "points_per_generation": _per_player(_points_per_generation),
    "fastest_win": lambda gs: [(pid, gs.game.generations) for pid in gs.winners],
    "richest_finish": _per_player(lambda gs, r: r.mc_total),
}
