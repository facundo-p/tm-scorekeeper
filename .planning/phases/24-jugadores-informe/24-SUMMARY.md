# Phase 24 SUMMARY

- **24.1** `players.color` (migración `f2a3b4c5d6e7` con backfill determinístico, índice único parcial entre activos y check de los 10 valores); el repositorio asigna el primer color libre; `PlayerService` valida color pedido (409) y reasigna al reactivar; `since` sale de la primera partida. El cargador de fixtures conserva los colores de la semilla.
- **24.2** `GET /games/summaries` con subconjunto.
- **24.3** `GET /games/{id}/report`; `POST` y `PUT` devuelven `GameWriteResponseDTO` con el informe. El tracker de récords guarda el récord previo al romperse. `services/helpers/awards.py::stolen_awards` lo comparten el informe y el logro `stolen_awards`.
- Golden: `summaries` (5 alcances) y `reports` (63 partidas), exactos al primer intento.
- Tests: `tests/integration/test_player_colors.py` (6), `tests/integration/test_game_report_routes.py` (5); el test de forma de la respuesta de `PUT` pasa al contrato nuevo (conserva `message`).
