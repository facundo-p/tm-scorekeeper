"""Récords de carrera (SEMANTICS §4.2, D-18): el valor es el mejor acumulado entre los
jugadores; el historial registra solo los cambios del conjunto de poseedores, fechados en la
partida que los produjo.
"""
from dataclasses import dataclass
from typing import Callable

from services.records.definitions import RecordDef
from services.records.tracker import HistoryEntry, Holder, RecordState
from services.stats.context import GameStats, StatsContext
from services.stats.elo_replay import replay_elo


@dataclass
class CareerTotals:
    games: int = 0
    wins: int = 0
    current_streak: int = 0
    best_streak: int = 0
    peak_elo: int = 0


CAREER_VALUE: dict[str, Callable[[CareerTotals], int]] = {
    "most_games_played": lambda t: t.games,
    "most_games_won": lambda t: t.wins,
    "highest_elo": lambda t: t.peak_elo,
    "longest_streak": lambda t: t.best_streak,
}


@dataclass(frozen=True)
class Leaders:
    value: int
    ids: tuple[str, ...]


def _add_game(totals: CareerTotals, won: bool, elo_after: int) -> None:
    totals.games += 1
    totals.wins += won
    totals.current_streak = totals.current_streak + 1 if won else 0
    totals.best_streak = max(totals.best_streak, totals.current_streak)
    totals.peak_elo = max(totals.peak_elo, elo_after)


def career_snapshots(ctx: StatsContext) -> list[tuple[GameStats, dict[str, CareerTotals]]]:
    """Totales de cada jugador después de cada partida (copias, en orden de aparición)."""
    elo = replay_elo(ctx)
    acc: dict[str, CareerTotals] = {}
    snapshots = []
    for gs in ctx.games:
        for r in gs.results:
            _add_game(acc.setdefault(r.player_id, CareerTotals()), r.position == 1, elo.after(gs.id, r.player_id))
        snapshots.append((gs, {pid: CareerTotals(**vars(t)) for pid, t in acc.items()}))
    return snapshots


def leaders_of(rec: RecordDef, totals: dict[str, CareerTotals]) -> Leaders:
    value_of = CAREER_VALUE[rec.code]
    value = max([0, *(value_of(t) for t in totals.values())])
    ids = tuple(pid for pid, t in totals.items() if value_of(t) == value) if value > 0 else ()
    return Leaders(value, ids)


def _history_entry(leaders: Leaders, last: HistoryEntry | None, gs: GameStats) -> HistoryEntry:
    tied = last is not None and leaders.value == last.value and set(last.holders) <= set(leaders.ids)
    added = [pid for pid in leaders.ids if pid not in last.holders] if tied else list(leaders.ids)
    kind = "set" if last is None else "tied" if tied else "broken"
    return HistoryEntry(leaders.value, added[0], leaders.ids, gs.id, gs.game.date, kind)


def career_history(rec: RecordDef, snapshots) -> tuple[HistoryEntry, ...]:
    history: list[HistoryEntry] = []
    for gs, totals in snapshots:
        leaders = leaders_of(rec, totals)
        last = history[-1] if history else None
        if leaders.ids and (last is None or last.holders != leaders.ids):
            history.append(_history_entry(leaders, last, gs))
    return tuple(history)


def career_record(rec: RecordDef, snapshots) -> RecordState:
    leaders = leaders_of(rec, snapshots[-1][1] if snapshots else {})
    holders = tuple(Holder(pid) for pid in leaders.ids)
    return RecordState(leaders.value, holders, career_history(rec, snapshots))
