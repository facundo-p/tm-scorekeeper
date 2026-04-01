# Roadmap: Terraforming Mars Stats — Sistema de Logros

## Overview

Este milestone agrega un sistema de logros persistentes a la app existente. El trabajo fluye desde abajo hacia arriba: primero la base de datos y los evaluadores (lógica pura), luego la integración con `create_game` y la API, luego todas las superficies de frontend (fin de partida, perfil, catálogo), y finalmente el reconciliador como capa de corrección independiente del flujo crítico.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Backend Core** - Tabla, repositorio, evaluadores y definiciones de logros (completed 2026-03-31)
- [x] **Phase 2: Integración y API** - Wiring en create_game y endpoints REST (completed 2026-03-31)
- [x] **Phase 3: Frontend** - Fin de partida, perfil de jugador, catálogo e íconos (completed 2026-04-01)
- [ ] **Phase 4: Reconciliador** - Herramienta de corrección de logros persistidos

## Phase Details

### Phase 1: Backend Core
**Goal**: El sistema de logros existe como lógica backend completa y testeada, lista para ser integrada
**Depends on**: Nothing (first phase)
**Requirements**: PERS-01, PERS-02, PERS-03, PERS-04, CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08
**Success Criteria** (what must be TRUE):
  1. La tabla `player_achievements` existe en la DB con constraint unique (player_id, code) y migración Alembic aplicable
  2. Un upsert en el repositorio nunca baja el tier de un logro existente (garantía de permanencia, verificable con test)
  3. Dado un set de partidas en memoria, `compute_tier()` retorna el tier correcto para logros de tipo single-game, acumulado, y win streak
  4. El registry `ALL_EVALUATORS` contiene al menos 3 logros que cubren los tres tipos de condición (single-game, acumulado, combinación)
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — DB layer: domain models, PlayerAchievement ORM, Alembic migration, AchievementRepository with atomic upsert
- [x] 01-02-PLAN.md — Evaluators: AchievementEvaluator ABC, SingleGameThreshold, Accumulated, WinStreak, AllMaps, definitions and ALL_EVALUATORS registry

### Phase 2: Integración y API
**Goal**: Crear una partida evalúa y persiste logros automáticamente, y hay endpoints para consultarlos
**Depends on**: Phase 1
**Requirements**: INTG-01, INTG-02, INTG-03, INTG-04, INTG-05, API-01, API-02, API-03
**Success Criteria** (what must be TRUE):
  1. Al hacer `POST /games/`, la respuesta incluye la lista de logros desbloqueados en esa partida (puede estar vacía)
  2. La respuesta de `POST /games/` diferencia entre "Nuevo logro" (tier 1) y "Logro mejorado" (tier 2+) para cada item
  3. Si un jugador cruza múltiples tiers en una sola partida, aparece un único item en la respuesta (tier final, no uno por tier)
  4. `GET /players/{id}/achievements` retorna todos los logros con tier actual, progreso hacia siguiente tier, y fecha de desbloqueo
  5. `GET /achievements/catalog` retorna todos los logros disponibles con estado por jugador
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — AchievementsService (evaluate_for_game, get_player_achievements, get_catalog), DTOs, mappers, repository get_all, container wiring
- [x] 02-02-PLAN.md — REST endpoints (POST /games/{id}/achievements, GET /players/{id}/achievements, GET /achievements/catalog), TypeScript types, frontend API client, useGames retry

### Phase 3: Frontend
**Goal**: Los jugadores ven sus logros al terminar una partida, en su perfil, y pueden explorar el catálogo completo
**Depends on**: Phase 2
**Requirements**: ENDG-01, ENDG-02, ENDG-03, PROF-01, PROF-02, PROF-03, PROF-04, CATL-01, CATL-02, ICON-01, ICON-02, ICON-03
**Success Criteria** (what must be TRUE):
  1. Al terminar de registrar una partida, se muestra una sección con los logros desbloqueados (ícono + título), con diferenciación visual entre nuevo y mejorado
  2. El perfil de jugador tiene tres secciones navegables: Stats, Records y Logros; la sección Logros muestra badges completos con progreso
  3. Los logros bloqueados son visibles en el perfil (en grayscale/opaco) con barra de progreso si aplica
  4. Existe una página de catálogo que lista todos los logros disponibles con quién los tiene y en qué tier
  5. Los íconos de logros funcionan con fallback automático: SVG custom → Lucide → emoji
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Leaf components: lucide-react install, AchievementIcon, ProgressBar, AchievementCard, AchievementBadgeMini, TabBar with tests
- [x] 03-02-PLAN.md — PlayerProfile tabs (Stats/Records/Logros) with lazy-loaded achievements, AchievementModal in GameRecords
- [x] 03-03-PLAN.md — AchievementCatalog page with holders modal, /achievements route, Home nav link

### Phase 4: Reconciliador
**Goal**: Existe una herramienta que puede recalcular y corregir todos los logros persistidos sin bajar ningún tier
**Depends on**: Phase 1
**Requirements**: TOOL-01, TOOL-02, TOOL-03
**Success Criteria** (what must be TRUE):
  1. Correr el reconciliador actualiza logros faltantes o con tier incorrecto (hacia arriba) para todos los jugadores
  2. El reconciliador nunca baja un tier existente — un tier calculado menor al persistido se loggea y se ignora (verificable con test)
  3. El reconciliador puede usarse como backfill para jugadores que tenían partidas antes de que el sistema existiera

**Plans**: TBD

Plans:
- [ ] 04-01: AchievementsReconciler con garantía no-downgrade, trigger CLI/endpoint, tests incluyendo caso de no-downgrade

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Core | 2/2 | Complete   | 2026-03-31 |
| 2. Integración y API | 2/2 | Complete   | 2026-03-31 |
| 3. Frontend | 3/3 | Complete   | 2026-04-01 |
| 4. Reconciliador | 0/1 | Not started | - |
