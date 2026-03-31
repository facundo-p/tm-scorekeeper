# Requirements: Terraforming Mars Stats — Sistema de Logros

**Defined:** 2026-03-28
**Core Value:** Los jugadores descubren y desbloquean logros al jugar, dándole más profundidad y motivación a cada partida. Los logros son permanentes.

## v1 Requirements

### Backend Core

- [x] **CORE-01**: Sistema define logros con código, descripción, ícono, fallback, y flag de progreso
- [x] **CORE-02**: Cada logro soporta múltiples tiers con level, threshold y título por tier
- [x] **CORE-03**: Evaluador base (ABC) con `compute_tier()`, `get_progress()`, y `evaluate()`
- [x] **CORE-04**: Evaluador genérico `SingleGameThresholdEvaluator` con extractor lambda
- [x] **CORE-05**: Evaluador genérico `AccumulatedEvaluator` con counter lambda y progreso
- [x] **CORE-06**: Evaluador custom `WinStreakEvaluator` con progreso de racha actual
- [x] **CORE-07**: Evaluador custom `AllMapsEvaluator` con progreso de mapas jugados
- [x] **CORE-08**: Registry centralizado `ALL_EVALUATORS` con logros iniciales definidos

### Persistencia

- [x] **PERS-01**: Tabla `player_achievements` con player_id, code, tier, unlocked_at y constraint unique
- [x] **PERS-02**: Migración Alembic para crear la tabla
- [x] **PERS-03**: Repository con upsert atómico (ON CONFLICT DO UPDATE, solo si tier sube)
- [x] **PERS-04**: Relationship en modelo Player hacia achievements

### Integración

- [x] **INTG-01**: Evaluación de logros ejecutada post-commit en `create_game()`
- [x] **INTG-02**: Bulk-load de games antes del loop de evaluators (evitar N+1)
- [x] **INTG-03**: Response de `POST /games/` incluye logros desbloqueados en esa partida
- [x] **INTG-04**: Notificación diferenciada: "Nuevo logro" (tier 1) vs "Logro mejorado" (tier 2+)
- [x] **INTG-05**: Un solo evento por logro con tier final (no uno por tier intermedio)

### API

- [x] **API-01**: `GET /players/{id}/achievements` retorna logros del jugador con tier, progreso, y estado
- [x] **API-02**: `GET /achievements/catalog` retorna catálogo global con quién tiene cada logro
- [x] **API-03**: DTOs y mappers para achievements (domain → response)

### Frontend — Fin de Partida

- [ ] **ENDG-01**: Sección separada de logros nuevos en pantalla de fin de partida
- [ ] **ENDG-02**: Badge mini: solo ícono + título del logro desbloqueado
- [ ] **ENDG-03**: Diferenciación visual entre "Nuevo logro" y "Logro mejorado"

### Frontend — Perfil

- [ ] **PROF-01**: Perfil de jugador reestructurado en secciones (Stats, Records, Logros)
- [ ] **PROF-02**: Badge completo: ícono, título, descripción, tier actual, indicador de tier máximo
- [ ] **PROF-03**: Barra de progreso hacia siguiente tier (en logros que lo soporten)
- [ ] **PROF-04**: Logros bloqueados visibles en grayscale/opaco con progreso si aplica

### Frontend — Catálogo

- [ ] **CATL-01**: Página con grilla de todos los logros disponibles
- [ ] **CATL-02**: Cada logro muestra qué jugadores lo tienen y en qué tier

### Íconos

- [ ] **ICON-01**: Componente `AchievementIcon` con fallback chain: SVG custom → Lucide → emoji
- [ ] **ICON-02**: Integración `vite-plugin-svgr` para SVG como componentes React
- [ ] **ICON-03**: Mapeo de fallback icons en definiciones de logros (Lucide icon names)

### Herramientas

- [ ] **TOOL-01**: Script/endpoint de reconciliación que recalcula todos los logros y corrige discrepancias
- [ ] **TOOL-02**: Reconciliador nunca baja tiers (garantía de permanencia)
- [ ] **TOOL-03**: Script usable como backfill al agregar nuevos logros

## v2 Requirements

### Visual Polish
- **VIS-01**: SVG custom para cada logro (reemplazar fallbacks de Lucide)
- **VIS-02**: Animación sutil de desbloqueo en pantalla de fin de partida

### Expansión
- **EXP-01**: Logros basados en corporaciones específicas
- **EXP-02**: Logros estacionales o por período de tiempo

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rediseño visual de records | Milestone separado |
| Logros basados en records | Rompe la regla de permanencia (records cambian) |
| Notificaciones push/email | Innecesario para esta app |
| Logros multijugador/cooperativos | Complejidad sin valor claro |
| Animaciones elaboradas de desbloqueo | La versión mini es suficiente para v1 |
| Logros ocultos/secretos | No funciona con volumen bajo de partidas |
| Logros punitivos | Reduce engagement según research |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Complete |
| CORE-02 | Phase 1 | Complete |
| CORE-03 | Phase 1 | Complete |
| CORE-04 | Phase 1 | Complete |
| CORE-05 | Phase 1 | Complete |
| CORE-06 | Phase 1 | Complete |
| CORE-07 | Phase 1 | Complete |
| CORE-08 | Phase 1 | Complete |
| PERS-01 | Phase 1 | Complete |
| PERS-02 | Phase 1 | Complete |
| PERS-03 | Phase 1 | Complete |
| PERS-04 | Phase 1 | Complete |
| INTG-01 | Phase 2 | Complete |
| INTG-02 | Phase 2 | Complete |
| INTG-03 | Phase 2 | Complete |
| INTG-04 | Phase 2 | Complete |
| INTG-05 | Phase 2 | Complete |
| API-01 | Phase 2 | Complete |
| API-02 | Phase 2 | Complete |
| API-03 | Phase 2 | Complete |
| ENDG-01 | Phase 3 | Pending |
| ENDG-02 | Phase 3 | Pending |
| ENDG-03 | Phase 3 | Pending |
| PROF-01 | Phase 3 | Pending |
| PROF-02 | Phase 3 | Pending |
| PROF-03 | Phase 3 | Pending |
| PROF-04 | Phase 3 | Pending |
| CATL-01 | Phase 3 | Pending |
| CATL-02 | Phase 3 | Pending |
| ICON-01 | Phase 3 | Pending |
| ICON-02 | Phase 3 | Pending |
| ICON-03 | Phase 3 | Pending |
| TOOL-01 | Phase 4 | Pending |
| TOOL-02 | Phase 4 | Pending |
| TOOL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation*
