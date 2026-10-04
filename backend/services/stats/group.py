"""Métricas del grupo sobre un subconjunto (F25, STAT-12): resumen y cambios de líder."""
from typing import Optional

from services.helpers.numbers import mean, plain_sum
from services.stats.context import StatsContext
from services.stats.elo_replay import EloReplay
from services.stats.insights import composition, split_stats
from services.stats.player_rows import PlayerRow, all_rows


def summary(ctx: StatsContext) -> dict:
    """Totales del grupo: partidas, generaciones, ganador promedio, corporaciones y mapas."""
    games = ctx.games
    by_corp = split_stats(all_rows(ctx), lambda r: r.corporation)
    winners = [PlayerRow(gs, gs.results[0]) for gs in games]
    by_map = split_stats(winners, lambda r: r.gs.game.map_name.value)
    return {
        "games": len(games), "generations": plain_sum(gs.game.generations for gs in games),
        "avg_winner": round(mean(games, lambda gs: gs.results[0].total_points)),
        "avg_generations": mean(games, lambda gs: gs.game.generations),
        "first": games[0].game.date if games else None, "last": games[-1].game.date if games else None,
        "top_corp": by_corp[0] if by_corp else None, "corps_used": len(by_corp),
        "top_map": by_map[0] if by_map else None, "maps": by_map, "composition": composition(all_rows(ctx)),
    }


def _leader(ratings: dict[str, int], order: list[str], active: set[str]) -> Optional[str]:
    """El de más ELO entre los activos; a igual ELO, el que apareció primero (como el mockup)."""
    candidates = [pid for pid in order if pid in active and pid in ratings]
    return max(candidates, key=lambda pid: ratings[pid], default=None)


def lead_changes(ctx: StatsContext, replay: EloReplay, active: set[str]) -> list[dict]:
    """Cada vez que cambia quién encabeza el ranking, con la partida que lo cambió."""
    ratings: dict[str, int] = {}
    order: list[str] = []
    changes, leader = [], None
    for gs in ctx.games:
        for r in gs.results:
            if r.player_id not in order:
                order.append(r.player_id)
            ratings[r.player_id] = replay.after(gs.id, r.player_id)
        now = _leader(ratings, order, active)
        if now != leader:
            changes.append({"date": gs.game.date, "game_id": gs.id, "player_id": now})
            leader = now
    return changes
