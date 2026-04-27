# Phase 4: Reconciliador - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Herramienta backend que recalcula todos los logros para todos los jugadores y corrige discrepancias sin bajar ningún tier. Usable como backfill al agregar nuevos logros.

</domain>

<decisions>
## Implementation Decisions

### Trigger Mechanism
- **D-01:** Un solo endpoint `POST /achievements/reconcile` — sin script CLI separado
- **D-02:** El endpoint retorna un resumen JSON con los cambios aplicados

### Execution Strategy
- **D-03:** Procesamiento secuencial de todos los jugadores (grupo pequeño, no requiere batching)
- **D-04:** Sin modo dry-run — se ejecuta y aplica directamente, los cambios se loguean
- **D-05:** Errores por jugador se loguean y se saltan (no abortar por un fallo individual)

### No-Downgrade Guarantee
- **D-06:** La garantía ya existe en `achievement_repository.upsert()` (ON CONFLICT con WHERE). El reconciliador la reutiliza, pero debe loguear cuando un tier calculado es menor al persistido (para visibilidad)

### Claude's Discretion
- Estructura interna del método `reconcile_all()` (puede vivir en `AchievementsService` o clase separada)
- Formato exacto del response JSON del summary
- Nivel de logging (info vs debug para cada evaluación)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Achievements System
- `backend/services/achievements_service.py` — Service con `evaluate_for_game()` como patrón a seguir
- `backend/services/achievement_evaluators/registry.py` — `ALL_EVALUATORS` registry
- `backend/services/achievement_evaluators/base.py` — Base evaluator con `evaluate()`, `get_progress()`
- `backend/repositories/achievement_repository.py` — `upsert()` con garantía no-downgrade

### Routes
- `backend/routes/achievements_routes.py` — Existing achievement routes pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AchievementsService.evaluate_for_game()` — Pattern for evaluating all evaluators against a player's games
- `achievement_repository.upsert()` — Already guarantees no tier downgrade via ON CONFLICT DO UPDATE WHERE
- `ALL_EVALUATORS` — Registry of all achievement evaluators
- `games_repository.get_games_by_player()` — Bulk-loads games per player
- `players_repository.get_all()` — Gets all players for iteration

### Established Patterns
- Service + Repository + Route layering (same as Phase 1-2)
- Dependency injection via container

### Integration Points
- New method in `AchievementsService` (or new service class)
- New route in `achievements_routes.py`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward tool following established patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-reconciliador*
*Context gathered: 2026-04-01*
