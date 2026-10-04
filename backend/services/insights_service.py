"""Ficha de un jugador sobre un subconjunto (F25, STAT-11): GET /players/{id}/insights."""
from models.game_subset import ALL_GAMES, GameSubset
from services.helpers.numbers import mean
from services.records.service import build_records
from services.stats.context import StatsContext
from services.stats.elo_replay import EloReplay, replay_elo
from services.stats.insights import (
    archetype, by_table, composition, equity, favorites, head_to_head, rivals, split_stats, streaks,
)
from services.stats.player_rows import PlayerRow, all_rows

FORM_GAMES = 8


def _elo(pid: str, rows: list[PlayerRow], replay: EloReplay) -> dict:
    series = [c for r in rows for c in replay.per_game[r.gs.id] if c.player_id == pid]
    return {"elo": replay.ratings.get(pid, 1000), "peak": max((c.elo_after for c in series), default=None),
            "last_delta": series[-1].delta if series else None}


def _basics(rows: list[PlayerRow]) -> dict:
    wins = sum(1 for r in rows if r.won)
    best = max(rows, key=lambda r: r.total, default=None)  # la primera con el máximo
    return {
        "games": len(rows), "wins": wins, "win_rate": wins / len(rows) if rows else 0,
        "podium_rate": sum(1 for r in rows if r.position <= 2) / len(rows) if rows else 0,
        "avg_points": round(mean(rows, lambda r: r.total)), "avg_pos": mean(rows, lambda r: r.position),
        "best": best.total if best else 0, "best_game": best.gs.id if best else None,
    }


def _averages(rows: list[PlayerRow], pid: str) -> dict:
    return {
        "avg_milestones": mean(rows, lambda r: len(r.scores.milestones)),
        "avg_awards": mean(rows, lambda r: sum(1 for a in r.gs.game.awards if pid in a.first_place)),
        "points_per_gen": mean(rows, lambda r: r.total / r.gs.game.generations),
    }


def _style(rows: list[PlayerRow], group_share: dict) -> dict:
    comp = composition(rows)
    return {"composition": comp, "archetype": archetype(comp, group_share) if rows else None,
            "corps": split_stats(rows, lambda r: r.corporation),
            "maps": split_stats(rows, lambda r: r.gs.game.map_name.value)}


def _form(rows: list[PlayerRow]) -> list[dict]:
    return [{"position": r.position, "n": r.n, "game_id": r.gs.id} for r in rows[-FORM_GAMES:]]


def _ranking(players, games_by_player: dict, replay: EloReplay) -> list[str]:
    """Activos con partidas en el subconjunto, por ELO (estable en el orden de los jugadores)."""
    ranked = [p for p in players if p.is_active and games_by_player.get(p.player_id)]
    return [p.player_id for p in sorted(ranked, key=lambda p: -replay.ratings.get(p.player_id, 1000))]


class InsightsService:
    def __init__(self, games_repository, players_repository):
        self.games_repository = games_repository
        self.players_repository = players_repository

    def insights(self, player_id: str, subset: GameSubset = ALL_GAMES) -> dict:
        ctx = StatsContext.load(self.games_repository, subset)
        return player_insights(ctx, replay_elo(ctx), self._players(), player_id)

    def _players(self):
        return sorted(self.players_repository.get_all(), key=lambda p: p.player_id)


def player_insights(ctx: StatsContext, replay: EloReplay, players, pid: str) -> dict:
    rows = all_rows(ctx)
    mine = [r for r in rows if r.player_id == pid]
    games_by_player = {p.player_id: [r for r in rows if r.player_id == p.player_id] for p in players}
    ranking = _ranking(players, games_by_player, replay)
    held = [v.definition.code for v in build_records(ctx) if pid in {h.player_id for h in v.state.holders}]
    return {
        **_basics(mine), **_averages(mine, pid), "favorites": favorites(mine),
        **_style(mine, composition(rows)["share"]), "streak": streaks(mine), "form": _form(mine),
        **rivals(pid, head_to_head(rows)), "records_held": held,
        "rank": ranking.index(pid) + 1 if pid in ranking else None, "rank_total": len(ranking),
        "equity": equity(mine), "by_table": by_table(mine), **_elo(pid, mine, replay),
    }
