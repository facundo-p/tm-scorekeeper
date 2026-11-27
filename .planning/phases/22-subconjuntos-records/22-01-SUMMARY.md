# 22-01 SUMMARY — Subconjunto y contexto

- `backend/models/game_subset.py`: `GameSubset(player_count, map, expansion)` con `matches(game)` e `is_all`; `ALL_GAMES`.
- `backend/services/stats/context.py`: `GameStats` (partida, resultados ordenados, ganadores, margen) y `StatsContext` (filtra y ordena una vez; `get(id)`).
- `backend/routes/dependencies.py::game_subset`: `?player_count=2..5&map=&expansion=` con 422 fuera de rango.
- Tests: subconjuntos en `tests/test_records_v2.py`; 422 en `tests/integration/test_records_routes.py`.
