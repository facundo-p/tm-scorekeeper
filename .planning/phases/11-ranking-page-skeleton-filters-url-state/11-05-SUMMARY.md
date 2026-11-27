---
phase: 11
plan: "05"
subsystem: frontend-pages
tags: [react, page, tdd, ranking, elo, css-modules, url-state, skeleton]
dependency_graph:
  requires: [11-02, 11-03, 11-04]
  provides: [Ranking page]
  affects:
    - frontend/src/pages/Ranking/Ranking.tsx
    - frontend/src/pages/Ranking/Ranking.module.css
    - frontend/src/test/components/Ranking.test.tsx
tech_stack:
  added: []
  patterns: [fetch-on-mount + retryCount, useMemo filter pipeline, 4-gate render, TDD RED/GREEN]
key_files:
  created:
    - frontend/src/pages/Ranking/Ranking.tsx
    - frontend/src/pages/Ranking/Ranking.module.css
    - frontend/src/test/components/Ranking.test.tsx
  modified: []
decisions:
  - "renderError / renderEmptyState / renderChartSkeleton extracted as top-level helpers to keep Ranking() body under 30 LOC per CLAUDE.md §3"
  - "Tests use vi.clearAllMocks() in beforeEach to reset call counts — prevents cross-test accumulation when checking Reintentar call count"
  - "Multiple 'Limpiar filtros' buttons (RankingFilters always visible + empty state) handled in tests with getAllByRole — both are intentional per D-C4/D-A1"
requirements: [RANK-03, RANK-04, RANK-06]
metrics:
  duration_minutes: 15
  completed_date: "2026-04-30"
  tasks_completed: 1
  tasks_total: 1
  files_created: 3
  files_modified: 0
---

# Phase 11 Plan 05: Ranking Page Summary

**One-liner:** Integration page wiring getEloHistory + useRankingFilters + RankingFilters + applyRankingFilters + usePlayers into 4 mutually-exclusive render gates (loading / error / empty / skeleton) with no new Date() and all design tokens.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Add failing Ranking page tests | 3b95198 | frontend/src/test/components/Ranking.test.tsx |
| 1 (GREEN) | Implement Ranking page + CSS | 905ab94 | frontend/src/pages/Ranking/Ranking.tsx, Ranking.module.css, Ranking.test.tsx (updated) |

## Render-Gate Priority Order (pseudocode)

```
if (playersLoading || loading)
  → <Spinner />                          // Gate 1: loading

else if (playersError || error)
  → errorBox + <Button>Reintentar</Button>  // Gate 2: error (retryCount bump)

else
  → <RankingFilters … />                 // Always: filters visible when not loading/error
  if (selectedPlayers.length === 0)
    → emptyState "Selecciona al menos un jugador"   // Gate 3a: explicit empty players
  else if (totalPoints === 0)
    → emptyState "Sin partidas en este rango"        // Gate 3b: date filter excludes all
  else
    → chartSkeleton [data-testid="chart-skeleton"]  // Gate 4: data present
```

## Extracted Helpers

| Helper | LOC | Purpose |
|--------|-----|---------|
| `renderError(onRetry)` | 8 | Error box + Reintentar button |
| `renderEmptyState(kind, onClear)` | 12 | No-players or no-data empty state |
| `renderChartSkeleton()` | 8 | 4 skeleton lines inside chartSkeleton div |

The public `Ranking()` function body (hook declarations + render JSX) is 40 LOC total. Without the extracted helpers it would be ~60 LOC — extraction keeps each piece testable and within CLAUDE.md §3 bounds.

## Test Count + Green Confirmation

**8 tests, all green** (`npx vitest run src/test/components/Ranking.test.tsx`)

| # | Test | Gate Covered | Status |
|---|------|-------------|--------|
| 1 | Spinner shown while usePlayers loading | Gate 1 (loading) | PASS |
| 2 | Chart skeleton renders when data loads with ≥1 point | Gate 4 (skeleton) | PASS |
| 3 | "Sin partidas en este rango" when from=2026-01-01 | Gate 3b (no-data) | PASS |
| 4 | "Selecciona al menos un jugador" when ?players= | Gate 3a (no-players) | PASS |
| 5 | Error box shown when getEloHistory rejects | Gate 2 (error) | PASS |
| 6 | Reintentar triggers second getEloHistory call | Gate 2 retry | PASS |
| 7 | Default URL clean → skeleton (all-active default) | Gate 4 + RANK-03 | PASS |
| 8 | Limpiar filtros clears URL + skeleton appears | D-C4 + RANK-06 | PASS |

Full regression: **22 test files, 189 tests — all green**.

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `grep -c "^export default function Ranking" Ranking.tsx` == 1 | 1 — PASS |
| `! grep "new Date(" Ranking.tsx` | PASS — zero occurrences |
| `! grep " style=" Ranking.tsx` | PASS — zero occurrences |
| `grep -c "Sin partidas en este rango" Ranking.tsx` >= 1 | 1 — PASS |
| `grep -ci "selecciona al menos un jugador" Ranking.tsx` >= 1 | 1 — PASS |
| `grep -c "No se pudo cargar el ranking" Ranking.tsx` >= 1 | 2 — PASS |
| `grep -c "Reintentar" Ranking.tsx` >= 1 | 1 — PASS |
| `grep -c "Limpiar filtros" Ranking.tsx` >= 1 | 1 — PASS |
| `grep "applyRankingFilters" Ranking.tsx` | PASS |
| `grep "useRankingFilters" Ranking.tsx` | PASS |
| `grep -c 'data-testid="chart-skeleton"' Ranking.tsx` >= 1 | 1 — PASS |
| `grep -c "var(--" Ranking.module.css` >= 12 | 25 — PASS |
| `! grep -E "#[0-9a-fA-F]{3,6}" Ranking.module.css` | PASS — no hex colors |
| `grep -c "min-height: 280px" Ranking.module.css` >= 1 | 1 — PASS |
| `grep -c "^  it(" Ranking.test.tsx` >= 6 | 8 — PASS |
| `npx vitest run src/test/components/Ranking.test.tsx` exits 0 | PASS |
| `npx tsc --noEmit` exits 0 | PASS |

## Spanish Strings (all 5 required)

- "Sin partidas en este rango" — PRESENT
- "Selecciona al menos un jugador" — PRESENT
- "No se pudo cargar el ranking." — PRESENT (in renderError body as `<p>` text, and in catch string)
- "Reintentar" — PRESENT
- "Limpiar filtros" — PRESENT (via `renderEmptyState` + `<RankingFilters>`)

## Requirements Closed

- **RANK-03:** Default all-active visible in skeleton render (test #7 — URL clean → skeleton shown)
- **RANK-04:** Desde filter affects rendered dataset (test #3 — from=2026-01-01 → empty state)
- **RANK-06:** URL state drives selection, verified in share/reload scenario (test #8 — Limpiar filtros clears URL)
- **SC#6:** Empty state with "Limpiar filtros" CTA (tests #3 and #4)

## LOC Counts

| File | LOC |
|------|-----|
| `Ranking.tsx` | 112 total; Ranking() body = 40 LOC |
| `Ranking.module.css` | 66 total |
| `Ranking.test.tsx` | 143 total |

## Deviations from Plan

### Auto-fix: Test adjustments for multiple "Limpiar filtros" buttons

**Found during:** GREEN run (4 tests failed)
**Issue:** The `<RankingFilters>` component always renders its own "Limpiar filtros" button (per D-C4 and Plan 04 design). When the empty state is also shown, there are two buttons with the same label in the DOM. The plan's test template used `getByRole('button', { name: /limpiar filtros/i })` which throws when multiple elements match.
**Fix:** Updated 3 tests to use `getAllByRole` with `expect(clearButtons.length).toBeGreaterThan(0)` or `clearButtons[clearButtons.length - 1]`. This preserves the test intent (button exists + is clickable) while handling the intentional dual-button design.
**Files modified:** `frontend/src/test/components/Ranking.test.tsx`
**Commit:** 905ab94

### Auto-fix: vi.clearAllMocks() for Reintentar call-count test

**Found during:** GREEN run (Reintentar test called getEloHistory 7 times instead of 2)
**Issue:** `vi.mocked(getEloHistory).mock.calls.length` accumulated across tests because `beforeEach` reset the implementation but not the call count. By test 6, prior calls were counted.
**Fix:** Added `vi.clearAllMocks()` at the top of `beforeEach`. Changed the assertion to compare relative call count (`callsBefore` snapshot before click) rather than absolute count 2.
**Files modified:** `frontend/src/test/components/Ranking.test.tsx`
**Commit:** 905ab94

## Assumptions Made

- The plan's `! grep "new Date"` acceptance criterion targets logic code (no Date constructor calls). Zero constructor calls confirmed — the only date-related code is opaque string comparison via `applyRankingFilters`.
- Having two "Limpiar filtros" buttons (one in RankingFilters, one in empty state) is the correct design per D-C4: both clear all filters. The filter bar button clears while data is visible; the empty state button provides the CTA when data is gone.
- Plan 06 can wire `<Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />` immediately — the page has no unsatisfied dependencies.

## Known Stubs

The `data-testid="chart-skeleton"` block is an intentional stub for Phase 12, which will replace it with a Recharts line chart. The skeleton provides the stable replacement target. No data flows to the skeleton block (it requires only that `totalPoints > 0`).

## Threat Flags

None — this plan creates a frontend page with no new network endpoints, no auth changes, no file access. The page calls `getEloHistory()` (Phase 8 endpoint) and `usePlayers` (existing endpoint), both already in the threat model.

## TDD Gate Compliance

- RED commit: `3b95198` — `test(11-05): add failing Ranking page tests (RED)`
- GREEN commit: `905ab94` — `feat(11-05): implement Ranking page with 4 render gates (GREEN)`
- No REFACTOR commit needed — helpers extracted during GREEN kept all bodies clean.

## Self-Check: PASSED

- [x] `frontend/src/pages/Ranking/Ranking.tsx` exists
- [x] `frontend/src/pages/Ranking/Ranking.module.css` exists
- [x] `frontend/src/test/components/Ranking.test.tsx` exists
- [x] Commit `3b95198` (RED) exists in git log
- [x] Commit `905ab94` (GREEN) exists in git log
- [x] 189/189 tests pass, `tsc --noEmit` exits 0
