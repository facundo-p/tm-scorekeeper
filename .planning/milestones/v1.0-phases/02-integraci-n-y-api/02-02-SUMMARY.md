---
phase: 02-integraci-n-y-api
plan: "02"
subsystem: api
tags: [fastapi, react, typescript, achievements, rest-api]

# Dependency graph
requires:
  - phase: 02-integraci-n-y-api/02-01
    provides: AchievementsService, schemas (AchievementsByPlayerResponseDTO, PlayerAchievementsResponseDTO, AchievementCatalogResponseDTO), AchievementRepository, container.py with achievement_repository

provides:
  - POST /games/{game_id}/achievements — triggers achievement evaluation, returns 200 with achievements_by_player (never 500)
  - GET /players/{player_id}/achievements — returns all 5 achievements with tier/progress for player
  - GET /achievements/catalog — returns all 5 achievement definitions with holders
  - achievements_router registered in main.py
  - TypeScript interfaces for all achievement DTOs in frontend/src/types/index.ts
  - frontend/src/api/achievements.ts with triggerAchievements, getPlayerAchievements, getAchievementsCatalog
  - useGames.fetchAchievements with 1-retry logic exposed in hook return

affects:
  - 03-frontend-visual (will consume fetchAchievements and achievement types in GameForm page)
  - player-profile UI (will consume getPlayerAchievements)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Module-level AchievementsService singleton in each route file (same as GamesService/PlayerService pattern)
    - Achievements router registered in main.py via include_router
    - Frontend API functions wrap api.post/api.get with typed generics
    - Retry-once pattern in useGames for non-critical async side effects

key-files:
  created:
    - backend/routes/achievements_routes.py
    - backend/tests/integration/test_achievements_routes.py
    - frontend/src/api/achievements.ts
  modified:
    - backend/routes/games_routes.py
    - backend/routes/players_routes.py
    - backend/main.py
    - frontend/src/types/index.ts
    - frontend/src/hooks/useGames.ts

key-decisions:
  - "fetchAchievements is NOT called inside submitGame — caller (GameForm page) chains calls: submitGame → fetchAchievements → fetchRecords. Keeps submitGame focused on game creation only."
  - "No try/except in trigger_achievements route — AchievementsService.evaluate_for_game already handles all errors internally and returns {}"
  - "AchievementsService singleton pattern: separate instance per route file (games_routes, players_routes, achievements_routes) — consistent with existing service pattern"

patterns-established:
  - "Route files get a module-level service singleton, not inline instantiation per request"
  - "TypeScript interfaces mirror backend Pydantic schemas field-for-field"

requirements-completed: [INTG-03, API-01, API-02]

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 02 Plan 02: API Integration — REST Endpoints + Frontend Types Summary

**3 achievement REST endpoints wired to AchievementsService, 8 TypeScript interfaces, API client, and useGames retry logic — full backend API functional and frontend ready to consume achievements.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-31T16:42:43Z
- **Completed:** 2026-03-31T16:46:47Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Wired POST /games/{id}/achievements, GET /players/{id}/achievements, GET /achievements/catalog to AchievementsService
- Registered achievements_router in main.py
- Added 5 integration tests (5/5 pass, 123/123 total backend tests pass)
- Added 8 TypeScript interfaces to frontend/src/types/index.ts matching backend DTOs
- Created frontend/src/api/achievements.ts with 3 typed API functions
- Updated useGames.ts with fetchAchievements (1-retry logic) exposed in return object
- TypeScript compiles cleanly (0 errors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Three REST endpoints + router registration + integration tests** - `f49d9aa` (feat)
2. **Task 2: Frontend TypeScript types, API client, and useGames retry logic** - `4a2fa7c` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `backend/routes/achievements_routes.py` - New router with GET /achievements/catalog endpoint
- `backend/routes/games_routes.py` - Added POST /{game_id}/achievements endpoint and AchievementsService singleton
- `backend/routes/players_routes.py` - Added GET /{player_id}/achievements endpoint and AchievementsService singleton
- `backend/main.py` - Registered achievements_router
- `backend/tests/integration/test_achievements_routes.py` - 5 integration tests for all 3 new endpoints
- `frontend/src/types/index.ts` - Added 8 achievement-related TypeScript interfaces
- `frontend/src/api/achievements.ts` - New file: triggerAchievements, getPlayerAchievements, getAchievementsCatalog
- `frontend/src/hooks/useGames.ts` - Added fetchAchievements with retry logic, exposed in return object

## Decisions Made

- `fetchAchievements` is NOT called inside `submitGame`. The caller (GameForm page) is responsible for chaining: `submitGame()` → `fetchAchievements(gameId)` → `fetchRecords(gameId)`. This keeps `submitGame` focused on game creation only and will be wired in Phase 3 (frontend UI).
- No try/except wrapper in `trigger_achievements` route — `AchievementsService.evaluate_for_game` already handles all exceptions internally and returns `{}`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Full backend API is functional: 3 achievement endpoints live and tested
- Frontend TypeScript interfaces and API client ready for UI consumption
- useGames exposes fetchAchievements for chaining in GameForm page (Phase 3)
- Blocker resolved: GameCreatedResponseDTO unchanged (D-03 honored), no breaking changes to existing frontend consumers

---
*Phase: 02-integraci-n-y-api*
*Completed: 2026-03-31*
