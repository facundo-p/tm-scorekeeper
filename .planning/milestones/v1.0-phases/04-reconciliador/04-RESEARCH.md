# Phase 4: Reconciliador - Research

**Researched:** 2026-04-01
**Domain:** Backend service — achievements reconciliation tool
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Un solo endpoint `POST /achievements/reconcile` — sin script CLI separado
- **D-02:** El endpoint retorna un resumen JSON con los cambios aplicados
- **D-03:** Procesamiento secuencial de todos los jugadores (grupo pequeño, no requiere batching)
- **D-04:** Sin modo dry-run — se ejecuta y aplica directamente, los cambios se loguean
- **D-05:** Errores por jugador se loguean y se saltan (no abortar por un fallo individual)
- **D-06:** La garantía ya existe en `achievement_repository.upsert()` (ON CONFLICT con WHERE). El reconciliador la reutiliza, pero debe loguear cuando un tier calculado es menor al persistido (para visibilidad)

### Claude's Discretion

- Estructura interna del método `reconcile_all()` (puede vivir en `AchievementsService` o clase separada)
- Formato exacto del response JSON del summary
- Nivel de logging (info vs debug para cada evaluación)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOOL-01 | Script/endpoint de reconciliación que recalcula todos los logros y corrige discrepancias | `POST /achievements/reconcile` iterable sobre `players_repository.get_all()` + `ALL_EVALUATORS` + `achievement_repository.upsert()` |
| TOOL-02 | Reconciliador nunca baja tiers (garantía de permanencia) | `upsert()` ya implementa `ON CONFLICT DO UPDATE WHERE tier < excluded.tier`; reconciliador debe detectar y loguear el caso de downgrade intento |
| TOOL-03 | Script usable como backfill al agregar nuevos logros | El mismo endpoint sirve: procesa todos los jugadores con todos los evaluadores actuales, corrigiendo ausencias |
</phase_requirements>

---

## Summary

El reconciliador es una herramienta backend que recalcula el estado correcto de todos los logros para todos los jugadores y aplica correcciones hacia arriba. Es la pieza que permite backfill cuando se agregan nuevos logros al sistema, o cuando un bug previo causó que se persistiera un tier incorrecto (hacia abajo).

El codebase ya tiene todos los bloques necesarios: `players_repository.get_all()` para iterar jugadores, `games_repository.get_games_by_player()` para cargar partidas, `ALL_EVALUATORS` para evaluar, y `achievement_repository.upsert()` con la garantía no-downgrade a nivel DB. El reconciliador solo necesita orquestar esos bloques en un nuevo método y exponerlos vía endpoint.

La no-downgrade guarantee ya está en el upsert a nivel PostgreSQL (ON CONFLICT DO UPDATE WHERE tier < excluded.tier). El reconciliador debe adicionalmente detectar el caso y loguearlo para visibilidad, pero no necesita lógica extra para prevenirlo — la DB lo maneja atómicamente.

**Primary recommendation:** Agregar método `reconcile_all()` a `AchievementsService` (no clase separada — sigue el patrón existente), agregar route `POST /achievements/reconcile` en `achievements_routes.py`, y definir `ReconcileResponseDTO` en `schemas/achievement.py`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | already in project | HTTP endpoint | Patrón establecido en todas las rutas |
| SQLAlchemy | already in project | DB access via repos | Usado en todos los repositories |
| Pydantic V2 | already in project | Response DTO | `BaseModel` para todos los schemas |
| pytest + unittest.mock | already in project | Tests unitarios | Patrón en `test_achievements_service.py` |
| FastAPI TestClient | already in project | Tests de integración | Patrón en `test_achievements_routes.py` |

No se necesitan dependencias nuevas. Este phase es 100% composición de código ya existente.

**Installation:** N/A — no new packages required.

---

## Architecture Patterns

### Recommended Structure

El reconciliador vive completamente dentro de los módulos existentes:

```
backend/
├── services/
│   └── achievements_service.py       # agregar reconcile_all()
├── schemas/
│   └── achievement.py                # agregar ReconcileResponseDTO, PlayerReconcileSummaryDTO
├── routes/
│   └── achievements_routes.py        # agregar POST /achievements/reconcile
└── tests/
    ├── test_achievements_service.py  # agregar TestReconcileAll class
    └── integration/
        └── test_achievements_routes.py  # agregar test_reconcile_endpoint
```

No se crean archivos nuevos en la capa de service/route/schema — se extienden los existentes.

### Pattern 1: reconcile_all() en AchievementsService

**What:** Nuevo método público que itera todos los jugadores, evalúa todos los evaluadores, aplica upserts, y retorna un resumen de cambios aplicados.
**When to use:** Llamado exclusivamente por el endpoint `POST /achievements/reconcile`.

```python
# Source: composición de evaluate_for_game() existente, adaptada
def reconcile_all(self) -> ReconcileSummaryResult:
    """
    Recalculate achievements for all players and apply corrections upward.
    Never raises — per-player errors are logged and skipped.
    Returns summary of changes applied.
    """
    players = self.players_repository.get_all()
    total_players = len(players)
    players_updated = 0
    achievements_applied: list[PlayerReconcileChange] = []
    errors: list[str] = []

    for player in players:
        try:
            games = self.games_repository.get_games_by_player(player.player_id)
            persisted = {
                a.code: a.tier
                for a in self.achievement_repository.get_for_player(player.player_id)
            }

            player_changes = []
            for evaluator in ALL_EVALUATORS:
                current_tier = persisted.get(evaluator.code, 0)
                computed = evaluator.compute_tier(player.player_id, games)

                if computed < current_tier:
                    # No-downgrade: log and skip (D-06)
                    logger.info(
                        "Reconciler skipping downgrade: player=%s code=%s "
                        "computed=%d persisted=%d",
                        player.player_id, evaluator.code, computed, current_tier,
                    )
                    continue

                if computed > current_tier:
                    self.achievement_repository.upsert(
                        player.player_id, evaluator.code, computed
                    )
                    player_changes.append(
                        PlayerReconcileChange(
                            code=evaluator.code,
                            old_tier=current_tier,
                            new_tier=computed,
                        )
                    )

            if player_changes:
                players_updated += 1
                achievements_applied.extend(player_changes)

        except Exception:
            logger.exception("Reconciler error for player %s", player.player_id)
            errors.append(player.player_id)

    return ReconcileSummaryResult(
        total_players=total_players,
        players_updated=players_updated,
        achievements_applied=achievements_applied,
        errors=errors,
    )
```

**Key difference vs `evaluate_for_game()`:** Aquí se llama `compute_tier()` directamente (no `evaluator.evaluate()`) para poder detectar el intento de downgrade antes de llamar upsert, y loguearlo explícitamente.

### Pattern 2: ReconcileResponseDTO

**What:** Schema Pydantic para el response del endpoint.

```python
# Source: schemas/achievement.py — patrón BaseModel existente

class PlayerReconcileChangeDTO(BaseModel):
    code: str
    old_tier: int
    new_tier: int


class ReconcileResponseDTO(BaseModel):
    total_players: int
    players_updated: int
    achievements_applied: list[PlayerReconcileChangeDTO]
    errors: list[str]   # player_ids que fallaron
```

### Pattern 3: Route POST /achievements/reconcile

**What:** Nuevo endpoint en `achievements_routes.py`.

```python
# Source: achievements_routes.py — patrón router existente

@router.post("/reconcile", response_model=ReconcileResponseDTO)
def reconcile_achievements():
    summary = achievements_service.reconcile_all()
    return ReconcileResponseDTO(
        total_players=summary.total_players,
        players_updated=summary.players_updated,
        achievements_applied=[
            PlayerReconcileChangeDTO(
                code=c.code,
                old_tier=c.old_tier,
                new_tier=c.new_tier,
            )
            for c in summary.achievements_applied
        ],
        errors=summary.errors,
    )
```

### Anti-Patterns to Avoid

- **Reimplementar la garantía no-downgrade:** `upsert()` ya la tiene a nivel DB. No agregar WHERE condicional antes del upsert; solo loguear y continuar al siguiente evaluador cuando `computed < current_tier`.
- **Usar `evaluator.evaluate()` con `persisted_tier` para detectar downgrade:** `evaluate()` retorna `new_tier=None` tanto cuando no hay cambio como cuando sería downgrade — son casos distintos para el reconciliador. Usar `compute_tier()` directamente para obtener el valor real calculado.
- **Compartir la lógica de "solo si sube" con evaluate_for_game:** El reconciliador necesita detectar explícitamente el caso de downgrade para loguearlo. El flujo debe ser: compute → compare → log-if-down → upsert-if-up.
- **Crear una clase separada Reconciler:** La funcionalidad es una extensión natural de `AchievementsService`. Una clase separada solo agrega complejidad de DI sin beneficio claro dado el tamaño del grupo de jugadores.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| No-downgrade en DB | Verificación Python pre-upsert | `upsert()` con `ON CONFLICT DO UPDATE WHERE tier < excluded.tier` | Atómico, ya probado, race-condition-safe |
| Iteración de todos los jugadores | Query manual | `players_repository.get_all()` | Ya existe, testeable |
| Carga de partidas por jugador | Query directa | `games_repository.get_games_by_player()` | Ya existe, evita N+1 |
| Evaluación de logros | Lógica nueva | `evaluator.compute_tier()` del registry | Misma lógica que en el flujo post-game |

---

## Common Pitfalls

### Pitfall 1: Usar evaluate() vs compute_tier() para detectar downgrade

**What goes wrong:** `evaluator.evaluate(player_id, games, persisted_tier)` retorna `EvaluationResult(new_tier=None)` cuando `computed <= persisted_tier`. Esto colapsa dos casos distintos: "sin cambio" y "downgrade intento". El reconciliador necesita distinguirlos.
**Why it happens:** En `evaluate_for_game()` no importa distinguirlos — si no hay cambio, no hay nada que hacer. Pero el reconciliador debe loguear el caso de downgrade.
**How to avoid:** Llamar `evaluator.compute_tier(player_id, games)` directamente para obtener el valor calculado, luego comparar con `current_tier` manualmente.
**Warning signs:** Tests de no-downgrade que siempre pasan trivialmente sin verificar que se logueó.

### Pitfall 2: Abortar el reconciliador ante un error de un jugador

**What goes wrong:** Una excepción en la evaluación de un jugador burbujea y detiene el proceso completo.
**Why it happens:** Olvidar envolver el bloque del jugador en try/except.
**How to avoid:** Cada jugador va en su propio try/except. El error se loguea y el player_id se agrega a `errors`. El método sigue al siguiente jugador.

### Pitfall 3: N+1 queries al cargar games

**What goes wrong:** `get_games_by_player()` se llama una vez por evaluador en vez de una vez por jugador.
**Why it happens:** Copiar la estructura del loop sin pre-cargar antes del loop de evaluadores.
**How to avoid:** Cargar games una vez antes de iterar sobre `ALL_EVALUATORS`, igual que en `evaluate_for_game()`.

### Pitfall 4: `players_repository.get_all()` retorna `Player` domain objects, no ORM

**What goes wrong:** Acceder a `player.id` en vez de `player.player_id`.
**Why it happens:** Confusión entre ORM (`Player.id`) y domain model (`Player.player_id`).
**How to avoid:** Ver `player_repository.py` línea 54-61 — `get_all()` retorna domain `Player` objects con `player_id` attribute.

---

## Code Examples

### Detectar downgrade intento (patrón recomendado)

```python
# Source: base.py — compute_tier signature
computed = evaluator.compute_tier(player_id, games)  # int: 0 = none
current_tier = persisted.get(evaluator.code, 0)

if computed < current_tier:
    logger.info(
        "Reconciler skipping downgrade: player=%s code=%s computed=%d persisted=%d",
        player_id, evaluator.code, computed, current_tier,
    )
    continue  # No-downgrade guarantee: skip, don't upsert

if computed > current_tier:
    self.achievement_repository.upsert(player_id, evaluator.code, computed)
    # record change for summary...
# computed == current_tier: no change, no-op
```

### Pattern test unitario — no-downgrade case

```python
# Source: test_achievements_service.py — patrón con patch ALL_EVALUATORS

def test_reconcile_logs_and_skips_downgrade(self):
    """When computed tier < persisted tier, upsert is NOT called."""
    players_repo = MagicMock()
    players_repo.get_all.return_value = [make_mock_player("p1", "Alice")]

    games_repo = MagicMock()
    games_repo.get_games_by_player.return_value = []

    achievement_repo = MagicMock()
    # Player already has tier 2 persisted
    achievement_repo.get_for_player.return_value = [
        make_mock_achievement("p1", "games_played", tier=2)
    ]

    # Evaluator computes tier 1 (would be downgrade)
    ev = MagicMock()
    ev.code = "games_played"
    ev.compute_tier.return_value = 1  # lower than persisted 2

    service = make_service(
        games_repo=games_repo,
        achievement_repo=achievement_repo,
        players_repo=players_repo,
    )

    with patch("services.achievements_service.ALL_EVALUATORS", [ev]):
        summary = service.reconcile_all()

    achievement_repo.upsert.assert_not_called()
    assert summary.players_updated == 0
```

### Pattern test integración — endpoint reconcile

```python
# Source: integration/test_achievements_routes.py — patrón TestClient

def test_reconcile_returns_200_with_summary(client):
    response = client.post("/achievements/reconcile")
    assert response.status_code == 200
    data = response.json()
    assert "total_players" in data
    assert "players_updated" in data
    assert "achievements_applied" in data
    assert "errors" in data
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A — feature nueva | Reconciler como método de AchievementsService | Phase 4 | Simple, sin clases extra |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest (already configured) |
| Config file | `backend/pytest.ini` or via `docker-compose.test.yml` |
| Quick run command | `make test-backend` |
| Full suite command | `make test-backend` |

**CRITICAL:** Never run pytest on the host — always via `make test-backend` (Docker). Host DATABASE_URL points to dev DB.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOOL-01 | `POST /achievements/reconcile` retorna 200 con resumen JSON | integration | `make test-backend` con filtro `test_reconcile` | ❌ Wave 0 |
| TOOL-01 | `reconcile_all()` aplica upserts para tiers que subieron | unit | `make test-backend -k test_reconcile_applies_upward_changes` | ❌ Wave 0 |
| TOOL-01 | `reconcile_all()` itera todos los jugadores | unit | `make test-backend -k test_reconcile_all_players` | ❌ Wave 0 |
| TOOL-02 | `reconcile_all()` no llama upsert cuando computed < persisted | unit | `make test-backend -k test_reconcile_skips_downgrade` | ❌ Wave 0 |
| TOOL-02 | `reconcile_all()` loguea el intento de downgrade | unit (caplog) | `make test-backend -k test_reconcile_logs_downgrade` | ❌ Wave 0 |
| TOOL-03 | Jugador sin logros previos recibe logros calculados desde sus partidas | integration | `make test-backend -k test_reconcile_backfill` | ❌ Wave 0 |
| TOOL-03 | `reconcile_all()` no aborta ante error de un jugador individual | unit | `make test-backend -k test_reconcile_skips_failed_player` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `make test-backend`
- **Per wave merge:** `make test-backend`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Tests unitarios para `reconcile_all()` en `backend/tests/test_achievements_service.py` — clase `TestReconcileAll` — cubre TOOL-01, TOOL-02, TOOL-03
- [ ] Tests de integración para `POST /achievements/reconcile` en `backend/tests/integration/test_achievements_routes.py` — cubre TOOL-01, TOOL-03

---

## Sources

### Primary (HIGH confidence)

- `backend/services/achievements_service.py` — Patron de evaluate_for_game() verificado directamente
- `backend/repositories/achievement_repository.py` — upsert() con ON CONFLICT DO UPDATE WHERE verificado
- `backend/services/achievement_evaluators/base.py` — Interface compute_tier() verificada
- `backend/routes/achievements_routes.py` — Patron route verificado
- `backend/schemas/achievement.py` — DTOs existentes verificados
- `backend/repositories/container.py` — DI pattern verificado
- `backend/tests/test_achievements_service.py` — Patron tests unitarios verificado
- `backend/tests/integration/test_achievements_routes.py` — Patron tests integración verificado

### Secondary (MEDIUM confidence)

- `.planning/phases/04-reconciliador/04-CONTEXT.md` — Decisions D-01 a D-06, canonical refs
- `.planning/REQUIREMENTS.md` — TOOL-01, TOOL-02, TOOL-03 definitions
- `.planning/STATE.md` — Project decisions history

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — 100% composición de código existente, sin dependencias nuevas
- Architecture: HIGH — patron directo de evaluate_for_game(), decisiones locked en CONTEXT.md
- Pitfalls: HIGH — identificados desde lectura directa del código y diferencia evaluate() vs compute_tier()
- Tests: HIGH — patrones verificados en test files existentes

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (código estable, no hay dependencias externas cambiando)
