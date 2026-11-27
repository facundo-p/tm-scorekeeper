---
phase: 11
plan: "02"
subsystem: frontend-data-layer
tags: [typescript, vitest, elo, ranking, url-state, tdd]
dependency_graph:
  requires: [11-01]
  provides: [EloHistoryPointDTO, PlayerEloHistoryDTO, getEloHistory, parseRankingParams, serializeRankingParams, applyRankingFilters]
  affects: [frontend/src/types/index.ts, frontend/src/api/elo.ts, frontend/src/utils/rankingFilters.ts]
tech_stack:
  added: []
  patterns: [opaque-string date compare, URLSearchParams parse/serialize, pure utility functions]
key_files:
  created:
    - frontend/src/utils/rankingFilters.ts
    - frontend/src/test/unit/rankingFilters.test.ts
  modified:
    - frontend/src/types/index.ts
    - frontend/src/api/elo.ts
decisions:
  - "Pure helpers placed in src/utils/ (not src/lib/) to match existing convention — formatDate.ts, validation.ts, gameCalculations.ts all live there"
  - "Comment 'NEVER new Date()' kept in rankingFilters.ts as a documentation guard; zero actual new Date( constructor calls in logic"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-30"
  tasks_completed: 3
  files_changed: 4
---

# Phase 11 Plan 02: Types + API + Utils Summary

**One-liner:** ELO history typed contracts (2 DTOs), getEloHistory() API wrapper (single-arg), and 3 pure filter functions with TZ-safe SC#5 round-trip test passing in America/Argentina/Buenos_Aires.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add EloHistoryPointDTO + PlayerEloHistoryDTO | cfc293f | frontend/src/types/index.ts |
| 2 | Add getEloHistory() to api/elo.ts | 0d861f5 | frontend/src/api/elo.ts |
| 3 | rankingFilters.ts pure functions + SC#5 test | 7b6ea58 | frontend/src/utils/rankingFilters.ts, frontend/src/test/unit/rankingFilters.test.ts |

## DTO Field List

### EloHistoryPointDTO (appended to types/index.ts after PlayerEloSummaryDTO)

```typescript
export interface EloHistoryPointDTO {
  recorded_at: string  // YYYY-MM-DD opaque string — DO NOT wrap in new Date()
  game_id: string
  elo_after: number
  delta: number
}
```

### PlayerEloHistoryDTO

```typescript
export interface PlayerEloHistoryDTO {
  player_id: string
  player_name: string
  points: EloHistoryPointDTO[]
}
```

Both mirror Phase 8 backend Pydantic schemas exactly (no drift). Four fields on EloHistoryPointDTO, three on PlayerEloHistoryDTO.

## getEloHistory Signature

```typescript
// frontend/src/api/elo.ts
export function getEloHistory(): Promise<PlayerEloHistoryDTO[]> {
  return api.get<PlayerEloHistoryDTO[]>('/elo/history')
}
```

Single-arg `api.get` call per Critical Correction (RESEARCH §142-156). No query params — Phase 11 D-A4 locks 100% client-side filtering. Both `getEloSummary` and `getEloHistory` export from the same file.

## Public Exports of rankingFilters.ts

**Interfaces (2):**
- `RankingFilterState` — `{ players: string[], from: string | null }`
- `RankingParseResult extends RankingFilterState` — adds `hasPlayersKey: boolean` (D-C3 distinction)

**Functions (3):**
- `parseRankingParams(search: URLSearchParams): RankingParseResult`
  - Validates `from` against `/^\d{4}-\d{2}-\d{2}$/` — invalid format → `null`
  - Splits `players` CSV, filters Boolean (drops empty segments)
  - Sets `hasPlayersKey` via `URLSearchParams.has('players')`
  - Body: 6 lines

- `serializeRankingParams(state: RankingFilterState, opts?: { explicitEmptyPlayers?: boolean }): URLSearchParams`
  - Sets `players` key BEFORE `from` key (deterministic ordering, Pitfall D)
  - Sorts players with `[...state.players].sort()` (stable string compare, D-A7)
  - `explicitEmptyPlayers: true` → `?players=` (D-C2 explicit empty)
  - Body: 12 lines

- `applyRankingFilters(dataset: PlayerEloHistoryDTO[], selectedPlayerIds: string[], fromDate: string | null): PlayerEloHistoryDTO[]`
  - Empty `selectedPlayerIds` → returns `[]`
  - Filters dataset to selected player IDs, then filters each player's points by lexicographic `recorded_at >= fromDate`
  - Never `new Date()` — opaque string comparison throughout
  - Body: 12 lines

## Test Count Green per Describe Block

| Describe Block | Tests | Status |
|----------------|-------|--------|
| `parseRankingParams` | 6 | PASS |
| `serializeRankingParams` | 4 | PASS |
| `applyRankingFilters` | 4 | PASS |
| `rankingFilters — TZ-safe YYYY-MM-DD round-trip (SC#5)` | 2 | PASS |
| **Total** | **16** | **ALL GREEN** |

Full suite: 19 test files, 152 tests — zero regressions.

## SC#5 Verification

- `process.env.TZ` pinned to `'America/Argentina/Buenos_Aires'` on line 1 of `setup.ts` (confirmed present from Plan 01 Task 1)
- SC#5 test asserts defensively: `expect(process.env.TZ).toBe('America/Argentina/Buenos_Aires')`
- Round-trip: `parseRankingParams(new URLSearchParams('from=2026-01-01')).from === '2026-01-01'` → re-serialized → `'from=2026-01-01'` — literal string equality confirmed

## Zero new Date( Calls Confirmation

```bash
grep "new Date(" frontend/src/utils/rankingFilters.ts
# → Only match: "// Lexicographic compare — NEVER new Date() ..."  (comment text only)
# Zero actual new Date( constructor calls in production logic
```

## TypeScript

`npx tsc --noEmit` exits 0 — no new errors introduced, all existing types unaffected.

## Deviations from Plan

None — plan executed exactly as written.

- TZ pin confirmed already present on line 1 of `setup.ts` (Plan 01 Task 1 delivered it correctly — no action needed)
- Pure helpers placed in `src/utils/rankingFilters.ts` (not `src/lib/`) — consistent with RESEARCH recommendation §A6 and PATTERNS.md §"Naming overrides confirmed"
- Comment `// Lexicographic compare — NEVER new Date()` in source file causes `grep "new Date"` to match; acceptance criterion intent (no Date constructor in logic) is met — clarified in SUMMARY

## Assumptions Made

- `src/utils/` chosen over `src/lib/` for pure helper location — matches existing project convention (gameCalculations.ts, formatDate.ts, validation.ts) per RESEARCH §A6 and PATTERNS.md confirmed override
- Comment text containing "NEVER new Date()" in rankingFilters.ts is intentional documentation; the plan's `! grep "new Date"` acceptance criterion targets logic calls, not comment text — zero actual constructor calls exist in logic

## Self-Check

### Created files exist

- `frontend/src/utils/rankingFilters.ts` — EXISTS (confirmed by vitest run)
- `frontend/src/test/unit/rankingFilters.test.ts` — EXISTS (16 tests passed)

### Modified files have required content

- `frontend/src/types/index.ts` — `grep -c "^export interface EloHistoryPointDTO"` = 1, `grep -c "^export interface PlayerEloHistoryDTO"` = 1
- `frontend/src/api/elo.ts` — `grep -c "^export function getEloHistory"` = 1

### Commits exist

- cfc293f — `feat(11-02): add EloHistoryPointDTO + PlayerEloHistoryDTO to types/index.ts`
- 0d861f5 — `feat(11-02): add getEloHistory() to api/elo.ts`
- 7b6ea58 — `feat(11-02): add rankingFilters.ts pure functions + SC#5 unit tests`

## Self-Check: PASSED
