"""Récords v2 sobre un subconjunto de partidas (F22, STAT-03): estado actual, historial y
contexto de cada partida («roto», «igualado», «cerca»).
"""
from dataclasses import dataclass
from typing import Optional

from models.game_subset import ALL_GAMES, GameSubset
from services.records.career import career_record, career_snapshots
from services.records.definitions import RECORD_BY_CODE, RECORD_DEFS, RecordDef
from services.records.tracker import GameBest, HistoryEntry, RecordState, game_best, track_game_records
from services.stats.context import GameStats, StatsContext

NEAR_GAP = 3
NEAR_LIMIT = 3


@dataclass(frozen=True)
class RecordView:
    definition: RecordDef
    state: RecordState


@dataclass(frozen=True)
class GameRecordContext:
    definition: RecordDef
    best: GameBest
    broken: bool
    tied: Optional[HistoryEntry]
    before: Optional[HistoryEntry]
    gap: Optional[float]


class UnknownRecord(KeyError):
    pass


def build_records(ctx: StatsContext) -> list[RecordView]:
    track = track_game_records(ctx)
    snapshots = career_snapshots(ctx)
    return [
        RecordView(d, career_record(d, snapshots) if d.scope == "career" else track.states[d.code])
        for d in RECORD_DEFS
    ]


def _context_for(view: RecordView, gs: GameStats, broken: set[str], position: dict[str, int]):
    best = game_best(view.definition, gs)
    if best is None:
        return None
    history = view.state.history
    tied = next((h for h in history if h.game_id == gs.id and h.kind == "tied"), None)
    before = next((h for h in reversed(history) if position[h.game_id] < position[gs.id]), None)
    gap = abs(before.value - best.value) if before else None
    return GameRecordContext(view.definition, best, view.definition.code in broken, tied, before, gap)


def game_record_context(ctx: StatsContext, game_id: str) -> list[GameRecordContext]:
    """Qué hizo la partida con cada récord de partida y el récord vigente antes de ella."""
    gs = ctx.get(game_id)
    if gs is None:
        return []
    track = track_game_records(ctx)
    broken = track.broken.get(game_id, set())
    position = {g.id: i for i, g in enumerate(ctx.games)}
    views = [RecordView(RECORD_BY_CODE[code], state) for code, state in track.states.items()]
    return [c for c in (_context_for(v, gs, broken, position) for v in views) if c is not None]


def near_records(context: list[GameRecordContext]) -> list[GameRecordContext]:
    """«Cerca del récord»: no lo rompió y quedó a ≤ 3 (igualar cuenta, distancia 0)."""
    near = [c for c in context if not c.broken and c.before is not None and c.gap <= NEAR_GAP]
    return sorted(near, key=lambda c: c.gap)[:NEAR_LIMIT]


class RecordsService:
    def __init__(self, games_repository):
        self.games_repository = games_repository

    def records(self, subset: GameSubset = ALL_GAMES) -> list[RecordView]:
        return build_records(StatsContext.load(self.games_repository, subset))

    def history(self, code: str, subset: GameSubset = ALL_GAMES) -> RecordView:
        if code not in RECORD_BY_CODE:
            raise UnknownRecord(code)
        return next(v for v in self.records(subset) if v.definition.code == code)

    def game_context(self, game_id: str) -> list[GameRecordContext]:
        return game_record_context(StatsContext.load(self.games_repository), game_id)
