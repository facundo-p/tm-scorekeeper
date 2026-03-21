# Terraforming Mars Stats — Records UI Redesign

## What This Is

Sistema de registro y estadísticas de partidas de Terraforming Mars para un grupo de 8+ amigos. La app ya funciona (partidas, jugadores, scoring, records), y este milestone se enfoca en rediseñar la UI de records que actualmente se ve confusa e inconsistente.

## Core Value

Los records deben comunicar de un vistazo quién tiene cada logro, con identidad visual clara por record.

## Requirements

### Validated

- ✓ Registro de partidas con jugadores, corporaciones, puntuaciones — existing
- ✓ Cálculo de records globales y por partida — existing
- ✓ Listado de records con comparación (superados/no superados) — existing
- ✓ Sistema de autenticación (admin compartido) — existing
- ✓ Campo `title` en modelo de records (backend) — existing

### Active

- [ ] Rediseñar RecordStandingCard con nueva jerarquía visual (título+emoji hero, atributos protagonistas, descripción+valor como metadata)
- [ ] Rediseñar RecordComparisonCard con consistencia visual respecto al StandingCard
- [ ] Sincronizar types del frontend con el backend (agregar campo `title` y `emoji`)
- [ ] Agregar campo `emoji` al modelo de records en el backend
- [ ] Mostrar atributos (jugador, fecha) en una línea separados por `·`
- [ ] Mostrar el título custom del record como elemento principal del card
- [ ] Asegurar consistencia de layout entre todos los cards de records

### Out of Scope

- Nuevas métricas (rankings, head-to-head, tendencias) — milestone futuro
- Cambios en el sistema de autenticación — funciona como está
- Cambios en el flujo de carga de partidas — no es el foco
- Gráficos o visualizaciones complejas — milestone futuro
- Sistema de logros/achievements — milestone separado

## Context

- App brownfield: React 18 + FastAPI + PostgreSQL
- Mobile-first, CSS modules con design system variables
- Hay dos componentes de records: `RecordStandingCard` (records globales) y `RecordComparisonCard` (records de una partida)
- El backend ya tiene el campo `title` pero el frontend no lo consume
- El campo `emoji` es nuevo, debe agregarse al backend
- Grupo de 8+ jugadores con rotación, un admin compartido
- Layout aprobado: título+emoji arriba (hero), atributos en una línea con `·`, descripción+valor al pie como metadata

## Constraints

- **Tech stack**: React 18 + TypeScript frontend, FastAPI + Python backend — no cambiar
- **Mobile-first**: Diseño debe funcionar bien en pantallas chicas
- **CSS modules**: Seguir el patrón existente con variables del design system
- **No inline styling**: Regla del proyecto

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Invertir jerarquía visual en cards | Jugador y título son más importantes que la descripción técnica del record | — Pending |
| Emoji como campo en backend | Permite personalización por record sin hardcodear en frontend | — Pending |
| Atributos en línea con separador `·` | Más compacto y escaneable que atributos apilados | — Pending |

---
*Last updated: 2026-03-21 after initialization*
