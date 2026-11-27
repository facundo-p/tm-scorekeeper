---
phase: 14-elo-evolution-chart-in-player-profile-stats
plan: "01"
subsystem: api
tags: [typescript, vitest, elo, query-params, url-serialization]

# Dependency graph
requires:
  - phase: 08-backend-get-elo-history-endpoint
    provides: GET /elo/history?player_ids=id1,id2 backend endpoint
  - phase: 12-ranking-line-chart-leaderboard
    provides: getEloHistory() existing API function and Ranking.tsx caller
provides:
  - getEloHistory(params?: { playerIds?: string[] }) backward-compatible API function
  - Unit tests for URL serialization of playerIds filter
affects:
  - 14-02 (EloLineChart showLegend prop)
  - 14-03 (PlayerProfile EloSummaryCard with chart — calls getEloHistory({ playerIds: [playerId] }))

# Tech tracking
tech-stack:
  added: []
  patterns:
    - URLSearchParams for query string building (percent-encodes special chars, no manual string concat)
    - Optional params object pattern for backward-compatible API function extension

key-files:
  created:
    - frontend/src/test/unit/eloApi.test.ts
  modified:
    - frontend/src/api/elo.ts

key-decisions:
  - "URLSearchParams.set() with comma-joined value (single player_ids param) — matches backend comma-separated string expectation from elo_routes.py"
  - "Empty array and undefined params both yield clean /elo/history path — backward compat for Ranking.tsx"

patterns-established:
  - "Query string building pattern: URLSearchParams.set(key, array.join(',')) for comma-separated backend params"

requirements-completed:
  - PROF-FUT-EVOL-CHART

# Metrics
duration: 2min
completed: 2026-05-02
---

# Phase 14 Plan 01: Extend getEloHistory with optional server-side playerIds filter

**`getEloHistory()` extended with optional `params.playerIds` that serializes to `?player_ids=id1,id2` via URLSearchParams, enabling single-player ELO history fetches without breaking Ranking.tsx's parameterless call**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-02T21:09:46Z
- **Completed:** 2026-05-02T21:11:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Extended `getEloHistory()` with `params?: { playerIds?: string[] }` optional parameter, using URLSearchParams to build the query string
- Empty array and undefined params both yield clean `/elo/history` path — backward compatible with existing `Ranking.tsx` call
- 5 unit tests covering all URL serialization cases: no params, empty object, empty array, single id, multiple ids (comma-joined)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend getEloHistory with optional playerIds filter** - `3281c54` (feat)
2. **Task 2: Add unit tests for getEloHistory URL serialization** - `a9913e4` (test)

**Plan metadata:** (committed with SUMMARY.md)

_Note: TDD tasks — test written in RED phase first (2 failures, 3 passes on old function), then implementation (GREEN: all 5 pass)_

## Files Created/Modified

- `frontend/src/api/elo.ts` - Extended `getEloHistory()` with optional playerIds param, updated JSDoc
- `frontend/src/test/unit/eloApi.test.ts` - 5 unit tests verifying URL serialization behavior

## Decisions Made

- URLSearchParams.set('player_ids', ids.join(',')) produces a single comma-joined param — matches backend expectation in `elo_routes.py` line 17 (comma-separated string, not repeated params)
- URLSearchParams may percent-encode the comma to `%2C`; both forms are accepted by backend and the test regex allows both (`(%2C|,)`)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failures in `src/test/unit/enums.test.ts` (Award enum count mismatch — 26 vs expected 25) were confirmed to be pre-existing on the base commit and are out of scope for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `getEloHistory({ playerIds: ['id'] })` is ready for Plan 14-03 (PlayerProfile) to call
- Plan 14-02 (EloLineChart `showLegend` prop) can proceed in parallel — no dependency on this plan

---
*Phase: 14-elo-evolution-chart-in-player-profile-stats*
*Completed: 2026-05-02*
