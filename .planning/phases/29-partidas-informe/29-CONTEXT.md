# Phase 29: Partidas e Informe — Context

**Milestone:** v2.0 · **Épica:** E6 · **Requisitos:** SCR-03..04 · **Plan maestro:** `.planning/v2.0/SPEC.md` § F28–F34. Reemplaza el PR #65 (orden del archivo).

## Objetivo
Archivo de partidas (`mockup/js/screens/games.js`): actividad de 52 semanas, filtros por mapa, jugadores y mesa (en el teléfono, en una hoja), orden por fecha, ganador, mapa o jugadores (`data/sort.js`), agrupado por mes y estado vacío. Informe (`game.js`): héroe con el planeta en la región del mapa, puntaje final con pista de TR y barras o tabla, hitos y recompensas como el tablero, ELO, récords rotos y casi récords, logros, y acciones repetir ceremonia, editar y eliminar (con confirmación).

## Decisiones locales
- **D-75** `seq` en la API de jugadores, campos nuevos del informe, coordenadas como el mockup, eliminar e invalidar, rutas de edición y de récords hasta F30.

## Bordes
- Ningún resultado con los filtros (vacío con «Limpiar filtros»); archivo vacío.
- Partida inexistente (404): estado vacío.
- Eliminar falla: aviso dentro de la hoja, la partida sigue.
- Partida decidida por M€ (`report-tie`), con Turmoil (`report-turmoil`).
