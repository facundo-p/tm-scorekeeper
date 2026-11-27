# 25-A SUMMARY — Ficha del jugador

- `services/stats/player_rows.py` (filas jugador-partida del subconjunto) y `services/stats/insights.py` (rachas, corporaciones y mapas, favoritos, composición y arquetipo, equidad, desglose por mesa, cara a cara y rivales), espejo de `derive.js`.
- `services/helpers/numbers.py`: suma de izquierda a derecha (D-67).
- `services/insights_service.py` y `GET /players/{id}/insights?player_count=` (404, 422, `view`).
- Golden `test_player_insights`: los 27 campos de los 10 jugadores en 5 alcances, exactos (floats incluidos).
- Tests: `tests/integration/test_insights_routes.py` (3) y `tests/test_insights.py` (5: favoritos empatados, rachas, equidad con 2, rivales con mínimo y desempate, empate de ELO en el ranking).
- Latencia local (63 partidas, 20 pedidos): insights p95 66 ms, con mesa 62 ms; récords 39, archivo 51, informe 57, catálogo 56.
- Revisión (ronda 1, APPROVE): tests unitarios de bordes; rivales sin lambdas con `noqa`; se probó desempatar el ranking por primera partida y rompía el golden de la mesa de 2, así que queda por id (D-67 corregida).
