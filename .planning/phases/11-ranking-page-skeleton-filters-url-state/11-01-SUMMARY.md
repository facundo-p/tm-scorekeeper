---
phase: 11
plan: "01"
subsystem: frontend-test-setup
tags: [vitest, timezone, preflight, setup]
dependency_graph:
  requires: []
  provides: [tz-pinned-vitest-setup]
  affects: [frontend/src/test/setup.ts]
tech_stack:
  added: []
  patterns: [vitest-setupFiles, process.env.TZ-pin]
key_files:
  created: []
  modified:
    - frontend/src/test/setup.ts
decisions:
  - "TZ pin must precede jest-dom import — V8 reads process.env.TZ once at module load time"
  - "No setup script added to package.json — TZ set via setupFiles is sufficient (RESEARCH Pitfall A)"
metrics:
  duration: ~5min
  completed_date: "2026-05-01"
  tasks_completed: 1
  tasks_total: 2
  files_modified: 1
---

# Phase 11 Plan 01: Wave 0 Preflight SUMMARY

**One-liner:** TZ pin `process.env.TZ = 'America/Argentina/Buenos_Aires'` added as line 1 of `frontend/src/test/setup.ts` to stabilize SC#5 date round-trip tests across local and CI environments.

## Tasks

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Pin process.env.TZ in test/setup.ts | COMPLETE | ec8bef9 |
| 2 | Verify Phase 8 GET /elo/history endpoint is live | CHECKPOINT — awaiting user | — |

## Task 1 Detail: TZ Pin

**File modified:** `frontend/src/test/setup.ts`

**Line added (line 1):**
```typescript
process.env.TZ = 'America/Argentina/Buenos_Aires'
```

**Exact file shape after edit (18 lines, was 17):**
```
Line 1: process.env.TZ = 'America/Argentina/Buenos_Aires'
Line 2: import '@testing-library/jest-dom'
Line 3: (blank)
Line 4: // Mock localStorage for jsdom environment
Lines 5–17: localStorage polyfill (unchanged)
Line 18: Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })
```

**Test results:** 136/136 tests passed across 18 test files — no regressions.

## Task 2 Detail: Phase 8 Endpoint Verification

Status: CHECKPOINT — blocked on user verification.

Expected contract:
```typescript
PlayerEloHistoryDTO {
  player_id: string
  player_name: string
  points: EloHistoryPointDTO[]
}
EloHistoryPointDTO {
  recorded_at: string  // YYYY-MM-DD
  game_id: string
  elo_after: number
  delta: number
}
```

The user must confirm `GET /elo/history` is live and the response matches this contract before Wave 1 (plans 02–05) can execute.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — this plan only modifies a test setup file; no new network endpoints, auth paths, or schema changes introduced.

## Self-Check

- [x] `frontend/src/test/setup.ts` line 1 = `process.env.TZ = 'America/Argentina/Buenos_Aires'`
- [x] `frontend/src/test/setup.ts` line 2 = `import '@testing-library/jest-dom'`
- [x] localStorage polyfill unchanged (lines 4–18)
- [x] File is 18 lines (was 17 — one line inserted at top)
- [x] Commit ec8bef9 exists
- [x] 136/136 tests green

## Self-Check: PASSED
