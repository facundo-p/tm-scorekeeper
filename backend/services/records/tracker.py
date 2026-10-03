"""Récords de partida con la semántica D-05 (SEMANTICS §4.1): se recorren las partidas en
orden canónico; el récord cambia de dueño solo si se supera, igualarlo suma co-poseedores, la
primera partida lo establece y hay como mucho un quiebre por récord y partida.
"""
from dataclasses import dataclass, field, replace
from typing import Optional

from services.records.definitions import RECORD_DEFS, RecordDef
from services.records.metrics import GAME_METRICS
from services.stats.context import GameStats, StatsContext


@dataclass(frozen=True)
class Holder:
    player_id: str
    game_id: Optional[str] = None
    date: Optional[object] = None
    map: Optional[str] = None


@dataclass(frozen=True)
class HistoryEntry:
    value: float
    player_id: str
    holders: tuple[str, ...]
    game_id: str
    date: object
    kind: str  # set | broken | tied


@dataclass(frozen=True)
class RecordState:
    value: Optional[float] = None
    holders: tuple[Holder, ...] = ()
    history: tuple[HistoryEntry, ...] = ()


@dataclass(frozen=True)
class GameBest:
    value: float
    players: tuple[str, ...]


@dataclass
class GameRecordTrack:
    states: dict[str, RecordState] = field(default_factory=dict)
    broken: dict[str, set[str]] = field(default_factory=dict)  # game_id → códigos rotos


def game_best(rec: RecordDef, gs: GameStats) -> Optional[GameBest]:
    """Mejor valor de la partida y quiénes lo alcanzaron; en «más es mejor» el 0 no cuenta (D-30)."""
    candidates = [(pid, v) for pid, v in GAME_METRICS[rec.code](gs) if rec.lower_is_better or v > 0]
    if not candidates:
        return None
    value = (min if rec.lower_is_better else max)(v for _, v in candidates)
    players = tuple(dict.fromkeys(pid for pid, v in candidates if v == value))
    return GameBest(value, players)


def _holders(players, gs: GameStats) -> tuple[Holder, ...]:
    return tuple(Holder(pid, gs.id, gs.game.date, gs.game.map_name.value) for pid in players)


def _entry(best: GameBest, gs: GameStats, kind: str, players=None) -> HistoryEntry:
    players = players or best.players
    return HistoryEntry(best.value, players[0], tuple(players), gs.id, gs.game.date, kind)


def _beats(rec: RecordDef, a: float, b: float) -> bool:
    return a < b if rec.lower_is_better else a > b


def step_record(rec: RecordDef, cur: RecordState, best: GameBest, gs: GameStats) -> tuple[RecordState, bool]:
    """Nuevo estado del récord tras una partida y si lo rompió."""
    if cur.value is None:
        return RecordState(best.value, _holders(best.players, gs), (_entry(best, gs, "set"),)), False
    if _beats(rec, best.value, cur.value):
        return RecordState(best.value, _holders(best.players, gs), cur.history + (_entry(best, gs, "broken"),)), True
    current = {h.player_id for h in cur.holders}
    added = [pid for pid in best.players if pid not in current] if best.value == cur.value else []
    if not added:
        return cur, False
    tied = _entry(best, gs, "tied", added)
    return replace(cur, holders=cur.holders + _holders(added, gs), history=cur.history + (tied,)), False


def track_game_records(ctx: StatsContext) -> GameRecordTrack:
    track = GameRecordTrack({r.code: RecordState() for r in RECORD_DEFS if r.scope == "game"})
    for gs in ctx.games:
        for rec in RECORD_DEFS:
            best = game_best(rec, gs) if rec.scope == "game" else None
            if best is None:
                continue
            track.states[rec.code], broke = step_record(rec, track.states[rec.code], best, gs)
            if broke:
                track.broken.setdefault(gs.id, set()).add(rec.code)
    return track
