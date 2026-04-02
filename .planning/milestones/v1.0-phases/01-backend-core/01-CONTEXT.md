# Phase 1: Backend Core - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Tabla DB, repositorio con upsert atómico, modelos de dominio (AchievementDefinition, AchievementTier), evaluadores (ABC + genéricos + custom), definiciones concretas de logros, y registry centralizado. Todo backend, sin API ni frontend.

</domain>

<decisions>
## Implementation Decisions

### Estructura de datos
- **D-01:** Cada logro se define con `AchievementDefinition` (code, description, icon, fallback_icon, tiers, show_progress)
- **D-02:** Cada tier se define con `AchievementTier` (level, threshold, title)
- **D-03:** Las definiciones viven en código, no en DB. La DB solo persiste desbloqueos.

### Evaluadores
- **D-04:** Clase base abstracta `AchievementEvaluator` con `compute_tier()`, `get_progress()`, `evaluate()`
- **D-05:** `SingleGameThresholdEvaluator` — genérico con extractor lambda para single-game thresholds
- **D-06:** `AccumulatedEvaluator` — genérico con counter lambda, incluye `get_progress()` con current/target
- **D-07:** `WinStreakEvaluator` — custom, calcula racha máxima y racha actual para progreso
- **D-08:** `AllMapsEvaluator` — custom, evalúa mapas únicos jugados contra `MapName` enum existente
- **D-09:** Registry `ALL_EVALUATORS` centraliza todas las instancias, análogo a `ALL_CALCULATORS` de records

### Persistencia
- **D-10:** Tabla `player_achievements`: id (serial PK), player_id (FK), code (varchar), tier (int), unlocked_at (date), con UniqueConstraint(player_id, code)
- **D-11:** Upsert atómico con `ON CONFLICT DO UPDATE` y condición `WHERE tier < excluded.tier` — tiers nunca bajan
- **D-12:** Relationship en modelo Player hacia achievements (`back_populates`)
- **D-13:** Migración Alembic para crear la tabla

### Catálogo inicial de logros
- **D-14:** Incluir al menos: high_score (single-game, 5 tiers), games_played (acumulado, 5 tiers), games_won (acumulado, tiers TBD), win_streak (combinación, 3 tiers), all_maps (combinación, binario o con tiers por cantidad)
- **D-15:** Los umbrales exactos de tiers se calibrarán revisando datos reales de partidas existentes durante la implementación

### Ubicación en código
- **D-16:** Evaluadores en `backend/services/achievement_evaluators/` — paralelo a `backend/services/record_calculators/`
- **D-17:** Misma estructura: `base.py` (ABC), archivos por evaluador, `registry.py`, factory si aplica
- **D-18:** Modelos de dominio en `backend/models/` (achievement_definition.py, achievement_tier.py, etc.)
- **D-19:** ORM model en `backend/db/models.py` (PlayerAchievement)
- **D-20:** Repository en `backend/repositories/achievement_repository.py`

### Testing
- **D-21:** Unit tests por evaluador (compute_tier con distintos sets de games)
- **D-22:** Test de upsert no-downgrade (intentar bajar tier, verificar que no cambia)
- **D-23:** Test de registry completeness (todos los evaluadores registrados y con code único)

### Claude's Discretion
- Umbrales exactos de tiers para games_won y all_maps — calibrar con datos si hay partidas existentes
- Decisión de si AllMaps tiene tiers (ej: 2/5 mapas, 3/5, 5/5) o es binario (todos o nada) — elegir lo que sea más coherente con el patrón

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Records pattern (referencia principal)
- `backend/services/record_calculators/base.py` — ABC base del strategy pattern, compute y evaluate
- `backend/services/record_calculators/registry.py` — Registry ALL_CALCULATORS, patrón a replicar
- `backend/services/record_calculators/max_score_calculator.py` — Factory pattern con lambda extractors
- `backend/services/record_calculators/most_games_played.py` — Evaluador acumulativo, referencia para AccumulatedEvaluator
- `backend/services/record_calculators/most_games_won.py` — Otro acumulativo con override de games_for_current()
- `backend/services/record_calculators/highest_single_game_score.py` — Single game, referencia para SingleGameThresholdEvaluator

### Modelos existentes
- `backend/models/record_entry.py` — RecordEntry dataclass, referencia de estructura
- `backend/models/record_comparison.py` — RecordComparison dataclass
- `backend/models/enums.py` — MapName enum (necesario para AllMapsEvaluator)
- `backend/models/game.py` — Game domain model (input a evaluadores)

### DB y persistencia
- `backend/db/models.py` — ORM models existentes (Player, Game, PlayerResult, Award)
- `backend/db/session.py` — SessionLocal factory
- `backend/repositories/game_repository.py` — Repository pattern existente, referencia

### Implementación de referencia
- `.planning/PROJECT.md` §"Referencia de implementación (código ejemplo)" — Código completo de ejemplo acordado durante la inicialización

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RecordCalculator` pattern: ABC con calculate/evaluate, replicable directamente para AchievementEvaluator
- `MaxScoreCalculator` factory: patrón de lambda extractors, reusable para SingleGameThresholdEvaluator
- `ALL_CALCULATORS` registry: mismo patrón para ALL_EVALUATORS
- `MapName` enum: lista completa de mapas para AllMapsEvaluator

### Established Patterns
- Repository pattern: clase con métodos CRUD, recibe session, traduce ORM ↔ domain
- Mapper pattern: funciones dto_to_model / model_to_dto
- Domain models: dataclasses puras en `backend/models/`
- ORM models: SQLAlchemy declarative en `backend/db/models.py`
- Tests: pytest en `backend/tests/`

### Integration Points
- `backend/db/models.py`: agregar PlayerAchievement y relationship en Player
- `backend/models/`: nuevos archivos para AchievementDefinition, AchievementTier
- `backend/services/achievement_evaluators/`: nuevo directorio paralelo a record_calculators
- `backend/repositories/`: nuevo AchievementRepository
- Alembic: nueva migración para la tabla

</code_context>

<specifics>
## Specific Ideas

- El código de ejemplo en PROJECT.md fue revisado y aprobado como referencia de implementación
- Los nombres de tiers deben tener flavor de Terraforming Mars (ej: "Colono", "Joven Promesa", "Gran Terraformador", "Leyenda de Marte", "Emperador de Marte")
- El patrón debe ser tan extensible como el de records: agregar un nuevo logro = crear evaluador + registrar en registry

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-backend-core*
*Context gathered: 2026-03-31*
