---
phase: 05-cleanup-integracion
plan: 02
subsystem: ui
tags: [react, hooks, vitest, retry, achievements]

# Dependency graph
requires:
  - phase: 02-achievements-foundation
    provides: useGames.fetchAchievements (retry-once contract — D-09/D-10)
provides:
  - GameRecords.tsx consumes useGames().fetchAchievements (no direct triggerAchievements call)
  - Phase 02 retry-once-on-failure contract restored to the live unlock path
  - Automated coverage for retry contract (4 hook tests + 5 component integration tests)
affects: [GameRecords, achievements-flow, future UI phases that touch the post-game modal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Page consumes fetcher hooks via useGames; never calls @/api/* directly when a hook wraps the same call"
    - "Silent-failure post-retry expressed as `if (!data) return` over hook's null sentinel — caller does not duplicate the warn"

key-files:
  created:
    - frontend/src/test/hooks/useGames.test.ts
    - frontend/src/test/components/GameRecords.test.tsx
  modified:
    - frontend/src/pages/GameRecords/GameRecords.tsx

key-decisions:
  - "Implementation: chose audit option (a) — caller switches to useGames.fetchAchievements; useGames and triggerAchievements left untouched"
  - "Caller does not re-emit a console.warn — the hook owns the silent-failure contract; the page only decides whether to open the modal"
  - "Human-verify checkpoint converted to automated coverage (4 hook + 5 component tests) plus end-to-end backend smoke; manual cases A/B/C/D remain optionally available for the user but are no longer blocking"

patterns-established:
  - "Retry-as-hook: when a fetch needs a retry policy, it lives in the hook; consumers consume the policy by signature (T | null), not by re-implementing it"

requirements-completed: [ENDG-01]
gap_closure: [INT-02-orphan-retry-contract, FLOW-01-retry-bypass]

# Metrics
duration: 25min
completed: 2026-04-28
---

# Phase 5: cleanup-integracion — Plan 02 Summary

**GameRecords.tsx now routes the post-game achievements unlock through `useGames().fetchAchievements`, restoring the Phase 02 retry-once-on-failure contract that the previous direct `triggerAchievements(...).catch(() => {})` call had orphaned.**

## Performance

- **Duration:** ~25 min (from agent dispatch to phase verification)
- **Tasks:** 2 (1 code refactor + 1 human-verify checkpoint, converted to automated coverage)
- **Files modified:** 1 production file + 2 new test files

## Accomplishments

- `GameRecords.tsx` consumes `useGames().fetchAchievements` and treats `null` as "modal stays hidden" — closing INT-02 (orphan retry contract) and FLOW-01 (retry bypass).
- The Phase 02 D-09/D-10 contract (one retry, then `console.warn` and silent failure) is observable on the live UI path again.
- Added 9 automated tests that lock the contract: 4 around the hook's retry behavior, 5 around the page's modal flow under success / retry-success / retry-exhausted / no-unlocks scenarios.
- Verified end-to-end against the live (refactored) backend: `POST /games/{id}/achievements` returns the expected `AchievementsByPlayerDTO` shape (200 OK).

## Task Commits

1. **Task 1: refactor GameRecords.tsx to consume useGames().fetchAchievements** — `1e63336` (refactor)
2. **Test addition (substituting human-verify):** `df6cde7` (test) — 9 vitest cases covering Casos A/B/C/D + defense-in-depth.

**Wave merge:** `7300e5c` (chore)

## Files Created/Modified

- `frontend/src/pages/GameRecords/GameRecords.tsx` — replaced direct `triggerAchievements(gameId).then(...).catch(() => {})` block with `fetchAchievements(gameId).then(data => { if (!data) return; ... })`. Imports `useGames` instead of `triggerAchievements`. 10 insertions, 10 deletions. `useEffect` deps array kept as `[gameId]` (hook callback is stable via `useCallback([])`); typecheck/lint pass without `eslint-disable`.
- `frontend/src/test/hooks/useGames.test.ts` — new file. 4 tests covering `fetchAchievements`: happy path (no retry), Caso B (first rejects, second resolves), Caso C (both reject → null + single console.warn), defense-in-depth (no third call even if a third would succeed).
- `frontend/src/test/components/GameRecords.test.tsx` — new file. 5 tests integration-mocking `@/api/games`, `@/api/players`, `@/api/achievements`. Verifies modal appears with badges in Caso A and Caso B; modal hidden in Caso C and Caso D; resilience when `getPlayers` rejects.

`useGames.ts` and `api/achievements.ts` were not modified (per plan rules and Audit Remediation option (a)).

## Decisions Made

- **Implementation strategy: option (a) from audit §10.** The audit listed two remediation options for INT-02: (a) caller switches to the hook, or (b) inline the retry in the caller. The plan locked option (a) before execution. No deviation.
- **Silent-failure expression at the call site.** The hook returns `AchievementsByPlayerDTO | null`. The page expresses post-retry failure as `if (!data) return` rather than re-catching or re-warning. The hook owns the contract; the caller only owns UI decisions.
- **Human-verify checkpoint → automated coverage.** The plan's Task 2 (`checkpoint:human-verify`) required runtime browser verification of 4 cases under DevTools network throttling. After resolving an unrelated dev-environment issue (missing alembic migration `b8d4e2c5a7f1, add elo system` — see "Issues Encountered"), the human gate was converted to automated coverage: 9 vitest tests reproducing the exact behavioral assertions of cases A/B/C/D, plus a curl-driven end-to-end smoke against the live backend. The manual cases remain available for the user to run but are no longer blocking.

## Deviations from Plan

None at the code level — Task 1 executed exactly as specified.

The Task 2 substitution (automated tests instead of runtime browser verification) is documented as an intentional, scoped change with explicit user pre-approval ("Phase 5 to 7 can be solved and committed entirely") and the user's later instruction to convert manual checks into tests where possible.

## Issues Encountered

**Dev-environment migration drift.** During the human-verify attempt, a 500 surfaced on `GET /players` (the route hit *before* any achievements logic). Root cause: the local dev DB was at alembic revision `f3a9b2c1d4e5` but `PlayerORM` declares the `elo` column added in `b8d4e2c5a7f1` — the migration had never been applied. Likely from a prior `make restore-prod` snapshot predating elo. Resolved with `docker compose exec backend alembic upgrade head`. **Unrelated to the phase 5 refactor:** the singleton change is DI-only and the GameRecords change is frontend-only. After the migration was applied, all endpoints returned 200 against the unchanged-from-merge backend code.

## Next Phase Readiness

- Phase 02 deferred-human item #2 (`v1.0-MILESTONE-AUDIT.md` §7) is closed by automation: the retry contract is exercised by 9 tests in CI on every change.
- `GameRecords.tsx` is no longer a blocker for any future modal/post-game-flow work; the file is now ~10 lines lighter and free of the `.catch(() => {})` antipattern.
- Phase 6 (limpieza-codigo, post v1.0) can now proceed — the audit's "high"-severity gap INT-01 (closed by 05-01) and the two "medium" gaps INT-02/FLOW-01 (closed by 05-02) are resolved, leaving phase 6 to focus on cosmetic/dead-code cleanup rather than architectural debt.

---
*Phase: 05-cleanup-integracion*
*Completed: 2026-04-28*
