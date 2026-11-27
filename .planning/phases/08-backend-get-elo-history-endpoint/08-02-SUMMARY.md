---
phase: 08-backend-get-elo-history-endpoint
plan: 02
subsystem: api
tags: [repository, mapper, sqlalchemy, dto, elo, backend]

# Dependency graph
requires:
  - phase: 08-backend-get-elo-history-endpoint
    plan: 01
    provides: "EloHistoryPointDTO + PlayerEloHistoryDTO Pydantic schemas, EloHistoryFilter dataclass"
  - phase: 01-backend-core
    provides: "PlayerEloHistory ORM model with indexes on recorded_at and player_id"
provides:
  - "EloRepository.get_history(filter: EloHistoryFilter) -> list[PlayerEloHistoryORM]"
  - "elo_history_changes_to_player_dto(player_id, player_name, history_rows) -> PlayerEloHistoryDTO"
affects: [08-03, 08-04, 09-frontend-elo-types, 11-ranking-page, 12-elo-chart]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Filter dataclass consumption: repository branches on Optional[...] fields with `if filter.X is not None`, mirrors GamesRepository.list_games"
    - "Sort tuple (player_id, recorded_at, game_id) reused across get_history, get_baseline_elo_before, _walk_and_persist for byte-consistent reads/recomputes"
    - "Mapper purity: no I/O, no sorting, no filtering — service guarantees row order via repo's order_by"

key-files:
  created: []
  modified:
    - "backend/repositories/elo_repository.py"
    - "backend/mappers/elo_mapper.py"

key-decisions:
  - "Repository returns raw ORM rows (list[PlayerEloHistoryORM]) — service does the per-player grouping; mapper consumes the same ORM rows. Avoids an intermediate domain object that would duplicate the schema fields."
  - "Mapper signature takes player_id and player_name as separate args (NOT a players_by_id dict like elo_changes_to_dtos) because rows arrive pre-grouped per player — the service resolves the name once per group."
  - "Order tuple (player_id, recorded_at, game_id) locked verbatim from get_baseline_elo_before; preserves byte-consistency across reads and recomputes (CONTEXT D-04)."

patterns-established:
  - "Indexed read on PlayerEloHistory with optional date_from + player_ids filter — single SQL query, no schema change (recorded_at and player_id both index=True)."

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-04-29
---

# Phase 08 Plan 02: EloRepository.get_history + history mapper Summary

**Wired the data layer for `GET /elo/history`: one indexed `EloRepository.get_history(filter)` method and one pure `elo_history_changes_to_player_dto` mapper. No schema changes, no regressions — the full backend suite (176 tests) stays green.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-29T02:24:47Z
- **Completed:** 2026-04-29T02:28:03Z
- **Tasks:** 2
- **Files modified:** 2 (both extended in place)

## Accomplishments

- `EloRepository.get_history(filter: EloHistoryFilter) -> list[PlayerEloHistoryORM]` added to `backend/repositories/elo_repository.py`. Issues exactly one indexed query against `PlayerEloHistoryORM`, branches on `filter.date_from` (`>=`) and `filter.player_ids` (`.in_`) when set, returns rows ordered by `(player_id, recorded_at, game_id)`.
- `elo_history_changes_to_player_dto(player_id, player_name, history_rows) -> PlayerEloHistoryDTO` added to `backend/mappers/elo_mapper.py`. Pure transformation: no DB session, no sorting, no filtering. Empty `history_rows` produces a DTO with `points=[]`.
- Both pre-existing function sets are byte-identical to their pre-plan state: `EloRepository` still owns the original 6 methods (`save_elo_changes`, `get_changes_for_game`, `delete_changes_for_game`, `has_any_history`, `delete_changes_from_date`, `get_baseline_elo_before`); `elo_mapper.py` still owns `elo_change_to_dto` and `elo_changes_to_dtos`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add `EloRepository.get_history(filter)`** — `f4f1554` (feat)
2. **Task 2: Add `elo_history_changes_to_player_dto`** — `a7ff638` (feat)

**Plan metadata commit:** pending (final commit will include this SUMMARY + STATE.md + ROADMAP.md).

## Files Created/Modified

- `backend/repositories/elo_repository.py` — extended (added one import line + one method, ~20 lines net).
- `backend/mappers/elo_mapper.py` — extended (added one ORM import + two schema imports + one function, ~29 lines net).

### Final signature: `EloRepository.get_history`

```python
def get_history(self, filter: EloHistoryFilter) -> list[PlayerEloHistoryORM]:
    """
    Devuelve filas de PlayerEloHistory ordenadas por (player_id, recorded_at, game_id),
    opcionalmente filtradas por fecha desde y/o conjunto de player_ids.
    UNA sola query indexada (recorded_at y player_id son index=True).
    """
    with self._session_factory() as session:
        query = session.query(PlayerEloHistoryORM)
        if filter.date_from is not None:
            query = query.filter(PlayerEloHistoryORM.recorded_at >= filter.date_from)
        if filter.player_ids is not None:
            query = query.filter(PlayerEloHistoryORM.player_id.in_(filter.player_ids))
        rows = query.order_by(
            PlayerEloHistoryORM.player_id,
            PlayerEloHistoryORM.recorded_at,
            PlayerEloHistoryORM.game_id,
        ).all()
        return list(rows)
```

### Final signature: `elo_history_changes_to_player_dto`

```python
def elo_history_changes_to_player_dto(
    player_id: str,
    player_name: str,
    history_rows: list[PlayerEloHistoryORM],
) -> PlayerEloHistoryDTO:
    """
    Convierte filas ya agrupadas y ya ordenadas (por recorded_at, game_id) en
    PlayerEloHistoryDTO. El mapper NO ordena, NO consulta la BD, NO filtra:
    es una transformación pura. El service garantiza el orden vía el order_by
    del repository (player_id, recorded_at, game_id).
    """
    points = [
        EloHistoryPointDTO(
            recorded_at=r.recorded_at,
            game_id=r.game_id,
            elo_after=r.elo_after,
            delta=r.delta,
        )
        for r in history_rows
    ]
    return PlayerEloHistoryDTO(
        player_id=player_id,
        player_name=player_name,
        points=points,
    )
```

### Sort tuple confirmation

`get_history` orders by `(PlayerEloHistoryORM.player_id, PlayerEloHistoryORM.recorded_at, PlayerEloHistoryORM.game_id)` — identical to `EloRepository.get_baseline_elo_before` (lines 78–80) and consistent with `EloService._walk_and_persist`'s `(date, id)` sort. Reads and recomputes therefore produce byte-identical row orderings for the same data.

### No existing function was modified

- Repository regression check: `grep -nE "def (save_elo_changes|get_changes_for_game|delete_changes_for_game|has_any_history|delete_changes_from_date|get_baseline_elo_before)" backend/repositories/elo_repository.py | wc -l` → `6` (all six pre-plan methods present).
- Mapper regression check: `grep -nE "def (elo_change_to_dto|elo_changes_to_dtos)" backend/mappers/elo_mapper.py | wc -l` → `2` (both pre-plan functions present).
- Mapper purity check: `grep -nE "(\.sort\(|sorted\(|session\.|repository\.)" backend/mappers/elo_mapper.py` → no matches.

### Empty-rows behavior (Plan 03 dependency)

`elo_history_changes_to_player_dto('p2', 'Bob', [])` returns `PlayerEloHistoryDTO(player_id='p2', player_name='Bob', points=[])`. Verified inline. Plan 03's service can therefore call the mapper safely even when a player has zero rows in the requested window — though per CONTEXT D-02 the service is expected to drop empty-points players from the response, so this is a defensive-purity guarantee, not the primary code path.

### Test suite output

`make test-backend` (full Docker suite, two runs — one after each task):

```
........................................................................ [ 40%]
........................................................................ [ 81%]
................................                                         [100%]
176 passed in 1.54s
```

176 passed, 0 failed, 0 errors — confirms the indexed query (`.in_`, `>=`, `order_by`) parses cleanly against SQLAlchemy + Postgres and that no existing test (notably `test_elo_cascade.py`, which exercises `get_baseline_elo_before` and `_walk_and_persist`) regresses.

## Decisions Made

None beyond what was already locked in CONTEXT D-04 + the Mappers section. Implementation followed the plan verbatim.

## Deviations from Plan

None — plan executed exactly as written. No Rule 1/2/3/4 deviations triggered.

## Issues Encountered

None. Both tasks were file-disjoint extensions with explicit pre-existing analogs (`get_baseline_elo_before` for the query, `elo_changes_to_dtos` for the mapper); no auth gates, no ambiguity, no architectural questions.

## User Setup Required

None — pure code change, no env vars, no service config.

## Threat Flags

None. The new repository method only reads from `PlayerEloHistory` (already-trusted internal table) and the mapper has no I/O. No new network, auth, file-access, or schema surface.

## Requirements Status

`ELO-API-01` is **left as "In Progress"** per the phase critical rules — although the plan frontmatter lists `requirements: [ELO-API-01]`, the requirement is fully satisfied only when Plan 08-04 ships the `GET /elo/history` route. STATE/ROADMAP updates below do NOT call `requirements mark-complete`.

## Next Phase Readiness

- **Plan 03 unblocked.** The service layer can now do `from repositories.elo_repository import EloRepository` and `from mappers.elo_mapper import elo_history_changes_to_player_dto`. The contract is:
  - `repo.get_history(EloHistoryFilter(date_from=..., player_ids=...))` → flat `list[PlayerEloHistoryORM]` ordered by `(player_id, recorded_at, game_id)`.
  - Service groups by `r.player_id` (rows are already adjacent thanks to the order tuple) and calls the mapper once per group.
- **Contract is frozen.** Any change to the repo signature or mapper output forces revisiting Plans 03–04 and downstream Phases 09/11/12.
- **No new dependencies.** Imports are stdlib + existing project modules only.

## Self-Check: PASSED

- `backend/repositories/elo_repository.py` — FOUND (modified, contains `def get_history`)
- `backend/mappers/elo_mapper.py` — FOUND (modified, contains `def elo_history_changes_to_player_dto`)
- Commit `f4f1554` (Task 1) — FOUND in `git log`
- Commit `a7ff638` (Task 2) — FOUND in `git log`
- All 6 success criteria from PLAN.md verified (signatures, filter branching, mapper purity, existing-function preservation, no schema migration, `make test-backend` green)

---
*Phase: 08-backend-get-elo-history-endpoint*
*Completed: 2026-04-29*
