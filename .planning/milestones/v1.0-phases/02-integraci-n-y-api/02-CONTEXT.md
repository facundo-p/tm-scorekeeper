# Phase 2: Integración y API - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Crear el AchievementsService que evalúa y persiste logros, exponerlo como endpoint separado POST /games/{id}/achievements (no inline en POST /games/), y agregar endpoints REST para consultar logros de jugador y catálogo global. Incluye DTOs, mappers, y tipos TypeScript para el frontend.

</domain>

<decisions>
## Implementation Decisions

### Evaluación de logros — Endpoint separado
- **D-01:** La evaluación de logros NO se ejecuta inline en POST /games/. Se hace en un endpoint separado: `POST /games/{game_id}/achievements`
- **D-02:** El frontend llama automáticamente a POST /games/{id}/achievements después de un POST /games/ exitoso. El usuario no percibe las 2 llamadas
- **D-03:** `GameCreatedResponseDTO` NO cambia — sigue siendo `{id, game}`. No hay breaking change
- **D-04:** El endpoint POST /games/{id}/achievements evalúa todos los evaluadores del registry para los jugadores de esa partida, persiste con upsert, y retorna los logros desbloqueados/mejorados

### Response shape de achievements (POST /games/{id}/achievements)
- **D-05:** Response agrupada por player: `achievements_by_player: { [player_id]: AchievementUnlockedDTO[] }`
- **D-06:** Solo aparecen players que desbloquearon/mejoraron algo. Players sin cambios se omiten
- **D-07:** Cada `AchievementUnlockedDTO` incluye: `code`, `title`, `tier`, `is_new`, `is_upgrade`, `icon`, `fallback_icon`
- **D-08:** Si un jugador cruza múltiples tiers en una partida, solo un item con el tier final (INTG-05)

### Failure handling
- **D-09:** Si POST /games/{id}/achievements falla, el frontend hace 1 retry automático
- **D-10:** Si falla la 2da vez, muestra un toast de error sutil. Los logros se calcularán eventualmente (reconciliador o próxima partida)
- **D-11:** El backend loguea errores de evaluación pero nunca retorna 500 — retorna 200 con achievements_by_player vacío si hay error interno

### GET /players/{id}/achievements
- **D-12:** Retorna TODOS los logros (desbloqueados y bloqueados) con: `code`, `title`, `description`, `tier` (0 si bloqueado), `max_tier`, `icon`, `fallback_icon`, `unlocked` (bool), `unlocked_at` (null si bloqueado), `progress` ({current, target} o null)
- **D-13:** Progress se calcula on-demand — no se persiste. Requiere cargar games del jugador

### GET /achievements/catalog
- **D-14:** Un solo endpoint retorna todo: definiciones de logros + holders (qué jugadores tienen cada logro)
- **D-15:** Cada logro en el catálogo: `code`, `title`, `description`, `icon`, `fallback_icon`, `tiers[]` (con level, threshold, title), `holders[]` (con player_id, player_name, tier, unlocked_at)
- **D-16:** Frontend muestra lista de logros, al clickear uno expande/abre modal con holders

### Frontend type sync
- **D-17:** Tipos TypeScript se agregan manualmente a `frontend/src/types/index.ts` — mismo patrón que el resto del proyecto
- **D-18:** Nuevas interfaces: `AchievementUnlockedDTO`, `AchievementsByPlayerDTO`, `PlayerAchievementDTO`, `AchievementCatalogItemDTO`

### Claude's Discretion
- Estructura interna del AchievementsService (métodos, inyección de dependencias)
- Cómo cargar las games para evaluación (bulk vs lazy) — optimizar para evitar N+1
- Organización de archivos de DTOs/schemas (archivo nuevo vs agregar al existente)
- Mappers internos (domain → DTO)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Service layer (integration point)
- `backend/services/game_service.py` — GamesService.create_game() flow, validation, DI pattern
- `backend/services/achievement_evaluators/registry.py` — ALL_EVALUATORS registry to iterate
- `backend/services/achievement_evaluators/base.py` — AchievementEvaluator ABC (evaluate, compute_tier, get_progress)

### Repository layer
- `backend/repositories/achievement_repository.py` — upsert() and get_for_player()
- `backend/repositories/game_repository.py` — Repository pattern reference, session factory
- `backend/repositories/container.py` — DI container (singleton pattern)

### Route layer (pattern reference)
- `backend/routes/games_routes.py` — Existing POST /games/ endpoint, APIRouter pattern
- `backend/routes/players_routes.py` — Player routes pattern, profile endpoint

### Schemas/DTOs (pattern reference)
- `backend/schemas/game.py` — GameDTO, GameCreatedResponseDTO (NOT changing)
- `backend/schemas/player.py` — PlayerResultDTO and related schemas
- `backend/schemas/award.py` — AwardResultDTO pattern

### Mappers (pattern reference)
- `backend/mappers/game_mapper.py` — Bidirectional DTO ↔ model mapping pattern
- `backend/mappers/player_result_mapper.py` — Nested mapper pattern
- `backend/mappers/record_comparison_mapper.py` — Record comparison mapper (resolves player IDs)

### Domain models (Phase 1 output)
- `backend/models/achievement_tier.py` — AchievementTier dataclass
- `backend/models/achievement_definition.py` — AchievementDefinition dataclass
- `backend/models/evaluation_result.py` — EvaluationResult dataclass (new_tier, is_new, is_upgrade)
- `backend/models/achievement_progress.py` — Progress dataclass (current, target)

### Frontend types
- `frontend/src/types/index.ts` — All TypeScript interfaces (add new achievement types here)
- `frontend/src/api/games.ts` — createGame() API call
- `frontend/src/hooks/useGames.ts` — useGames hook (submitGame)
- `frontend/src/api/client.ts` — API client base

### Main app registration
- `backend/main.py` — FastAPI app, router includes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AchievementRepository.upsert()` — atomic tier upgrade, ready to use
- `AchievementRepository.get_for_player()` — returns PlayerAchievement ORM list
- `ALL_EVALUATORS` registry — iterate for evaluation
- `AchievementEvaluator.evaluate()` — returns EvaluationResult with is_new/is_upgrade
- `AchievementEvaluator.get_progress()` — returns Progress or None
- Container pattern in `container.py` — simple singleton instantiation

### Established Patterns
- Service layer: business logic + validation, raises ValueError
- Repository: session factory, ORM ↔ domain conversion
- Routes: APIRouter, response_model, HTTPException for errors
- DTOs: Pydantic BaseModel in schemas/
- Mappers: standalone functions, bidirectional
- DI: simple constructor injection, singletons in container.py

### Integration Points
- `backend/routes/games_routes.py` — add new endpoint POST /games/{id}/achievements
- `backend/routes/` — new achievements_routes.py for GET endpoints
- `backend/repositories/container.py` — add achievement_repository singleton
- `backend/schemas/` — new achievement.py for DTOs
- `backend/mappers/` — new achievement_mapper.py
- `backend/main.py` — register new router
- `frontend/src/types/index.ts` — add achievement interfaces
- `frontend/src/api/` — new achievements.ts or extend games.ts

</code_context>

<specifics>
## Specific Ideas

- El endpoint de evaluación es separado (POST /games/{id}/achievements), NO inline en POST /games/ — similar al patrón de records con GET /games/{id}/records
- El catálogo incluye holders para permitir click-to-expand en el frontend (Phase 3)
- Retry + toast es el patrón de error handling para el frontend

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-integraci-n-y-api*
*Context gathered: 2026-03-31*
