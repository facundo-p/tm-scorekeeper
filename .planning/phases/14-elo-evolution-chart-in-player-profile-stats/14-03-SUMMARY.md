---
phase: 14-elo-evolution-chart-in-player-profile-stats
plan: "03"
status: checkpoint_pending
subsystem: frontend
tags: [elo, chart, player-profile, recharts, tdd]
depends_on:
  requires: [14-01, 14-02]
  provides: [EloSummaryCard-with-chart, PlayerProfile-history-wired]
  affects: [EloSummaryCard, PlayerProfile, EloLineChart]
tech_stack:
  added: []
  patterns: [isolated-fetch-with-cancelled-guard, optional-prop-backward-compat, CSS-Modules-design-tokens]
key_files:
  created: []
  modified:
    - frontend/src/components/EloSummaryCard/EloSummaryCard.tsx
    - frontend/src/components/EloSummaryCard/EloSummaryCard.module.css
    - frontend/src/test/components/EloSummaryCard.test.tsx
    - frontend/src/pages/PlayerProfile/PlayerProfile.tsx
    - frontend/src/test/components/PlayerProfile.test.tsx
decisions:
  - "Used history.some(p => p.points.length > 0) guard (not history.length > 0) to cover zero-point player arrays (D-10)"
  - "Added cancelled flag to history useEffect — same pattern as Ranking.tsx (prevents setState on unmounted component)"
  - "Updated PlayerProfile.test mock to include getEloHistory to prevent mock-resolution error (Rule 2 fix)"
metrics:
  duration_minutes: 20
  completed_date: "2026-05-02"
  tasks_completed: 2
  tasks_total: 3
  files_modified: 5
---

# Phase 14 Plan 03: Wire EloSummaryCard + PlayerProfile — Summary

**One-liner:** EloSummaryCard now embeds EloLineChart (showLegend=false) via optional history prop; PlayerProfile fetches per-player history on mount with isolated catch and reorders Stats tab to statsCard → gameList → EloSummaryCard.

## Status: CHECKPOINT PENDING

Tasks 1 and 2 are complete and committed. Task 3 is a `checkpoint:human-verify` — awaiting operator verification on the running dev server.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing tests for EloSummaryCard history prop | c11651c | EloSummaryCard.test.tsx |
| 1 (GREEN) | Extend EloSummaryCard with history prop + CSS | 19ff5d9 | EloSummaryCard.tsx, EloSummaryCard.module.css |
| 2 | Wire PlayerProfile history fetch + Stats tab reorder | 59b6f60 | PlayerProfile.tsx, PlayerProfile.test.tsx |

## What Was Built

### Task 1: EloSummaryCard extended (19ff5d9)

- Added `history?: PlayerEloHistoryDTO[]` optional prop to `EloSummaryCard`
- Imported `EloLineChart` from plan 14-02; renders `<EloLineChart data={history} showLegend={false} />` inside `.chartArea` div
- Guard: `history && history.some((p) => p.points.length > 0)` — hides chart for null, empty array, and zero-point player arrays (D-10)
- Added `.chartArea` CSS class: 220px height mobile, 280px desktop via `@media (min-width: 768px)`, padding via `var(--spacing-md)` (D-07)
- 4 new EloSummaryCard tests + 12 pre-existing = 17 total, all passing

### Task 2: PlayerProfile wired (59b6f60)

- Added `getEloHistory` import and `PlayerEloHistoryDTO` type import
- Added `eloHistory` state: `useState<PlayerEloHistoryDTO[] | null>(null)`
- Added secondary `useEffect` with cancelled-flag guard, calling `getEloHistory({ playerIds: [playerId] })` on mount (D-05); silent catch keeps `eloHistory` null on failure (D-09)
- Reordered Stats tab JSX: statsCard → gameList → EloSummaryCard (D-03)
- `EloSummaryCard` receives `history={eloHistory ?? undefined}` (null → undefined coercion for TypeScript prop type)
- Updated `PlayerProfile.test.tsx` mock to include `getEloHistory` (Rule 2 fix — see Deviations)

## Pending: Task 3 (Human Verify)

Task 3 is a `checkpoint:human-verify`. The operator must start the dev stack and validate:

1. Stats tab order: Estadísticas card → Historial de partidas → EloSummaryCard with embedded chart
2. Chart present with X axis, Y axis, single line, no legend (D-02, D-04)
3. Tooltip on click shows "Fecha: YYYY-MM-DD" and "ELO: N"
4. Responsive sizing: 220px at ≤767px, 280px at ≥768px
5. Zero-game player: no chart rendered (hero row shows "—")
6. Failure isolation: blocking `/elo/history` in DevTools → profile still renders, only chart missing
7. Ranking page regression: legend still appears on `/ranking` (showLegend defaults to true)
8. Console clean: no red errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing mock] Updated PlayerProfile.test.tsx to mock getEloHistory**

- **Found during:** Task 2 verification (`npx vitest run`)
- **Issue:** `PlayerProfile.test.tsx` had `vi.mock('@/api/elo', () => ({ getEloSummary: vi.fn() }))` — after adding `getEloHistory` import to `PlayerProfile.tsx`, vitest threw "No getEloHistory export is defined on the mock"
- **Fix:** Added `getEloHistory: vi.fn()` to the mock factory; imported `getEloHistory` in the test file; set `vi.mocked(getEloHistory).mockResolvedValue([])` in `beforeEach`
- **Files modified:** `frontend/src/test/components/PlayerProfile.test.tsx`
- **Commit:** 59b6f60

## Pre-existing Test Failures (Out of Scope)

`src/test/unit/enums.test.ts` — 2 tests fail on the base commit (25 expected milestones/awards vs 26 actual). These failures exist on commit 94dd5db before any changes in this plan. Out of scope — deferred.

## Known Stubs

None. All data flows are wired end-to-end: `getEloHistory` → `eloHistory` state → `EloSummaryCard history` prop → `EloLineChart data`.

## Threat Flags

None. All trust boundaries are handled:
- T-14-05: `player_name` flows through React JSX (auto-escaped), no `dangerouslySetInnerHTML`
- T-14-06: `playerId` from React Router params forwarded as query param; backend validates
- T-14-07/T-14-08: No caching, single-player payload, fresh fetch on every mount

## Self-Check: PASSED

- `frontend/src/components/EloSummaryCard/EloSummaryCard.tsx` — modified, verified
- `frontend/src/components/EloSummaryCard/EloSummaryCard.module.css` — modified, verified
- `frontend/src/test/components/EloSummaryCard.test.tsx` — modified, 17/17 tests pass
- `frontend/src/pages/PlayerProfile/PlayerProfile.tsx` — modified, verified
- `frontend/src/test/components/PlayerProfile.test.tsx` — modified, 1/1 test passes
- Commits verified: c11651c, 19ff5d9, 59b6f60
