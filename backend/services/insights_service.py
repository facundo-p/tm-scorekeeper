"""Ficha del jugador y ranking sobre un subconjunto (F25, STAT-11, STAT-12)."""
from datetime import date
from functools import cached_property
from typing import Optional

from models.game_subset import ALL_GAMES, GameSubset
from services.helpers.numbers import mean
from services.records.service import build_records
from services.stats.context import StatsContext
from services.stats.elo_replay import EloReplay, replay_elo
from services.stats.group import lead_changes, summary
from services.stats.insights import (
    archetype, by_table, composition, equity, favorites, head_to_head, rivals, split_stats, streaks,
)
from services.stats.player_rows import PlayerRow, all_rows

FORM_GAMES = 8


class GroupView:
    """Lo que comparten todos los jugadores de un subconjunto: filas, ELO reproducido y ranking."""

    def __init__(self, ctx: StatsContext, players):
        self.ctx = ctx
        self.players = sorted(players, key=lambda p: p.player_id)
        self.replay: EloReplay = replay_elo(ctx)
        self.rows = all_rows(ctx)
        self.rows_by_player = {p.player_id: [r for r in self.rows if r.player_id == p.player_id] for p in self.players}

    @cached_property
    def group_share(self) -> dict:
        return composition(self.rows)["share"]

    @cached_property
    def h2h(self) -> dict:
        return head_to_head(self.rows)

    @cached_property
    def ranking(self) -> list[str]:
        """Activos con partidas en el subconjunto, por ELO; a igual ELO, por id (D-67)."""
        ranked = [p for p in self.players if p.is_active and self.rows_by_player[p.player_id]]
        return [p.player_id for p in sorted(ranked, key=lambda p: -self.replay.ratings.get(p.player_id, 1000))]

    def rank_of(self, pid: str) -> Optional[int]:
        return self.ranking.index(pid) + 1 if pid in self.ranking else None


def elo_series(view: GroupView, pid: str) -> list[dict]:
    return [{"date": r.gs.game.date, "game_id": r.gs.id, "elo": c.elo_after, "delta": c.delta}
            for r in view.rows_by_player[pid] for c in view.replay.per_game[r.gs.id] if c.player_id == pid]


def history(view: GroupView, pid: str) -> list[dict]:
    """Partidas del jugador, de la más nueva a la más vieja, con el cambio de ELO (de mesa con el filtro)."""
    delta = {r.gs.id: next((c.delta for c in view.replay.per_game[r.gs.id] if c.player_id == pid), 0) for r in view.rows_by_player[pid]}
    return [{"game_id": r.gs.id, "date": r.gs.game.date, "map": r.gs.game.map_name.value, "position": r.position, "n": r.n,
             "total": r.total, "corporation": r.corporation, "delta": delta[r.gs.id]} for r in reversed(view.rows_by_player[pid])]


def _elo(view: GroupView, pid: str, series: list[dict]) -> dict:
    return {"elo": view.replay.ratings.get(pid, 1000), "peak": max((s["elo"] for s in series), default=None),
            "last_delta": series[-1]["delta"] if series else None}


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


def _archetype(view: GroupView, rows: list[PlayerRow]) -> Optional[dict]:
    return archetype(composition(rows), view.group_share) if rows else None


def _style(view: GroupView, rows: list[PlayerRow]) -> dict:
    return {"composition": composition(rows), "archetype": _archetype(view, rows),
            "corps": split_stats(rows, lambda r: r.corporation),
            "maps": split_stats(rows, lambda r: r.gs.game.map_name.value)}


def _form(rows: list[PlayerRow]) -> list[dict]:
    return [{"position": r.position, "n": r.n, "game_id": r.gs.id} for r in rows[-FORM_GAMES:]]


def player_insights(view: GroupView, pid: str) -> dict:
    mine = view.rows_by_player.get(pid, [])
    held = [v.definition.code for v in build_records(view.ctx) if pid in {h.player_id for h in v.state.holders}]
    return {
        **_basics(mine), **_averages(mine, pid), "favorites": favorites(mine), **_style(view, mine),
        "streak": streaks(mine), "form": _form(mine), **rivals(pid, view.h2h), "records_held": held,
        "rank": view.rank_of(pid), "rank_total": len(view.ranking), "equity": equity(mine),
        "by_table": by_table(mine), **_elo_full(view, pid),
    }


def _elo_full(view: GroupView, pid: str) -> dict:
    if pid not in view.rows_by_player:
        return {**_elo(view, pid, []), "elo_series": [], "history": []}
    series = elo_series(view, pid)
    return {**_elo(view, pid, series), "elo_series": series, "history": history(view, pid)}


def ranking_row(view: GroupView, player, since: Optional[date]) -> dict:
    """Una fila de la clasificación; `since` recorta solo la serie de ELO del gráfico."""
    rows = view.rows_by_player[player.player_id]
    full = elo_series(view, player.player_id)
    archetype_ = _archetype(view, rows)
    return {
        "player_id": player.player_id, "name": player.name, "color": player.color,
        "rank": view.rank_of(player.player_id), "games": len(rows), "wins": sum(1 for r in rows if r.won),
        "win_rate": _basics(rows)["win_rate"], "equity": equity(rows), "form": _form(rows),
        "archetype": archetype_["name"] if archetype_ else None, **_elo(view, player.player_id, full),
        "elo_series": [s for s in full if since is None or s["date"] >= since],
    }


class InsightsService:
    def __init__(self, games_repository, players_repository):
        self.games_repository = games_repository
        self.players_repository = players_repository

    def view(self, subset: GameSubset = ALL_GAMES) -> GroupView:
        return GroupView(StatsContext.load(self.games_repository, subset), self.players_repository.get_all())

    def insights(self, player_id: str, subset: GameSubset = ALL_GAMES) -> dict:
        return player_insights(self.view(subset), player_id)

    def ranking(self, subset: GameSubset = ALL_GAMES, since: Optional[date] = None) -> dict:
        """Clasificación y cambios de líder sobre una sola vista del subconjunto."""
        view = self.view(subset)
        by_id = {p.player_id: p for p in view.players}
        active = {p.player_id for p in view.players if p.is_active}
        return {"players": [ranking_row(view, by_id[pid], since) for pid in view.ranking],
                "lead_changes": lead_changes(view.ctx, view.replay, active)}

    def head_to_head(self, subset: GameSubset = ALL_GAMES) -> dict:
        view = self.view(subset)
        return {"matrix": view.h2h, "rivals": {pid: rivals(pid, view.h2h) for pid in view.h2h}}

    def summary(self, subset: GameSubset = ALL_GAMES) -> dict:
        return summary(StatsContext.load(self.games_repository, subset))
