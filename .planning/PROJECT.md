# Terraforming Mars Stats

## What This Is

App de seguimiento de estadísticas para partidas de Terraforming Mars. Incluye sistema de records (patrón strategy), perfiles de jugadores con logros, historial de partidas, cálculo de resultados, y un sistema completo de achievements persistentes con tiers progresivos.

## Core Value

Los jugadores descubren y desbloquean logros al jugar, dándole más profundidad y motivación a cada partida. Los logros son permanentes — una vez ganados, no se pierden.

## Current State

**v1.0 shipped** — Sistema de Logros completo (2026-04-01)
**v1.0 cleanup shipped** — gaps del audit cerrados (2026-04-28)

- Backend: 4 tipos de evaluadores (strategy pattern) registrando **12 definiciones** en `ALL_EVALUATORS`. `AchievementsService` centralizado como singleton en `services/container.py`.
- Integración: evaluación automática post-partida, 3 endpoints REST
- Frontend: badges en fin de partida con retry-once-on-failure observable; perfil con tabs (Stats/Records/Logros); catálogo global. Componentes limpios — sin props muertos.
- Herramientas: reconciliador con garantía no-downgrade
- Tests: 298 tests (122 frontend / 176 backend), todos en CI
- Stack: FastAPI + SQLAlchemy + PostgreSQL 17 + Alembic / React 18 + TypeScript + Vite + CSS Modules

## Next Milestone

(Not yet defined — run `/gsd-new-milestone` to start the next cycle.)

## Requirements

### Validated

- ✓ Registro y carga de partidas con puntajes — existing
- ✓ Sistema de records con patrón strategy — existing
- ✓ Perfiles de jugadores con stats y records — existing
- ✓ API REST (FastAPI) + Frontend (React + TypeScript) — existing
- ✓ Sistema de logros con tiers progresivos — v1.0
- ✓ Persistencia de logros desbloqueados — v1.0
- ✓ Evaluación automática al finalizar partida — v1.0
- ✓ API REST para logros (jugador + catálogo) — v1.0
- ✓ Progreso parcial en logros acumulados — v1.0
- ✓ Visualización de logros en fin de partida — v1.0
- ✓ Perfil con secciones (Stats, Records, Logros) — v1.0
- ✓ Catálogo global de logros — v1.0
- ✓ Íconos con fallback chain (Lucide → emoji) — v1.0
- ✓ Reconciliador con garantía no-downgrade — v1.0

### Active

(Next milestone not yet defined)

### Out of Scope

- Rediseño visual de records — milestone separado
- Logros basados en records — rompe permanencia (records cambian)
- Notificaciones push/email — innecesario
- Logros multijugador/cooperativos — complejidad sin valor
- SVG custom per-logro — deferred, Lucide fallbacks work well

## Constraints

- **Stack**: React + FastAPI + PostgreSQL + SQLAlchemy
- **Patterns**: repository, service, mapper, strategy
- **Mobile-first**: responsive, componentes pequeños
- **CSS**: Modules con variables CSS, sin inline styles
- **Extensibilidad**: agregar logros = agregar evaluador al registry

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Patrón híbrido (genérico + custom) para condiciones | Balance DRY + flexibilidad | ✓ Good — 3 generic + 2 custom evaluators |
| Tiers progresivos (badge evoluciona) | Reduce clutter visual | ✓ Good |
| Solo mostrar tier más alto en perfil | Badge "crece" en vez de multiplicarse | ✓ Good |
| Notificación diferenciada (nuevo vs mejorado) | Distingue primer desbloqueo de upgrade | ✓ Good |
| Lucide icons con fallback chain | Arrancar rápido, SVG custom en v2 | ✓ Good — vite-plugin-svgr deferred |
| Perfil con tabs (Stats/Records/Logros) | Escala al agregar secciones | ✓ Good |
| No incluir rediseño de records | Foco en logros | ✓ Good — records funciona |
| Logros persistentes (no se pierden) | Motivación acumulativa | ✓ Good |
| Definiciones en código, no en DB | Consistente con records | ✓ Good |
| Reconciliador como endpoint POST | Permite backfill y corrección | ✓ Good — POST /achievements/reconcile |
| Progreso on-demand (no persistido) | Cambia con cada partida | ✓ Good |
| compute_tier() directo en reconciliador | evaluate() colapsa no-change y downgrade | ✓ Critical insight |

---
*Last updated: 2026-04-28 after v1.0-cleanup milestone*
