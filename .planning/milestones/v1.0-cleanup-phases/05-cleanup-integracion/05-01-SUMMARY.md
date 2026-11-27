---
phase: 05-cleanup-integracion
plan: 01
subsystem: api
tags: [fastapi, dependency-injection, refactor, container-pattern, achievements]

# Dependency graph
requires:
  - phase: 02-integraci-n-y-api
    provides: AchievementsService and 3 routes (POST /games/{id}/achievements, GET /achievements/catalog, POST /achievements/reconcile, GET /players/{id}/achievements)
  - phase: 04-reconciliador
    provides: reconcile_all on AchievementsService consumed by /achievements/reconcile
provides:
  - achievements_service singleton in services/container.py composed with achievement_repository, games_repository, players_repository
  - games_routes, players_routes and achievements_routes consuming the singleton from services.container
  - Container pattern compliance (feedback_container_per_layer) for AchievementsService — matches the pre-existing pattern of elo_service
affects: [05-02-frontend-cleanup, 06-cleanup-final, future plans introducing service-level state (caches/metrics)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service singletons live in services/container.py composed from repositories.container; routers import the singletons"

key-files:
  created: []
  modified:
    - backend/services/container.py
    - backend/routes/games_routes.py
    - backend/routes/players_routes.py
    - backend/routes/achievements_routes.py

key-decisions:
  - "Mirror exactly the elo_service pattern: kwargs explícitos, una línea por kwarg, append after existing singletons (no module reorder)"
  - "Drop achievement_repository import in games_routes/players_routes (no remaining usage after refactor); drop the entire repositories.container import in achievements_routes (zero remaining usages)"
  - "Combine achievements_service into the existing services.container import line in games_routes (alphabetical: achievements_service, elo_service); add a new import line in players_routes and achievements_routes"

patterns-established:
  - "container_per_layer: service singletons centralized in services/container.py; routers consume them via import (no local instantiation)"

requirements: [INTG-03, TOOL-02]
requirements-completed: [INTG-03, TOOL-02]
gap_closure: [INT-01-container-pattern]

# Metrics
duration: 3min
completed: 2026-04-28
---

# Phase 05 Plan 01: Centralizar AchievementsService como singleton Summary

**`AchievementsService` ahora vive como singleton único en `services/container.py` (igual que `elo_service`); los 3 routers lo consumen vía import en lugar de instanciarlo localmente — cierra gap arquitectónico INT-01 sin cambios de comportamiento.**

## Performance

- **Duration:** ~3 min (160 segundos de wall-clock; mayoría en `make test-backend` build/run)
- **Started:** 2026-04-28T00:06:10Z
- **Completed:** 2026-04-28T00:08:50Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `achievements_service` expuesto como singleton en `backend/services/container.py`, compuesto con los 3 repositorios singleton de `repositories.container` (mismo patrón que `elo_service`).
- `games_routes.py`, `players_routes.py` y `achievements_routes.py` consumen el singleton desde `services.container` y eliminan su instanciación local (3 → 1 instancia compartida).
- Imports limpiados: `achievement_repository` removido del import en `games_routes` y `players_routes` (sin usos residuales); el import completo de `repositories.container` removido en `achievements_routes` (zero usos).
- Suite de backend completa pasa dentro de Docker: **176 tests, 0 fallos, 0 errores de colección** — refactor confirmado como behavior-preserving.

## Task Commits

Each task was committed atomically (con `--no-verify` por estar en parallel worktree):

1. **Tarea 1: Exponer achievements_service como singleton en services/container.py** - `d408fc7` (refactor)
2. **Tarea 2: Reemplazar las 3 instancias locales por import del singleton** - `400f33d` (refactor)
3. **Tarea 3: Validar make test-backend** - sin commit (solo ejecución; 176 passed, exit 0)

**Plan metadata commit:** se realizará al finalizar este SUMMARY (incluye este archivo).

## Files Created/Modified

- `backend/services/container.py` — añadido `achievements_service` singleton + import de `AchievementsService` y `achievement_repository`. Docstring intacto.
- `backend/routes/games_routes.py` — eliminada instanciación local de `AchievementsService` y su import directo; añadido `achievements_service` al import existente de `services.container`; removido `achievement_repository` del import de `repositories.container`.
- `backend/routes/players_routes.py` — eliminada instanciación local + import directo; añadida línea `from services.container import achievements_service`; removido `achievement_repository` del import de `repositories.container`.
- `backend/routes/achievements_routes.py` — eliminada instanciación local + import directo; añadida línea `from services.container import achievements_service`; eliminada por completo la línea `from repositories.container import games_repository, achievement_repository, players_repository` (zero usos remanentes).

### Diff resumido (4 archivos)

```diff
diff --git a/backend/services/container.py b/backend/services/container.py
@@
 from repositories.container import (
+    achievement_repository,
     elo_repository,
     games_repository,
     players_repository,
 )
+from services.achievements_service import AchievementsService
 from services.elo_service import EloService

 elo_service = EloService(...)
+
+achievements_service = AchievementsService(
+    games_repository=games_repository,
+    achievement_repository=achievement_repository,
+    players_repository=players_repository,
+)

diff --git a/backend/routes/games_routes.py b/backend/routes/games_routes.py
@@
 from repositories.container import (
     games_repository,
     players_repository,
-    achievement_repository,
     elo_repository,
 )
-from services.container import elo_service
+from services.container import achievements_service, elo_service
 from repositories.game_filters import GameFilter
-from services.achievements_service import AchievementsService
 from schemas.achievement import AchievementsByPlayerResponseDTO
@@
 games_service = GamesService(...)
-
-achievements_service = AchievementsService(
-    games_repository=games_repository,
-    achievement_repository=achievement_repository,
-    players_repository=players_repository,
-)

diff --git a/backend/routes/players_routes.py b/backend/routes/players_routes.py
@@
-from repositories.container import games_repository, players_repository, achievement_repository
+from repositories.container import games_repository, players_repository
 from services.player_records_service import PlayerRecordsService
 from schemas.player import PlayerCreateDTO, PlayerCreatedResponseDTO, PlayerResponseDTO, PlayerUpdateDTO
 from services.player_service import PlayerService
+from services.container import achievements_service
 from typing import Optional
-from services.achievements_service import AchievementsService
 from schemas.achievement import PlayerAchievementsResponseDTO
@@
 player_profile_service = PlayerProfileService(...)
-
-achievements_service = AchievementsService(
-    games_repository=games_repository,
-    achievement_repository=achievement_repository,
-    players_repository=players_repository,
-)

diff --git a/backend/routes/achievements_routes.py b/backend/routes/achievements_routes.py
@@
 from fastapi import APIRouter
-from services.achievements_service import AchievementsService
+from services.container import achievements_service
 from schemas.achievement import AchievementCatalogResponseDTO, ReconcileResponseDTO, PlayerReconcileChangeDTO
-from repositories.container import games_repository, achievement_repository, players_repository

 router = APIRouter(prefix="/achievements", tags=["Achievements"])
-
-achievements_service = AchievementsService(
-    games_repository=games_repository,
-    achievement_repository=achievement_repository,
-    players_repository=players_repository,
-)
```

Diff total: **+12 / -29 líneas**, 4 archivos.

## Decisions Made

- **Orden de imports en `services/container.py`:** seguir orden alfabético tanto en `repositories.container` (achievement_repository antes de elo_repository) como en clases de servicio (`AchievementsService` antes de `EloService`). Minimiza churn y respeta convención del módulo existente.
- **Limpieza de imports en routers:** verifiqué con `grep` por archivo después del cambio que ningún uso residual quedaba antes de remover `achievement_repository` (en `games_routes` y `players_routes`) y la línea completa de `repositories.container` (en `achievements_routes`). Plan lo permitía condicionalmente y todas las condiciones se cumplían.
- **`make test-backend` en lugar de `pytest`:** respetado estrictamente (skill `test-backend` + memoria `feedback_never_run_pytest_locally`). El comando corre Docker contra `db_test`, no toca la DB de dev.

## Deviations from Plan

None - plan executed exactly as written.

Las 3 instrucciones de cleanup condicional de imports en la Tarea 2 se cumplieron por completo (las 3 condiciones eran true), por lo que las eliminaciones se aplicaron tal como el plan las describía. No fue necesario aplicar ninguna regla de deviation.

---

**Total deviations:** 0
**Impact on plan:** Refactor puro de DI, behavior-preserving. Sin scope creep.

## Issues Encountered

None — refactor lineal, tests verdes a la primera.

## Test Output (`make test-backend`)

```
INFO  [alembic.runtime.migration] Running upgrade 85250527884f -> f3a9b2c1d4e5, add player achievements
INFO  [alembic.runtime.migration] Running upgrade f3a9b2c1d4e5 -> b8d4e2c5a7f1, add elo system
........................................................................ [ 40%]
........................................................................ [ 81%]
................................                                         [100%]
176 passed in 3.60s
```

Exit code: **0**. Conteo (176) ≥ baseline previo (131+ según `v1.0-MILESTONE-AUDIT.md` §1). Cero fallos, cero errores de colección. Específicamente confirmado que los tests de integración del singleton (`test_trigger_achievements_returns_200`, `test_trigger_achievements_nonexistent_game`, `test_get_player_achievements`, `test_get_catalog`, `test_catalog_has_tiers_and_holders`, `test_reconcile_returns_200_with_summary` en `backend/tests/integration/test_achievements_routes.py`) pasan.

## User Setup Required

None - refactor interno, sin configuración externa.

## Next Phase Readiness

- **Plan 05-02 (frontend cleanup):** sin bloqueo desde aquí; este plan solo toca backend.
- **Phase 06 (cleanup final):** las dobles líneas en blanco residuales en `backend/routes/games_routes.py` (heredadas, no introducidas por este plan) son responsabilidad explícita de Phase 6 — no se tocaron aquí, según indicación del plan.
- **Gap INT-01** del audit `v1.0-MILESTONE-AUDIT.md` cerrado: `AchievementsService` ya no se instancia 3 veces. Cualquier nuevo plan que introduzca estado a nivel servicio (caché, métricas, etc.) ahora tendrá un único punto de verdad.
- **Requirements completados:** `INTG-03` (achievements integrados al flujo) y `TOOL-02` (reconciler accesible) consolidan su implementación contra un singleton compartido — sin regresión en los endpoints.

---
*Phase: 05-cleanup-integracion*
*Completed: 2026-04-28*

## Self-Check: PASSED
