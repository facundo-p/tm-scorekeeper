"""Estadísticas de un jugador frente al grupo (F25, STAT-11, SEMANTICS §6 y §8).

Espejo de las funciones de jugador de docs/redesign/mockup/js/data/derive.js; los floats salen
iguales porque se suma de izquierda a derecha (services/helpers/numbers.py).
"""
from collections import Counter
from typing import Callable, Optional

from services.helpers.numbers import mean, mean_or_none, plain_sum
from services.stats.player_rows import CATEGORIES, PlayerRow

TABLE_SIZES = (2, 3, 4, 5)
RIVAL_MIN_GAMES = 4

ARCHETYPES = {
    "terraform_rating": ("Terraformador puro", "Vive del TR: sube parámetros antes que nadie."),
    "award_points": ("Cazarrecompensas", "Financia y gana recompensas como nadie."),
    "milestone_points": ("Cazador de hitos", "Llega primero a los hitos del mapa."),
    "card_resource_points": ("Bioingeniero", "Microbios, animales y flotadores sobre sus cartas."),
    "card_points": ("Coleccionista de proyectos", "Su motor está en la mano de cartas."),
    "greenery_points": ("Jardinero de Marte", "Llena el mapa de vegetación."),
    "city_points": ("Urbanista", "Ciudades rodeadas de verde, puntos asegurados."),
    "turmoil_points": ("Operador político", "Delegados, partidos y favores en Turmoil."),
}


def streaks(rows: list[PlayerRow]) -> dict:
    best = current = 0
    for r in rows:
        current = current + 1 if r.won else 0
        best = max(best, current)
    return {"best": best, "current": current}


def split_stats(rows: list[PlayerRow], key: Callable[[PlayerRow], str]) -> list[dict]:
    """Por corporación o mapa: más partidas primero, después más victorias (orden estable)."""
    groups: dict[str, list[PlayerRow]] = {}
    for r in rows:
        groups.setdefault(key(r), []).append(r)
    stats = [{"name": name, "games": len(g), "wins": sum(1 for r in g if r.won),
              "avg": round(mean(g, lambda r: r.total)), "avg_pos": mean(g, lambda r: r.position)}
             for name, g in groups.items()]
    return sorted(stats, key=lambda s: (-s["games"], -s["wins"]))


def most_common(names: list[str]) -> Optional[dict]:
    """Todos los nombres empatados arriba (#35, #66)."""
    counts = Counter(names)
    top = max(counts.values(), default=0)
    return {"names": sorted(n for n, c in counts.items() if c == top), "count": top} if top else None


def _awards_won(row: PlayerRow) -> list[str]:
    return [a.award.value for a in row.gs.game.awards if row.player_id in a.first_place]


def favorites(rows: list[PlayerRow]) -> dict:
    return {
        "milestone": most_common([m.value for r in rows for m in r.scores.milestones]),
        "award": most_common([name for r in rows for name in _awards_won(r)]),
    }


def composition(rows: list[PlayerRow]) -> dict:
    averages = {c: mean(rows, lambda r, c=c: r.category(c)) for c in CATEGORIES}
    total = plain_sum(averages.values()) or 1
    return {"avg": averages, "share": {c: v / total for c, v in averages.items()}}


def archetype(comp: dict, group_share: dict) -> Optional[dict]:
    """La categoría donde más se despega del grupo (con al menos 2 % de su puntaje)."""
    best = None
    for c in CATEGORIES:
        ratio = comp["share"][c] / (group_share[c] or 1)
        if comp["share"][c] > 0.02 and (best is None or ratio > best[1]):
            best = (c, ratio)
    if best is None:
        return None
    name, desc = ARCHETYPES[best[0]]
    return {"key": best[0], "name": name, "desc": desc, "share": comp["share"][best[0]],
            "group": group_share[best[0]], "ratio": best[1]}


def equity(rows: list[PlayerRow]) -> dict:
    """Victorias esperadas = Σ 1/n; posición relativa = promedio de (n − pos)/(n − 1)."""
    expected = plain_sum(1 / r.n for r in rows)
    wins = sum(1 for r in rows if r.won)
    return {"expected": expected, "wins_vs_expected": wins - expected,
            "wins_ratio": wins / expected if expected else None,
            "rel_pos": mean_or_none(rows, lambda r: (r.n - r.position) / (r.n - 1))}


def by_table(rows: list[PlayerRow]) -> list[dict]:
    out = []
    for n in TABLE_SIZES:
        sub = [r for r in rows if r.n == n]
        avg = round(mean(sub, lambda r: r.total)) if sub else None
        out.append({"n": n, "games": len(sub), "wins": sum(1 for r in sub if r.won), "avg_points": avg, **equity(sub)})
    return out


def head_to_head(rows: list[PlayerRow]) -> dict[str, dict[str, dict]]:
    """Para cada par, partidas juntos y cuántas veces quedó adelante, atrás o igual."""
    h: dict[str, dict[str, dict]] = {}
    by_game: dict[str, list[PlayerRow]] = {}
    for r in rows:
        by_game.setdefault(r.gs.id, []).append(r)
    for game_rows in by_game.values():
        for a in game_rows:
            for b in game_rows:
                if a is not b:
                    _count_pair(h.setdefault(a.player_id, {}).setdefault(
                        b.player_id, {"games": 0, "ahead": 0, "behind": 0, "even": 0}), a.position, b.position)
    return h


def _count_pair(cell: dict, mine: int, theirs: int) -> None:
    cell["games"] += 1
    cell["ahead" if mine < theirs else "behind" if mine > theirs else "even"] += 1


def _rate(pair: tuple) -> float:
    return pair[1]["ahead"] / pair[1]["games"]


def _rival(pair: Optional[tuple]) -> Optional[dict]:
    return {"player_id": pair[0], **pair[1]} if pair else None


def rivals(player_id: str, h2h: dict) -> dict:
    """Némesis (le gana más seguido) y víctima, con al menos 4 partidas juntos; a igual tasa,
    el de más partidas (y después el primero que apareció)."""
    pairs = [(pid, c) for pid, c in h2h.get(player_id, {}).items() if c["games"] >= RIVAL_MIN_GAMES]
    nemesis = min(pairs, key=lambda p: (_rate(p), -p[1]["games"]), default=None)
    victim = min(pairs, key=lambda p: (-_rate(p), -p[1]["games"]), default=None)
    return {"nemesis": _rival(nemesis), "victim": _rival(victim)}
