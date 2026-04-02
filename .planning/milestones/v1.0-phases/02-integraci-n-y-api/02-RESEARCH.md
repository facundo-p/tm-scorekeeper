# Phase 02: Integración y API - Research

**Researched:** 2026-03-31
**Domain:** FastAPI service layer integration, Pydantic DTOs, REST endpoints, TypeScript type sync
**Confidence:** HIGH

## Summary

Phase 2 connects the achievement evaluation engine (Phase 1) to the REST API surface. The implementation is fully within-project: no new external libraries are needed. All patterns — service layer, repository, route handlers, DTOs, mappers, and TypeScript types — have clear precedents in the existing codebase that must be followed exactly.

The key architectural decision (D-01 in CONTEXT.md) is that achievement evaluation runs as a SEPARATE endpoint `POST /games/{game_id}/achievements`, not inline in `POST /games/`. This matches the existing `GET /games/{game_id}/records` pattern. The frontend chains the two calls automatically; users perceive a single operation.

There are three distinct deliverables: (1) `AchievementsService` with bulk game loading and evaluation loop, (2) three new REST endpoints (`POST /games/{id}/achievements`, `GET /players/{id}/achievements`, `GET /achievements/catalog`), and (3) TypeScript interface additions to `frontend/src/types/index.ts`.

**Primary recommendation:** Follow the `games_routes.py` + `game_records_service.py` pattern for the evaluation endpoint. Follow `players_routes.py` + `player_profile_service.py` for the GET endpoints. All service dependencies go through `container.py`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** La evaluación de logros NO se ejecuta inline en POST /games/. Se hace en un endpoint separado: `POST /games/{game_id}/achievements`
- **D-02:** El frontend llama automáticamente a POST /games/{id}/achievements después de un POST /games/ exitoso. El usuario no percibe las 2 llamadas
- **D-03:** `GameCreatedResponseDTO` NO cambia — sigue siendo `{id, game}`. No hay breaking change
- **D-04:** El endpoint POST /games/{id}/achievements evalúa todos los evaluadores del registry para los jugadores de esa partida, persiste con upsert, y retorna los logros desbloqueados/mejorados
- **D-05:** Response agrupada por player: `achievements_by_player: { [player_id]: AchievementUnlockedDTO[] }`
- **D-06:** Solo aparecen players que desbloquearon/mejoraron algo. Players sin cambios se omiten
- **D-07:** Cada `AchievementUnlockedDTO` incluye: `code`, `title`, `tier`, `is_new`, `is_upgrade`, `icon`, `fallback_icon`
- **D-08:** Si un jugador cruza múltiples tiers en una partida, solo un item con el tier final (INTG-05)
- **D-09:** Si POST /games/{id}/achievements falla, el frontend hace 1 retry automático
- **D-10:** Si falla la 2da vez, muestra un toast de error sutil
- **D-11:** El backend loguea errores de evaluación pero nunca retorna 500 — retorna 200 con achievements_by_player vacío si hay error interno
- **D-12:** GET /players/{id}/achievements retorna TODOS los logros (desbloqueados y bloqueados) con: `code`, `title`, `description`, `tier` (0 si bloqueado), `max_tier`, `icon`, `fallback_icon`, `unlocked` (bool), `unlocked_at` (null si bloqueado), `progress` ({current, target} o null)
- **D-13:** Progress se calcula on-demand — no se persiste. Requiere cargar games del jugador
- **D-14:** Un solo endpoint retorna todo para el catálogo: definiciones de logros + holders
- **D-15:** Cada logro en el catálogo: `code`, `title`, `description`, `icon`, `fallback_icon`, `tiers[]` (con level, threshold, title), `holders[]` (con player_id, player_name, tier, unlocked_at)
- **D-16:** Frontend muestra lista de logros, al clickear uno expande/abre modal con holders
- **D-17:** Tipos TypeScript se agregan manualmente a `frontend/src/types/index.ts`
- **D-18:** Nuevas interfaces: `AchievementUnlockedDTO`, `AchievementsByPlayerDTO`, `PlayerAchievementDTO`, `AchievementCatalogItemDTO`

### Claude's Discretion

- Estructura interna del AchievementsService (métodos, inyección de dependencias)
- Cómo cargar las games para evaluación (bulk vs lazy) — optimizar para evitar N+1
- Organización de archivos de DTOs/schemas (archivo nuevo vs agregar al existente)
- Mappers internos (domain → DTO)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTG-01 | Evaluación de logros ejecutada post-commit en `create_game()` | CLARIFIED by D-01: evaluación ocurre en endpoint separado POST /games/{id}/achievements, no inline. Satisface el espíritu de INTG-01 (post-partida) con arquitectura desacoplada. |
| INTG-02 | Bulk-load de games antes del loop de evaluators (evitar N+1) | AchievementsService debe llamar `games_repository.get_games_by_player()` una vez por player, no por evaluador. Ver sección Architecture Patterns. |
| INTG-03 | Response de `POST /games/` incluye logros desbloqueados en esa partida | RECONCILED by D-01/D-02: la response viene del endpoint separado POST /games/{id}/achievements. GameCreatedResponseDTO no cambia (D-03). |
| INTG-04 | Notificación diferenciada: "Nuevo logro" (tier 1) vs "Logro mejorado" (tier 2+) | Campos `is_new` y `is_upgrade` en AchievementUnlockedDTO (D-07). EvaluationResult ya tiene estos flags. |
| INTG-05 | Un solo evento por logro con tier final (no uno por tier intermedio) | evaluate() en base.py ya retorna el tier computado final. El loop de evaluación persiste ese tier y genera un único DTO (D-08). |
| API-01 | `GET /players/{id}/achievements` retorna logros con tier, progreso, y estado | D-12 detalla el shape completo. AchievementsService computa progress on-demand con get_progress(). |
| API-02 | `GET /achievements/catalog` retorna catálogo global con quién tiene cada logro | D-14/D-15 detallan el shape. Requiere join entre ALL_EVALUATORS definitions y achievement_repository data. |
| API-03 | DTOs y mappers para achievements (domain → response) | schemas/achievement.py nuevo + mappers/achievement_mapper.py nuevo. Seguir patrón existente. |
</phase_requirements>

---

## Standard Stack

### Core (no new dependencies)

| Component | Pattern Source | Purpose |
|-----------|---------------|---------|
| FastAPI APIRouter | `backend/routes/games_routes.py` | Route handlers for new endpoints |
| Pydantic BaseModel | `backend/schemas/game.py` | DTOs for request/response shapes |
| SQLAlchemy session | `backend/repositories/game_repository.py` | DB access via context manager |
| Constructor DI | `backend/repositories/container.py` | Service instantiation as singletons |

### No new packages needed

All required infrastructure exists. The phase adds service logic, DTOs, mappers, and routes using only what's already installed.

**Verified package versions** (from existing codebase — no new installs required):
- FastAPI (already running)
- Pydantic v2 (already in use — BaseModel with Field())
- SQLAlchemy (already in use — postgres dialect with pg_insert)

## Architecture Patterns

### Recommended Project Structure (new files only)

```
backend/
├── schemas/
│   └── achievement.py          # NEW — AchievementUnlockedDTO, PlayerAchievementDTO, AchievementCatalogItemDTO, AchievementsByPlayerResponseDTO
├── mappers/
│   └── achievement_mapper.py   # NEW — domain/ORM → DTO mapping functions
├── services/
│   └── achievements_service.py # NEW — AchievementsService
├── routes/
│   ├── games_routes.py         # MODIFY — add POST /games/{id}/achievements endpoint
│   └── achievements_routes.py  # NEW — GET /players/{id}/achievements, GET /achievements/catalog
├── repositories/
│   └── container.py            # MODIFY — add achievement_repository singleton
└── main.py                     # MODIFY — register achievements_router

frontend/src/
├── types/
│   └── index.ts                # MODIFY — add 4 new interfaces
└── api/
    └── achievements.ts         # NEW — triggerAchievements(), getPlayerAchievements(), getCatalog()
```

### Pattern 1: Service with Bulk Load (avoids N+1)

The AchievementsService must load all games for each player once, then run all evaluators over that cached list. Do NOT call games_repository per evaluator per player.

```python
# Source: base.py evaluate() signature, game_repository.py get_games_by_player()
class AchievementsService:
    def __init__(self, games_repository, achievement_repository):
        self.games_repository = games_repository
        self.achievement_repository = achievement_repository

    def evaluate_for_game(self, game_id: str) -> dict[str, list]:
        """
        Returns achievements_by_player dict — only players with changes.
        Never raises: catches internally and returns empty dict on error.
        """
        try:
            game = self.games_repository.get(game_id)
            if game is None:
                return {}

            player_ids = [pr.player_id for pr in game.player_results]
            result = {}

            for player_id in player_ids:
                # BULK LOAD once per player, not per evaluator (INTG-02)
                games = self.games_repository.get_games_by_player(player_id)
                persisted = {a.code: a.tier for a in self.achievement_repository.get_for_player(player_id)}

                unlocked = []
                for evaluator in ALL_EVALUATORS:
                    current_tier = persisted.get(evaluator.code, 0)
                    eval_result = evaluator.evaluate(player_id, games, current_tier)
                    if eval_result.new_tier is not None:
                        self.achievement_repository.upsert(player_id, evaluator.code, eval_result.new_tier)
                        unlocked.append(...)  # build AchievementUnlockedDTO

                if unlocked:
                    result[player_id] = unlocked

            return result
        except Exception as e:
            import logging
            logging.error(f"Achievement evaluation failed for game {game_id}: {e}")
            return {}
```

**Why this structure:**
- Single session-per-player for game loading (no N+1)
- Never propagates exceptions (D-11)
- Returns only players with changes (D-06)

### Pattern 2: Route Handler in games_routes.py

Following the `GET /games/{game_id}/records` pattern exactly — new endpoint added to existing games router:

```python
# Source: backend/routes/games_routes.py (records endpoint pattern)
@router.post("/{game_id}/achievements", response_model=AchievementsByPlayerResponseDTO)
def trigger_achievements(game_id: str):
    # No 500s — service catches all exceptions internally
    result = achievements_service.evaluate_for_game(game_id)
    return AchievementsByPlayerResponseDTO(achievements_by_player=result)
```

The service singleton goes at module level in games_routes.py (same as `games_service = GamesService(...)`).

### Pattern 3: GET endpoints in new achievements_routes.py

Follows `players_routes.py` pattern — APIRouter with prefix, module-level service singletons:

```python
# Source: backend/routes/players_routes.py
router = APIRouter(prefix="/achievements", tags=["Achievements"])
achievements_service = AchievementsService(
    games_repository=games_repository,
    achievement_repository=achievement_repository,
)

@router.get("/catalog", response_model=AchievementCatalogResponseDTO)
def get_catalog():
    return achievements_service.get_catalog()
```

Note: `GET /players/{id}/achievements` belongs in `players_routes.py` (prefix is already `/players`) OR in a new `achievements_routes.py` with a sub-path. Given the prefix conflict, the cleanest approach is adding it to `players_routes.py` to avoid a confusing prefix on achievements_routes.

### Pattern 4: DTO shapes

All DTOs are Pydantic BaseModel in `backend/schemas/achievement.py`:

```python
# Source: backend/schemas/game.py pattern
from pydantic import BaseModel
from datetime import date

class AchievementUnlockedDTO(BaseModel):
    code: str
    title: str           # from AchievementTier.title at new_tier level
    tier: int
    is_new: bool
    is_upgrade: bool
    icon: str | None
    fallback_icon: str

class AchievementsByPlayerResponseDTO(BaseModel):
    achievements_by_player: dict[str, list[AchievementUnlockedDTO]]

class ProgressDTO(BaseModel):
    current: int
    target: int

class PlayerAchievementDTO(BaseModel):
    code: str
    title: str           # from AchievementDefinition (top-level title derived from highest tier)
    description: str
    tier: int            # 0 if locked
    max_tier: int
    icon: str | None
    fallback_icon: str
    unlocked: bool
    unlocked_at: date | None
    progress: ProgressDTO | None

class AchievementTierInfoDTO(BaseModel):
    level: int
    threshold: int
    title: str

class HolderDTO(BaseModel):
    player_id: str
    player_name: str
    tier: int
    unlocked_at: date

class AchievementCatalogItemDTO(BaseModel):
    code: str
    title: str           # from AchievementDefinition (or highest tier title)
    description: str
    icon: str | None
    fallback_icon: str
    tiers: list[AchievementTierInfoDTO]
    holders: list[HolderDTO]

class AchievementCatalogResponseDTO(BaseModel):
    achievements: list[AchievementCatalogItemDTO]
```

### Pattern 5: Frontend API client

Following `frontend/src/api/games.ts` pattern:

```typescript
// Source: frontend/src/api/games.ts
import { api } from './client'
import type { AchievementsByPlayerDTO, PlayerAchievementDTO, AchievementCatalogItemDTO } from '@/types'

export function triggerAchievements(gameId: string): Promise<AchievementsByPlayerDTO> {
  return api.post<AchievementsByPlayerDTO>(`/games/${gameId}/achievements`, {})
}

export function getPlayerAchievements(playerId: string): Promise<PlayerAchievementDTO[]> {
  return api.get<PlayerAchievementDTO[]>(`/players/${playerId}/achievements`)
}

export function getAchievementsCatalog(): Promise<AchievementCatalogItemDTO[]> {
  return api.get<AchievementCatalogItemDTO[]>('/achievements/catalog')
}
```

The `triggerAchievements` call belongs in `useGames.ts` — called automatically after `createGame()` succeeds. Retry logic (D-09) lives in the hook.

### Anti-Patterns to Avoid

- **Inline evaluation in create_game():** User explicitly locked D-01 — do not touch `GamesService.create_game()`.
- **N+1 game loading:** Do not call `get_games_by_player()` inside the evaluator loop. Load once per player before iterating evaluators.
- **Raising 500 from achievement endpoint:** Service must catch all exceptions internally (D-11). Route handler never wraps in HTTPException.
- **Changing GameCreatedResponseDTO:** D-03 is locked — no shape changes to this DTO.
- **Persisting progress:** D-13 — progress is computed on-demand via `evaluator.get_progress()`, never stored in DB.
- **One event per tier crossed:** D-08 — `evaluate()` in base.py already returns the final computed tier. Do not loop over intermediate tiers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic tier upsert | Custom SQL | `AchievementRepository.upsert()` | Already implements ON CONFLICT DO UPDATE with WHERE tier < excluded.tier |
| Tier computation | Custom comparison logic | `AchievementEvaluator.evaluate()` | ABC method handles persisted vs computed comparison, returns EvaluationResult |
| Progress computation | Custom progress tracking | `AchievementEvaluator.get_progress()` | Evaluators implement per-type progress logic |
| Evaluator iteration | Custom registry | `ALL_EVALUATORS` from registry.py | Centralized list, already instantiated with correct lambdas |
| Session management | Manual session open/close | `with self._session_factory() as session:` | Context manager handles commit/rollback |

**Key insight:** Phase 1 built all the domain machinery. Phase 2 is glue code — its value is in correct orchestration, not new algorithms.

## Common Pitfalls

### Pitfall 1: AchievementRepository.get_for_player() returns ORM objects, not domain models

**What goes wrong:** `get_for_player()` returns `list[PlayerAchievement]` (ORM) with `.code` and `.tier` attributes — not domain model objects. Code that expects domain models will fail.
**Why it happens:** The repository returns raw ORM rows because no domain model for persisted achievement was built in Phase 1 (only `EvaluationResult`, `AchievementDefinition`, etc. are domain models).
**How to avoid:** Access `.code`, `.tier`, `.unlocked_at` directly on ORM objects. Build the dict: `{a.code: a.tier for a in self.achievement_repository.get_for_player(player_id)}`.
**Warning signs:** AttributeError on `.code` from a non-ORM object.

### Pitfall 2: AchievementDefinition has no "title" field — title comes from tiers

**What goes wrong:** Building `PlayerAchievementDTO.title` from `definition.title` fails because `AchievementDefinition` has no `title` field. It has `description`, `code`, `icon`, `fallback_icon`, `tiers`, `show_progress`.
**Why it happens:** Titles are per-tier (`AchievementTier.title`). The "overall" title for a locked achievement needs a convention.
**How to avoid:** For `PlayerAchievementDTO.title`, use the first tier's title (tier level=1) as the canonical achievement name, or use the highest tier unlocked. Document the convention in the mapper. Confirmed from definitions.py: `HIGH_SCORE.tiers[0].title = "Colono"`.

### Pitfall 3: D-13 progress requires loading ALL player games, not just the new game

**What goes wrong:** Computing progress for `GET /players/{id}/achievements` with only the most recent game gives wrong values.
**Why it happens:** AccumulatedEvaluator and WinStreakEvaluator need the full game history.
**How to avoid:** `AchievementsService.get_player_achievements()` must call `games_repository.get_games_by_player(player_id)` to get the full history, then call `evaluator.get_progress(player_id, all_games, current_tier)`.

### Pitfall 4: Catalog endpoint requires player names, but AchievementRepository only stores player_id

**What goes wrong:** `HolderDTO` needs `player_name` but `player_achievements` table only has `player_id`.
**Why it happens:** The achievement schema normalizes on player_id as FK.
**How to avoid:** `AchievementsService.get_catalog()` must also inject `players_repository` to resolve names. Constructor: `AchievementsService(games_repository, achievement_repository, players_repository)`.

### Pitfall 5: Container.py has no achievement_repository

**What goes wrong:** Importing `achievement_repository` from `container.py` fails — it's not there yet.
**Why it happens:** Repository was built in Phase 1 but never added to the DI container.
**How to avoid:** First task of Phase 2 must add `from repositories.achievement_repository import AchievementRepository` and `achievement_repository = AchievementRepository()` to `container.py`.

### Pitfall 6: Frontend retry logic must not re-POST the game

**What goes wrong:** A naive "retry on error" in useGames re-submits the entire game, creating duplicates.
**Why it happens:** D-09 says retry POST /games/{id}/achievements — the achievement endpoint only, not createGame().
**How to avoid:** Store `game_id` from the first successful `createGame()` response. Retry only `triggerAchievements(gameId)`.

### Pitfall 7: GET /players/{id}/achievements route conflicts with existing players routes

**What goes wrong:** If placed in `achievements_routes.py` with prefix `/achievements`, the URL becomes `/achievements/players/{id}/achievements`.
**Why it happens:** FastAPI prefix is prepended automatically.
**How to avoid:** Add `GET /players/{id}/achievements` to `players_routes.py` (which already has prefix `/players`). Only `GET /achievements/catalog` goes in `achievements_routes.py`.

## Code Examples

### Evaluator loop with bulk load (INTG-02 pattern)

```python
# Correct: load games once per player, then iterate evaluators
games = self.games_repository.get_games_by_player(player_id)
persisted = {a.code: a.tier for a in self.achievement_repository.get_for_player(player_id)}

for evaluator in ALL_EVALUATORS:
    current_tier = persisted.get(evaluator.code, 0)
    result = evaluator.evaluate(player_id, games, current_tier)
    if result.new_tier is not None:
        # persist + build DTO
```

### Never-500 pattern (D-11)

```python
# Source: pattern from D-11 decision
def evaluate_for_game(self, game_id: str) -> dict:
    try:
        ...  # full evaluation logic
    except Exception as e:
        import logging
        logging.error(f"Achievement evaluation error for game {game_id}: {e}")
        return {}
```

### Frontend retry (D-09 pattern)

```typescript
// Source: useGames.ts pattern + D-09
const triggerWithRetry = async (gameId: string) => {
  try {
    return await triggerAchievements(gameId)
  } catch {
    // one retry
    try {
      return await triggerAchievements(gameId)
    } catch {
      // D-10: show subtle toast, return null
      showToast('No se pudieron cargar los logros')
      return null
    }
  }
}
```

### PlayerAchievementDTO construction (GET /players/{id}/achievements)

```python
# Source: base.py get_progress() + definitions.py structure
def _build_player_achievement_dto(
    evaluator: AchievementEvaluator,
    persisted_tier: int,
    unlocked_at: date | None,
    games: list[Game],
) -> PlayerAchievementDTO:
    definition = evaluator.definition
    max_tier = max(t.level for t in definition.tiers)
    progress = None
    if definition.show_progress:
        p = evaluator.get_progress(player_id, games, persisted_tier)
        if p:
            progress = ProgressDTO(current=p.current, target=p.target)

    return PlayerAchievementDTO(
        code=definition.code,
        title=definition.tiers[0].title,   # tier 1 title as canonical name
        description=definition.description,
        tier=persisted_tier,
        max_tier=max_tier,
        icon=definition.icon,
        fallback_icon=definition.fallback_icon,
        unlocked=(persisted_tier > 0),
        unlocked_at=unlocked_at,
        progress=progress,
    )
```

## State of the Art

| Component | Status in this Project | Notes |
|-----------|----------------------|-------|
| Achievement evaluation | Phase 1 complete | ALL_EVALUATORS, upsert(), evaluate() all ready |
| Achievement persistence | Phase 1 complete | player_achievements table, AchievementRepository ready |
| API endpoints | Phase 2 to build | No achievement routes exist yet |
| container.py | Needs achievement_repository | Currently only games + players |
| TypeScript types | Needs 4 new interfaces | index.ts has no achievement types |
| Frontend API client | Needs achievements.ts | No achievement API calls exist |

## Open Questions

1. **Canonical "title" for an achievement in locked state**
   - What we know: AchievementDefinition has no `title` field — only tiers have titles
   - What's unclear: Should `PlayerAchievementDTO.title` use tier-1 title (e.g., "Colono") or some other value?
   - Recommendation: Use `definition.tiers[0].title` as canonical — it's the entry-level name that represents the achievement. Document in mapper comment.

2. **AchievementsByPlayerResponseDTO shape: dict key type**
   - What we know: D-05 specifies `{ [player_id]: AchievementUnlockedDTO[] }` — player_id is str
   - What's unclear: Pydantic dict[str, list[AchievementUnlockedDTO]] serializes correctly, but key naming in JSON is player_id string (UUID format)
   - Recommendation: Use `dict[str, list[AchievementUnlockedDTO]]` in Pydantic — FastAPI serializes it correctly.

3. **AchievementsService placement for GET /players/{id}/achievements**
   - What we know: The route belongs in players_routes.py but the service is AchievementsService (not PlayerService)
   - What's unclear: Should players_routes.py import AchievementsService, or should PlayerProfileService gain achievement awareness?
   - Recommendation: Import AchievementsService directly in players_routes.py — same module-level pattern used for `player_records_service` in players_routes.py. No need to extend PlayerProfileService.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest (via Docker) |
| Config file | conftest.py in backend/tests/ |
| Quick run command | `docker compose -f docker-compose.test.yml run --rm --build backend_test sh -c "alembic upgrade head && python -m pytest tests/test_achievements_service.py -q"` |
| Full suite command | `make test-backend` |

**CRITICAL:** Never run pytest on host. Always use Docker. See `.claude/skills/test-backend/SKILL.md`.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTG-01 | evaluate_for_game() triggered post game creation | integration | `pytest tests/test_achievements_service.py::test_evaluate_for_game_basic -x` | Wave 0 |
| INTG-02 | Games loaded once per player, not per evaluator | unit | `pytest tests/test_achievements_service.py::test_no_n_plus_1 -x` | Wave 0 |
| INTG-03 | POST /games/{id}/achievements returns achievements_by_player | integration | `pytest tests/integration/test_achievements_routes.py -x` | Wave 0 |
| INTG-04 | is_new=True for tier-1 unlock, is_upgrade=True for tier-2+ | unit | `pytest tests/test_achievements_service.py::test_is_new_vs_is_upgrade -x` | Wave 0 |
| INTG-05 | Multiple tier crossings → single item with final tier | unit | `pytest tests/test_achievements_service.py::test_multi_tier_single_item -x` | Wave 0 |
| API-01 | GET /players/{id}/achievements returns all achievements including locked | integration | `pytest tests/integration/test_achievements_routes.py::test_get_player_achievements -x` | Wave 0 |
| API-02 | GET /achievements/catalog returns all definitions with holders | integration | `pytest tests/integration/test_achievements_routes.py::test_get_catalog -x` | Wave 0 |
| API-03 | DTOs serialize correctly (no missing fields, correct types) | unit | `pytest tests/test_achievement_schemas.py -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `docker compose -f docker-compose.test.yml run --rm --build backend_test sh -c "alembic upgrade head && python -m pytest tests/test_achievements_service.py -q"`
- **Per wave merge:** `make test-backend`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/test_achievements_service.py` — unit tests for AchievementsService evaluation logic
- [ ] `backend/tests/test_achievement_schemas.py` — DTO field validation tests
- [ ] `backend/tests/integration/test_achievements_routes.py` — HTTP-level endpoint tests

*(Existing `test_achievement_repository.py` and `test_achievement_evaluators.py` from Phase 1 already cover the underlying infrastructure.)*

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection — all patterns verified against actual source files
  - `backend/services/game_service.py` — GamesService constructor, validation, create_game flow
  - `backend/repositories/container.py` — DI container pattern (singleton instantiation)
  - `backend/routes/games_routes.py` — APIRouter, response_model, HTTPException, records endpoint pattern
  - `backend/routes/players_routes.py` — Module-level service singletons, multiple services in one router
  - `backend/schemas/game.py` — Pydantic BaseModel pattern, GameCreatedResponseDTO (NOT changing)
  - `backend/repositories/achievement_repository.py` — upsert() atomicity, get_for_player() ORM return type
  - `backend/services/achievement_evaluators/base.py` — evaluate() return signature, get_progress() signature
  - `backend/services/achievement_evaluators/registry.py` — ALL_EVALUATORS list, lambda patterns
  - `backend/services/achievement_evaluators/definitions.py` — AchievementDefinition structure (no title field!)
  - `backend/models/evaluation_result.py` — EvaluationResult fields
  - `backend/models/achievement_definition.py` — AchievementDefinition fields (no title)
  - `backend/models/achievement_tier.py` — AchievementTier fields (level, threshold, title)
  - `frontend/src/types/index.ts` — Existing interface patterns, where to add new types
  - `frontend/src/api/games.ts` — API function patterns for achievements.ts
  - `frontend/src/api/client.ts` — api.post() and api.get() pattern with generic type param
  - `frontend/src/hooks/useGames.ts` — Hook pattern, where retry logic goes
  - `backend/main.py` — Router registration pattern
  - `.planning/phases/02-integraci-n-y-api/02-CONTEXT.md` — All locked decisions

### Secondary (MEDIUM confidence)

- CLAUDE.md project rules — coding conventions (functional React, no inline styles, hooks pattern)
- `.claude/skills/new-endpoint/SKILL.md` — Full scaffold checklist for new endpoints
- `.claude/skills/test-backend/SKILL.md` — Docker test execution (NEVER run pytest on host)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new packages, all patterns verified from source
- Architecture: HIGH — patterns confirmed from existing routes, services, and repositories
- Pitfalls: HIGH — identified from actual code structure (AchievementDefinition no title field, container.py missing repo, route prefix conflict)
- Frontend patterns: HIGH — verified from existing hooks and API client

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable codebase, all findings from direct file inspection)
