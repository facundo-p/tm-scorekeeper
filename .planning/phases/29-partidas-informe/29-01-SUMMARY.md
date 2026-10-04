# 29-01 SUMMARY — Partidas e Informe

- **Partidas** (`screens/Games`):
  - Actividad de 52 semanas, filtros (mapa, jugadores en orden de alta, mesa) y orden (`domain/sort.ts`, port de `data/sort.js`, reemplaza #65).
  - Lista agrupada por mes cuando se ordena por fecha; aviso de partida eliminada; hoja de filtros en el teléfono; vacío con «Limpiar filtros».
- **Informe** (`screens/GameReport`):
  - Héroe con el planeta en la región del mapa, chips y placa del ganador.
  - Puntaje final: pista de TR, barras o tabla, corporaciones.
  - Hitos y recompensas como el tablero, con las robadas marcadas.
  - ELO, récords rotos y casi récords, logros desbloqueados.
  - Acciones: repetir ceremonia, editar, eliminar. Eliminar confirma, llama a `DELETE /games/{id}`, invalida el cache y vuelve al archivo con aviso.
- **Piezas**: `Notice`, `ExpansionTags size="s"`, `FilterPanel`, `ScreenHead` con `revealAt` y `asideClassName`; `useDeleteGame`, `summaryResults`, `bySignup`.
- **Backend (D-75)**: `seq` en `GET /players/`; `description` en los récords rotos y `max_tier` en los logros del informe.
- **Se borraron** las páginas viejas de lista y detalle de partidas.
- **Tests**:
  - Frontend: `gamesModel`, `reportModel`, `Games` (3), `GameReport` (3), `sort` (4).
  - Backend: campos nuevos del informe.
