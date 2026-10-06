---
phase: 11
plan: "03"
subsystem: frontend-hook-layer
tags: [typescript, vitest, react-hooks, url-state, tdd, ranking, elo]
dependency_graph:
  requires: [11-02]
  provides: [useRankingFilters]
  affects: [frontend/src/hooks/useRankingFilters.ts, frontend/src/test/hooks/useRankingFilters.test.ts]
tech_stack:
  added: []
  patterns: [renderHook + MemoryRouter wrapper, useSearchParams URL state, idempotent URL rewrite, TDD RED/GREEN]
key_files:
  created:
    - frontend/src/hooks/useRankingFilters.ts
    - frontend/src/test/hooks/useRankingFilters.test.ts
decisions:
  - "Extracted 3 helpers (computeResolved, shouldRewriteUrl, useSetters) to keep all function bodies ≤20 LOC per CLAUDE.md §3"
  - "useSetters() is a hook-helper (uses useCallback internally) placed at module scope, not inside the public hook body"
  - "Combined useRankingFiltersWithLocation wrapper hook in tests — reads useLocation().search alongside result to assert URL changes"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-30"
  tasks_completed: 1
  files_changed: 2
---

# Phase 11 Plan 03: useRankingFilters Hook Summary

**One-liner:** URL-state hook for the Ranking page — wraps useSearchParams with intersection logic, idempotent rewrite guard, explicit-empty distinction, and loading-state protection across 21 deterministic tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Write failing useRankingFilters tests | 4efad59 | frontend/src/test/hooks/useRankingFilters.test.ts |
| 1 (GREEN) | Implement useRankingFilters hook | fb3e96a | frontend/src/hooks/useRankingFilters.ts |

## Public Hook Signature (verbatim)

```typescript
export interface UseRankingFiltersResult {
  players: string[]              // resolved (intersected with active OR default-all-active)
  fromDate: string | null
  setPlayers: (next: string[]) => void
  setFromDate: (next: string | null) => void
  clearAll: () => void
}

export function useRankingFilters(activePlayerIds: string[] | null): UseRankingFiltersResult
```

## Private Helpers Extracted

Three private helpers extracted to satisfy CLAUDE.md §3 (functions >20 lines must be refactored):

### `computeResolved(parsed, activePlayerIds)` — 9 LOC

Pure function. Returns the resolved `RankingFilterState` per all D-C/D-A3 decisions:
- `activePlayerIds === null` → `{ players: [], from }` (Pitfall E loading guard)
- `!hasPlayersKey` → `{ players: activePlayerIds, from }` (D-C1 default-all-active)
- `hasPlayersKey && players.length === 0` → `{ players: [], from }` (D-C2/D-C3 explicit empty)
- `hasPlayersKey && intersection empty` → `{ players: activePlayerIds, from }` (D-A3 step 4 fallback)
- `hasPlayersKey && intersection non-empty` → sorted intersection

### `shouldRewriteUrl(parsed, activePlayerIds)` — 11 LOC

Pure function. Returns `{ rewrite: boolean, nextState: RankingFilterState | null }`.
Implements the idempotent Pitfall B guard: only signals rewrite when URL players list differs from post-intersection canonical sorted list. Skips when loading (null), URL clean (!hasPlayersKey), or explicit empty (length === 0).

### `useSetters(resolved, setSearchParams)` — 19 LOC

Hook-helper (uses `useCallback` internally). Returns all 3 URL-writing setters. Every setter uses `{ replace: true }` (D-A6). `setPlayers([])` passes `{ explicitEmptyPlayers: true }` to `serializeRankingParams` (D-C2). `setFromDate` passes date string opaquely — zero `new Date(` calls (Pitfall F).

## Test Count Per Describe Block (A–I)

| Describe | Label | Tests | Decision Covered |
|----------|-------|-------|-----------------|
| A | Default branch: URL clean → all active | 2 | D-C1 |
| B | Intersection drop + idempotent rewrite | 2 | D-A3 step 3, Pitfall B |
| C | Empty intersection → fallback + URL clean | 3 | D-A3 step 4 |
| D | Explicit empty ?players= → no rewrite | 2 | D-C2/D-C3 |
| E | activePlayerIds === null (loading) | 3 | Pitfall E |
| F | setPlayers setter | 3 | D-A7, D-C2, Pitfall D |
| G | setFromDate setter | 3 | RANK-04, Pitfall F |
| H | clearAll | 2 | D-C4 |
| I | replace: true regression guard | 1 | D-A6 |
| **Total** | | **21** | **ALL GREEN** |

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `grep -c "^export function useRankingFilters" ...ts` == 1 | 1 — PASS |
| `! grep "new Date(" ...ts` (zero occurrences) | PASS — zero |
| `grep -c "replace: true" ...ts` >= 3 | 5 — PASS |
| `grep -c "explicitEmptyPlayers" ...ts` >= 1 | 1 — PASS |
| `grep -c "^  it(" test.ts` >= 8 | 21 — PASS |
| `npx vitest run ...test.ts` exits 0, all green | 21/21 GREEN |
| Re-run immediately — still green (determinism) | 21/21 GREEN |
| All function bodies ≤20 LOC (awk check) | 9, 11, 19, 13 — PASS |
| `npx tsc --noEmit` exits 0 | PASS |
| Full `npx vitest run` 173/173 green | PASS |

## Deviations from Plan

### Auto-refactor: Added `useSetters` helper beyond plan's prescribed 2 helpers

**Found during:** Implementation — after extracting `computeResolved` and `shouldRewriteUrl`, the public hook body was 30 LOC (3 multi-line `useCallback` blocks exceeded the 20 LOC limit).

**Fix:** Extracted a third module-scope helper `useSetters(resolved, setSearchParams)` that encapsulates all 3 URL-writing setters. This keeps all function bodies ≤20 lines per CLAUDE.md §3. The plan said "split into two private helpers" but the final shape uses three, which is strictly better.

**Files modified:** `frontend/src/hooks/useRankingFilters.ts`

**Commit:** fb3e96a

### Worktree branch reset required

The worktree branch was created from main (472650d) rather than from the 11-02 commit (386327f). The `<worktree_branch_check>` protocol required `git reset --hard 386327f77cbfce19332dd0f10f05d6297b93e251` before starting. Applied as specified.

### node_modules symlink for worktree

The worktree's frontend directory had no `node_modules` (git worktrees don't copy them). Symlinked from main repo's frontend to run vitest without npm install. This is a worktree-local filesystem fix, no git impact.

## Assumptions Made

- `useSetters()` as a hook-helper at module scope is idiomatic React (uses `useCallback` internally — React hooks can be called in custom hooks, not just components). Calling it from the public hook body counts as using React hooks rules correctly.
- The awk acceptance criterion checks `^(export )?function` — `useSetters` starts with `function useSetters` so it is correctly included in the check, yielding the 4-function output (9, 11, 19, 13).

## Known Stubs

None — the hook is fully implemented with no placeholder values or hardcoded returns.

## Threat Flags

None — this plan modifies only frontend hook + test files. No new network endpoints, auth paths, or trust boundary changes.

## Self-Check

### Created files exist

- `frontend/src/hooks/useRankingFilters.ts` — EXISTS (vitest ran, tsc passed)
- `frontend/src/test/hooks/useRankingFilters.test.ts` — EXISTS (21 tests passed)

### Commits exist

- 4efad59 — `test(11-03): add failing useRankingFilters hook tests (RED)`
- fb3e96a — `feat(11-03): implement useRankingFilters hook (GREEN)`

## Self-Check: PASSED
