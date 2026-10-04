# Phase 24: Jugadores, partidas e informe — Context

**Milestone:** v2.0 · **Épica:** E4 (#75) · **Requisitos:** STAT-08..10 · **Plan maestro:** `.planning/v2.0/SPEC.md` § F24.

## Objetivo
Darle al frontend nuevo lo que necesitan el archivo, el informe de partida y los cubos de color: color y antigüedad de cada jugador, filas resumidas del archivo con el filtro de subconjunto y un informe completo por partida que se devuelve también al crear y editar.

## Golden
`tools/fixtures/golden.mjs` suma `summaries` (en los 5 alcances) y `reports` (solo sin filtro: el informe siempre mira todas las partidas), proyectados desde `buildModel`, `gameRecordContext` y `nearRecords` del mockup.

## Decisiones locales
- **D-64** `since` = primera partida.
- **D-65** Colores únicos entre activos, primero libre, 409 y reactivación.
- **D-66** Informe y respuestas de crear/editar.
