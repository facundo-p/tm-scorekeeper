---
phase: 09-playerprofile-elo-surface-frontend-foundation
plan: 02
subsystem: frontend-foundation
tags: [typescript, types, dto, api-wrapper, elo, drift-fix]

# Dependency graph
requires:
  - phase: pre-milestone (PR #42)
    provides: backend EloChangeDTO + players.elo column + EloService cascade
provides:
  - frontend type contracts for ELO surface (PlayerEloSummaryDTO, EloRankDTO, EloChangeDTO)
  - drift-fixed PlayerResponseDTO and PlayerProfileDTO (now mirror backend elo: int field)
  - typed api wrapper getEloSummary(playerId) consuming PlayerEloSummaryDTO
affects: [09-03, 10, 11, 12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - DTO mirror back-to-front (frontend types track backend Pydantic schemas exactly)
    - Thin api wrapper (no retry/cache) returning api.get<T>() Promise directly
    - JSDoc allowed only when explaining load-bearing architectural constraint (D-19)

key-files:
  created:
    - frontend/src/api/elo.ts
  modified:
    - frontend/src/types/index.ts
    - frontend/src/test/components/GameRecords.test.tsx

key-decisions:
  - "Strict scope per D-13: no Phase 10/11 types speculated (no EloHistoryPointDTO, no PlayerEloHistoryDTO, no getEloChanges, no getEloHistory)"
  - "elo: number placed as last field of PlayerResponseDTO (matches backend ordering at backend/schemas/player.py:43)"
  - "elo: number placed as second field of PlayerProfileDTO (matches backend ordering at backend/schemas/player_profile.py:22)"
  - "JSDoc on getEloSummary intentional deviation from no-JSDoc convention — D-19 (no cache/retry) is load-bearing and future readers must understand the rationale"
  - "GameRecords.test.tsx fixture seed value elo: 1000 (matches D-05 backend default)"

patterns-established:
  - "ELO DTO section in frontend/src/types/index.ts uses // ---- ELO DTOs ---- comment matching existing section style (lines 3, 44, 69, 78, 101, 117, 149)"
  - "Frontend api wrappers for ELO live in src/api/elo.ts; phases 10-11 will append additional wrappers (getEloChanges, getEloHistory) into the same file"

requirements-completed: [PROF-01, PROF-02, PROF-03, PROF-04]

# Metrics
duration: ~5min
completed: 2026-04-29
---

# Phase 9 Plan 02: Frontend Foundation — Types + API Wrapper Summary

**Typed contracts (PlayerEloSummaryDTO, EloRankDTO, EloChangeDTO) and getEloSummary api wrapper landed; drift between backend and frontend on PlayerResponseDTO.elo and PlayerProfileDTO.elo eliminated.**

## Performance

- **Duration:** ~5 min (16:04Z → 16:09Z)
- **Started:** 2026-04-29T16:04Z
- **Completed:** 2026-04-29T16:09Z
- **Tasks:** 2 / 2
- **Files modified:** 2 modified, 1 created

## Accomplishments

- Drift-fixed `PlayerResponseDTO` and `PlayerProfileDTO` so they mirror their backend Pydantic counterparts (both now include `elo: number`).
- Added new `EloChangeDTO` interface mirroring `backend/schemas/elo.py` exactly (with `player_name: string` backend convenience field).
- Added new `EloRankDTO` and `PlayerEloSummaryDTO` interfaces matching the D-02 response shape, with all three nullable fields (`peak_elo`, `last_delta`, `rank`) typed correctly.
- Created `frontend/src/api/elo.ts` with the single typed wrapper `getEloSummary(playerId): Promise<PlayerEloSummaryDTO>` — no retry, no caching, no try/catch (D-19 load-bearing).
- Updated `GameRecords.test.tsx` fixture to satisfy the new required `elo` field on the literal `PlayerResponseDTO` construction; full test suite remains green (122/122).

## Task Commits

Each task was committed atomically with `--no-verify` (parallel-executor convention):

1. **Task 1: Add ELO types + drift-fix existing player types** — `5deb170` (feat)
2. **Task 2: Create the api/elo.ts wrapper exporting getEloSummary** — `6339c65` (feat)

_Note: Both tasks ship type-only / pure-wrapper changes. The plan's `tdd="true"` annotation is N/A for compile-time-only artifacts; `npm run typecheck` is the contract-validation step (per plan `<verify>` blocks). Existing component test suite was the regression gate — passed 122/122._

## Files Created/Modified

- **Created** `frontend/src/api/elo.ts` — typed wrapper around `api.get<PlayerEloSummaryDTO>` for the `/players/{id}/elo-summary` endpoint that Plan 01 ships. JSDoc documents the no-cache / no-retry contract per D-19.
- **Modified** `frontend/src/types/index.ts` — added `elo: number` to `PlayerResponseDTO` (last field) and `PlayerProfileDTO` (second field, after `player_id`). Appended new `// ---- ELO DTOs ----` section with `EloChangeDTO`, `EloRankDTO`, `PlayerEloSummaryDTO` interfaces.
- **Modified** `frontend/src/test/components/GameRecords.test.tsx` — updated `PLAYERS` fixture so each literal `PlayerResponseDTO` includes `elo: 1000` (the backend seed value per D-05). Required so `npm run typecheck` and `npm run test -- --run` continue to pass after the drift fix added `elo` as a non-optional field.

## Decisions Made

- **Strict scope honored (D-13):** Did not introduce `EloHistoryPointDTO`, `PlayerEloHistoryDTO`, `getEloChanges`, or `getEloHistory` — those belong to Phases 10 (changes modal) and 11 (history endpoint).
- **Section comment style:** New `// ---- ELO DTOs ----` placed at end of file (after Achievement section) using the existing comment delimiter style (`// ----`, four hyphens, single space).
- **Field ordering:** Mirrored backend exactly. `elo` is the last field on `PlayerResponseDTO` (matches `backend/schemas/player.py:39-43`) and the second field on `PlayerProfileDTO` (matches `backend/schemas/player_profile.py:20-25`).
- **JSDoc on getEloSummary:** Deliberately added (despite `players.ts` having no JSDoc) because D-19 is load-bearing — future readers must understand WHY there is no retry/cache layer. Comment is terse (3 sentences).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated GameRecords.test.tsx fixture to add elo: 1000**
- **Found during:** Task 1 (Step 4 audit per plan instructions)
- **Issue:** `frontend/src/test/components/GameRecords.test.tsx:32-35` literally constructs `PlayerResponseDTO[]` without the new required `elo: number` field. Adding the field to the interface would have broken `npm run typecheck` and `npm run test -- --run`.
- **Fix:** Added `elo: 1000` (backend seed value per D-05) to each player literal in the `PLAYERS` fixture.
- **Files modified:** `frontend/src/test/components/GameRecords.test.tsx`
- **Verification:** `npm run typecheck` exit 0; `npm run test -- --run` 122/122 passing including this file.
- **Committed in:** `5deb170` (Task 1 commit, alongside the type changes that necessitated the fix)

_Note: This was explicitly anticipated by the plan (Task 1 Step 4 instructed the executor to audit consumers and add `elo: 1000` to fixtures). Calling it out in the deviation log for transparency, but it was planned work, not a true deviation._

---

**Total deviations:** 1 auto-fixed (1 blocking, planned-and-anticipated)
**Impact on plan:** No scope creep. Plan executed exactly as written, including the explicit fixture-update step. Strict scope (D-13 / D-19 / D-20) honored.

## Issues Encountered

None. The two tasks landed cleanly:
- Backend was already on the correct shape (`backend/schemas/player.py` and `backend/schemas/player_profile.py` confirmed `elo: int` present).
- Only one literal-construction site existed for the affected DTOs (`GameRecords.test.tsx`), which the plan instructed to update.
- `node_modules` were missing in the worktree (expected — fresh checkout); ran `npm install` once, then both `typecheck` and `test -- --run` succeeded.

## TDD Gate Compliance

The plan tasks are tagged `tdd="true"`, but both tasks ship compile-time-only artifacts (type definitions and a 1-line API wrapper that is not invoked at runtime within this plan). Per the plan's own `<verify>` blocks and the parent prompt's `<parallel_execution>` guidance, the contract-validation gate for this plan is `npm run typecheck` (which is a stricter compile-time test for type changes). The full Vitest suite served as the regression gate (122/122 green). No new runtime-test files were added by this plan.

## Strict Scope Confirmation (D-13 / D-19 / D-20)

Verified via grep:

| Gate | Command | Result |
|------|---------|--------|
| No Phase 10/11 types speculated | `grep -E "EloHistoryPointDTO\|PlayerEloHistoryDTO" frontend/src/types/index.ts` | exit 1 (no match) — OK |
| No future-phase wrappers | `grep -E "getEloChanges\|getEloHistory" frontend/src/api/elo.ts` | exit 1 (no match) — OK |
| No cache/retry layer | `grep -iE "useQuery\|localStorage\|cache\|setTimeout\|retry" frontend/src/types/ frontend/src/api/elo.ts` | exit 1 (no match) — OK |
| Both new types present | `grep -lE "PlayerEloSummaryDTO\|EloRankDTO\|EloChangeDTO\|getEloSummary"` | both expected files | OK |
| `elo: number` in both DTOs | `grep -c "elo: number" frontend/src/types/index.ts` | 4 (≥2 required: in `PlayerResponseDTO`, `PlayerProfileDTO`, `EloChangeDTO.elo_before`, `EloChangeDTO.elo_after`) — OK |

## User Setup Required

None — no environment variables, no external services, no manual configuration needed. This is a pure-code foundation plan.

## Next Phase Readiness

- Plan 03 (component + page integration) can now `import { getEloSummary } from '@/api/elo'` and `import type { PlayerEloSummaryDTO } from '@/types'` without further wiring.
- Phase 10 will extend `frontend/src/api/elo.ts` with `getEloChanges(gameId)` and add `EloChangeDTO` consumers (already exported here).
- Phase 11 will extend the same file with `getEloHistory(...)` and add `PlayerEloHistoryDTO`/`EloHistoryPointDTO` to `frontend/src/types/index.ts`.
- Backend endpoint `GET /players/{id}/elo-summary` is owned by Plan 01 (parallel sibling in this wave). Plan 02 is decoupled — it compiles and tests green even before Plan 01 lands at runtime, because the wrapper is never invoked in this plan.

## Self-Check: PASSED

Verified post-write:

```
$ test -f frontend/src/api/elo.ts && echo "FOUND: frontend/src/api/elo.ts"
FOUND: frontend/src/api/elo.ts

$ git log --oneline --all | grep -E "5deb170|6339c65"
5deb170 feat(09-02): add ELO types + drift-fix Player DTOs
6339c65 feat(09-02): add api/elo.ts with getEloSummary wrapper

$ npm run typecheck   → exit 0
$ npm run test -- --run   → 122/122 passing
```

All claimed files exist, all claimed commits exist, all verification commands pass.

---
*Phase: 09-playerprofile-elo-surface-frontend-foundation*
*Plan: 02*
*Completed: 2026-04-29*
