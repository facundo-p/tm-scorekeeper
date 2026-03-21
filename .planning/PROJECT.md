# Terraforming Mars Stats — Sistema de Logros

## What This Is

App de seguimiento de estadísticas para partidas de Terraforming Mars. Ya tiene sistema de records (patrón strategy), perfiles de jugadores, historial de partidas, y cálculo de resultados. Este milestone agrega un sistema de logros/achievements persistentes para jugadores.

## Core Value

Los jugadores descubren y desbloquean logros al jugar, dándole más profundidad y motivación a cada partida. Los logros son permanentes — una vez ganados, no se pierden.

## Requirements

### Validated

- ✓ Registro y carga de partidas con puntajes — existing
- ✓ Sistema de records con patrón strategy (RecordCalculator, registry, factory) — existing
- ✓ Perfiles de jugadores con stats y records — existing
- ✓ Detalle de partida con resultados y records comparativos — existing
- ✓ API REST (FastAPI) + Frontend (React + TypeScript) — existing

### Active

- [ ] Sistema de logros con tiers progresivos
- [ ] Evaluación automática de logros al finalizar partida
- [ ] Persistencia de logros desbloqueados (no se pierden)
- [ ] Visualización de logros nuevos en pantalla de fin de partida (ícono + título, minimalista)
- [ ] Sección de logros en perfil de jugador (formato completo: ícono, título, descripción, tiers, progreso)
- [ ] Reestructuración del perfil de jugador en secciones (Stats, Records, Logros)
- [ ] Catálogo global de todos los logros disponibles
- [ ] Íconos SVG custom con fallback a librería de íconos / emoji
- [ ] Soporte para progreso parcial en logros que lo ameriten (acumulados)

### Out of Scope

- Rediseño visual de records — se deja para un milestone futuro
- Logros basados en records (ej: "tener el record de mayor puntaje") — descartado
- Notificaciones push o por email — innecesario para esta app
- Logros multijugador/cooperativos — complejidad sin valor claro
- Animaciones elaboradas de desbloqueo — la versión mini (ícono+título) es suficiente

## Context

### Arquitectura existente de records (referencia para logros)

El sistema de records usa un patrón strategy bien encapsulado:
- `RecordCalculator` (ABC): define `calculate(games)` → `RecordEntry` y `evaluate(games)` → `RecordComparison`
- Concrete strategies: `HighestSingleGameScoreCalculator`, `MostGamesPlayedCalculator`, etc.
- Factory pattern: `MaxScoreCalculator` genera calculators vía lambda extractors
- Registry: `ALL_CALCULATORS` centraliza todas las strategies
- Services: `GameRecordsService` (por partida) y `PlayerRecordsService` (por jugador)
- Mappers: `record_comparison_mapper.py` transforma domain → DTO resolviendo player IDs

### Modelo de logros definido

**Tipos de condición:**
1. **Single game** — se evalúa sobre la partida actual (ej: "Ganar con 100+ pts")
2. **Acumulado** — se evalúa sobre historial completo (ej: "Jugar 10 partidas")
3. **Combinación** — lógica compleja sobre secuencias o conjuntos (ej: "Ganar 3 seguidas", "Jugar en todos los mapas")

**Patrón híbrido de evaluación:**
- Evaluadores genéricos para casos simples (umbral en single game, conteo acumulado)
- Evaluadores custom para combinaciones complejas
- Inspirado en el strategy pattern de records, pero con más flexibilidad

**Tiers progresivos:**
- Un mismo logro puede tener múltiples niveles (ej: Puntaje 50 → 75 → 100 → 125 → 150)
- Solo se muestra el tier más alto alcanzado (el badge "evoluciona")
- Notificación diferenciada: Tier 1 = "Nuevo logro!", Tiers 2+ = "Logro mejorado!"

**Progreso parcial:**
- Los logros acumulados muestran progreso (ej: "7/10 partidas")
- Los logros de single game no muestran progreso (es binario por naturaleza)

**Visualización:**
- Fin de partida: versión mini (ícono + título)
- Perfil de jugador: versión completa (ícono, título, descripción, tier actual, progreso)
- Catálogo global: grilla con todos los logros y quién los tiene

**Íconos:**
- SVG custom como primera opción
- Fallback a librería de íconos (Lucide o similar)
- Fallback final a emoji/unicode

### Stack existente

- Frontend: React 18 + TypeScript + Vite, CSS Modules con variables CSS
- Backend: FastAPI + SQLAlchemy + PostgreSQL + Alembic
- Testing: Vitest + Testing Library (frontend), pytest (backend)
- Theme: oscuro con tonos cálidos (marrones/naranjas, palette Terraforming Mars)

## Constraints

- **Stack**: Mantener React + FastAPI + PostgreSQL + SQLAlchemy existente
- **Patterns**: Seguir los patrones establecidos (repository, service, mapper, strategy)
- **Mobile-first**: Diseño responsive, componentes pequeños
- **CSS**: Modules con variables CSS, sin inline styles
- **Extensibilidad**: Agregar nuevos logros debe ser tan simple como agregar un nuevo record calculator

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Patrón híbrido (genérico + custom) para condiciones | Balance entre DRY para casos simples y flexibilidad para combinaciones complejas | — Pending |
| Tiers progresivos en vez de logros independientes por nivel | Más elegante: el badge evoluciona, reduce clutter visual | — Pending |
| Solo mostrar tier más alto en perfil | Evita saturación visual, el badge "crece" en vez de multiplicarse | — Pending |
| Notificación diferenciada (nuevo vs mejorado) | El jugador distingue un logro completamente nuevo de una mejora | — Pending |
| SVG custom con fallback chain | Permite iterar: arrancar con fallbacks e ir sumando SVGs custom | — Pending |
| Perfil de jugador con secciones | Escala mejor al agregar logros; separa concerns visuales | — Pending |
| No incluir rediseño de records en este milestone | Foco en logros; records funciona, solo es feo | — Pending |
| Logros persistentes (no se pierden) | A diferencia de records que cambian, los logros son permanentes — motivación acumulativa | — Pending |

---
*Last updated: 2026-03-21 after initialization*
