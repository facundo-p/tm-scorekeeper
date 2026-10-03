# Terraforming Mars Stats

## What This Is

App de seguimiento de estadísticas para partidas de Terraforming Mars. Incluye sistema de records (patrón strategy), perfiles de jugadores con logros, historial de partidas, cálculo de resultados, y un sistema completo de achievements persistentes con tiers progresivos.

## Core Value

Los jugadores descubren y desbloquean logros al jugar, dándole más profundidad y motivación a cada partida. Desde v2.0 los logros se derivan del historial: cada nivel queda fechado con la partida que lo alcanzó, y editar o borrar una partida (o cargar una vieja) puede quitar un nivel (D-04 de v2.0).

## Current State

**v1.0 shipped** — Sistema de Logros completo (2026-04-01)
**v1.0 cleanup shipped** — gaps del audit cerrados (2026-04-28)
**v1.1 Phase 8 shipped** — `GET /elo/history` endpoint live (2026-04-29) — backend listo para alimentar el chart de Ranking

- Backend: 4 tipos de evaluadores (strategy pattern) registrando **12 definiciones** en `ALL_EVALUATORS`. `AchievementsService` centralizado como singleton en `services/container.py`.
- Integración: evaluación automática post-partida, 3 endpoints REST
- Frontend: badges en fin de partida con retry-once-on-failure observable; perfil con tabs (Stats/Records/Logros); catálogo global. Componentes limpios — sin props muertos.
- Herramientas: reconciliador con garantía no-downgrade
- Tests: 303 tests (122 frontend / 181 backend), todos en CI
- Stack: FastAPI + SQLAlchemy + PostgreSQL 17 + Alembic / React 18 + TypeScript + Vite + CSS Modules

## Current Milestone: v2.0 «Archivo de Terraformación»

**Goal:** Llevar la app real a verse y funcionar como el mockup navegable del rediseño (`docs/redesign/mockup/`), con datos reales, login real, filtros de mesa, equidad, temporadas, récords y logros nuevos, y edición/borrado de partidas con recálculo en cascada.

**Plan y estado:** `.planning/v2.0/SPEC.md` (plan), `.planning/v2.0/LEDGER.md` (estado), `.planning/v2.0/DECISIONS.md` (decisiones), `.planning/v2.0/RUNBOOK.md` (operación). Fases 15 a 36.

**Target features:**
- Auth real (JWT) en toda la API; validación compartida; transacciones con advisory lock
- Récords v2 (16 en total, con co-poseedores e historial) y logros derivados del historial (18 en total)
- Filtro de mesa por pantalla con ELO de mesa; equidad; desglose por tamaño de mesa; temporadas por promedio
- Frontend nuevo: sistema visual del mockup, shell con rail/dock, planeta WebGL2, instrumentos SVG, 10 pantallas
- Arnés de comparación visual mockup ↔ app y golden del backend

**v1.1 (cerrado parcialmente):** las fases 8–14 quedaron mergeadas; sus requisitos pendientes se absorben en v2.0 (Ranking y Perfil rediseñados).

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
- ✓ Sistema ELO multiplayer en backend (cálculo, persistencia, recomputer cascada, API) — v1.1 backend (mergeado pre-milestone vía PR #42)

### Active

- [ ] ELO actual visible en perfil de jugador — v1.1
- [ ] ELO anterior/nuevo por jugador en fin de partida — v1.1
- [ ] Sección Ranking con gráfica de evolución de ELO — v1.1
- [ ] Selector multi-jugador en gráfica (default: todos) — v1.1
- [ ] Filtro de fecha "desde" en gráfica — v1.1

### Out of Scope

- Rediseño visual de records — milestone separado
- Logros basados en records — rompe permanencia (records cambian)
- Multi-usuario / cuentas por jugador — v2.0 usa una cuenta compartida (D-03)
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
| Logros persistentes (no se pierden) | Motivación acumulativa | ⚠️ Reemplazada en v2.0 por logros derivados del historial (D-04) |
| Definiciones en código, no en DB | Consistente con records | ✓ Good |
| Reconciliador como endpoint POST | Permite backfill y corrección | ✓ Good — POST /achievements/reconcile |
| Progreso on-demand (no persistido) | Cambia con cada partida | ✓ Good |
| compute_tier() directo en reconciliador | evaluate() colapsa no-change y downgrade | ✓ Critical insight |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-03 — milestone v2.0 «Archivo de Terraformación» started*
