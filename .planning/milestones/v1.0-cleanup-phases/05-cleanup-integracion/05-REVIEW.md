---
phase: 05-cleanup-integracion
reviewed: 2026-04-27T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - backend/services/container.py
  - backend/routes/games_routes.py
  - backend/routes/players_routes.py
  - backend/routes/achievements_routes.py
  - frontend/src/pages/GameRecords/GameRecords.tsx
  - frontend/src/test/hooks/useGames.test.ts
  - frontend/src/test/components/GameRecords.test.tsx
findings:
  critical: 0
  warning: 1
  info: 4
  total: 5
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-27
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 05 closes three audit gaps from the v1.0 cleanup milestone:

- **INT-01 (high)** — Centralize `AchievementsService` as a singleton in `backend/services/container.py`. Verified: the singleton is now defined once in `services/container.py:23-27` and consumed via `from services.container import achievements_service` in all three routes (`games_routes.py:17`, `players_routes.py:8`, `achievements_routes.py:2`). A repository-wide grep confirms zero ad-hoc instantiations remain in production code (one legitimate instance in `backend/tests/test_achievements_service.py:106` is intentional test isolation).
- **INT-02 (medium)** — Layer separation honored: `services/container.py` only composes services and imports repositories from `repositories/container.py`. No repositories live in the service container, matching the project convention (`feedback_container_per_layer`).
- **FLOW-01 (medium)** — `GameRecords.tsx` now consumes `useGames().fetchAchievements`, restoring the Phase 02 D-09/D-10 retry-once + silent-warn contract. The 9 added vitest cases (4 hook-level + 5 component-level) cover the happy path, retry success, retry exhaustion, empty-payload, and a getPlayers-failure side case. Test fixtures and `console.warn` spies match the contract documented in `useGames.ts:83-96`.

Overall the phase is well-scoped and the implementation is correct. No critical or security issues. One real warning (a pre-existing dead-code branch in `GameRecords.tsx` that is now in scope because the surrounding code was edited) and four informational items related to maintainability and minor type-contract drift.

## Warnings

### WR-01: Dead-code branch in records `.catch` handler

**File:** `frontend/src/pages/GameRecords/GameRecords.tsx:33-36`
**Issue:** The `getGameRecords` rejection handler has two branches that do the exact same thing, so the conditional is unreachable / vestigial:

```ts
.catch((err) => {
  if (err instanceof ApiError && err.status === 404) setNotAvailable(true)
  else setNotAvailable(true)
})
```

Both arms call `setNotAvailable(true)`. Either the original intent was to differentiate (e.g., a different state for non-404 errors such as a generic "error loading records" flag) and the branch was never finished, or the `if/else` should be collapsed. As written it is a code smell that suggests an incomplete error-handling story for non-404 failures. This block sits next to the code edited in this phase, which is why it is in scope.

**Fix:** Either collapse to the unconditional form:

```ts
.catch(() => setNotAvailable(true))
```

…or, if the original intent was to surface a distinct "error" state (different from the legitimate "no records yet" 404), introduce a separate state and branch on it:

```ts
const [recordsError, setRecordsError] = useState(false)
// ...
.catch((err) => {
  if (err instanceof ApiError && err.status === 404) setNotAvailable(true)
  else setRecordsError(true)
})
```

If the second behavior is desired, `RecordsSection` should be updated to render an error variant. Recommend the first option for v1.0 (matches the silent-failure pattern used elsewhere on this page) and tracking the richer error UX as a follow-up.

## Info

### IN-01: `useEffect` dependency array omits `fetchAchievements`

**File:** `frontend/src/pages/GameRecords/GameRecords.tsx:55`
**Issue:** The effect calls `fetchAchievements(gameId)` but the dependency array is `[gameId]`. `fetchAchievements` comes from `useGames()` and is wrapped in `useCallback(..., [])` (`useGames.ts:83-96`), so the reference is stable across renders and the effect is functionally correct. However, `react-hooks/exhaustive-deps` will warn on this, and the safety only holds as long as `useGames` keeps the empty dep array on `fetchAchievements` — coupling that is invisible from this file.
**Fix:** Add `fetchAchievements` to the dep array to make the contract explicit and silence the lint rule:

```ts
}, [gameId, fetchAchievements])
```

This is a no-op at runtime today (stable identity) and protects against future changes to `useGames`.

### IN-02: `playersMap` recomputed on every render

**File:** `frontend/src/pages/GameRecords/GameRecords.tsx:57`
**Issue:** `const playersMap = new Map(players.map((p) => [p.player_id, p.name]))` runs on every render even though `players` only changes once (when `getPlayers()` resolves). This is a maintainability/clarity nit — performance is out of v1 scope per the review charter — but wrapping it in `useMemo` makes the intent ("derived value, recompute when players changes") explicit and matches the `Map` usage handed to `AchievementModal` as a prop, which would otherwise bust memoization in the child.
**Fix:**

```ts
const playersMap = useMemo(
  () => new Map(players.map((p) => [p.player_id, p.name])),
  [players],
)
```

### IN-03: Frontend `PlayerResponseDTO` is missing the backend's `elo` field

**File:** `frontend/src/types/index.ts:5-9` (consumed by `frontend/src/pages/GameRecords/GameRecords.tsx:20` and `frontend/src/test/components/GameRecords.test.tsx:32-35`)
**Issue:** Cross-file check across the API boundary: backend `schemas/player.py:39-43` declares `PlayerResponseDTO` with `player_id: str`, `name: str`, `is_active: bool`, **`elo: int`**. The frontend mirror in `types/index.ts:5-9` omits `elo`. The test fixture `PLAYERS` in `GameRecords.test.tsx:32-35` also omits `elo`, so the test passes only because the fixture matches the (incomplete) frontend type rather than the real wire payload. This is pre-existing drift — not introduced by this phase — but it is in the file set under review and is a real type-contract gap.
**Fix:** Add `elo: number` to the frontend `PlayerResponseDTO` and update fixtures in `GameRecords.test.tsx` accordingly:

```ts
export interface PlayerResponseDTO {
  player_id: string
  name: string
  is_active: boolean
  elo: number
}
```

```ts
const PLAYERS: PlayerResponseDTO[] = [
  { player_id: 'p1', name: 'Alice', is_active: true, elo: 1500 },
  { player_id: 'p2', name: 'Bob',   is_active: true, elo: 1500 },
]
```

If a follow-up phase already tracks DTO sync (e.g., a generated-types task), defer there; otherwise file as a small standalone fix.

### IN-04: Inconsistent service-instantiation pattern across routes

**File:** `backend/routes/games_routes.py:28-32`, `backend/routes/players_routes.py:17-28`
**Issue:** Phase 05's stated goal (per the plan) was to centralize service singletons. `achievements_service` and `elo_service` now live in `services/container.py`, but `games_service` (`games_routes.py:28-32`), `player_service`, `player_records_service`, and `player_profile_service` (`players_routes.py:17-28`) are still instantiated at module import time inside their respective route files. This is fine for v1.0 — the audit gap INT-01 specifically called out `AchievementsService`, and the phase plan does not require migrating the others — but it leaves the codebase with two parallel patterns for the same concern, which weakens the "single source of truth" guarantee that motivates `services/container.py` in the first place.
**Fix:** Track as a follow-up: migrate the remaining services into `services/container.py` so every route imports its dependencies from one place. Suggested follow-up issue title: *"Move games_service / player_service / player_profile_service / player_records_service into services/container.py"*. No change required in this phase.

---

_Reviewed: 2026-04-27_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
