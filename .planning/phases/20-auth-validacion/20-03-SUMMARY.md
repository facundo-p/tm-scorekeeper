# 20-03 SUMMARY — Validación de partidas y restricción única

- `backend/models/game_rules.py`: hitos y recompensas por mapa y expansión (D-51), con test que lo compara con `frontend/src/constants/gameRules.ts` y cubre todos los miembros de los enums.
- `GamesService._validate_game()` compartido por crear y editar; `_validate_board()` rechaza hitos o recompensas de otro mapa (400). Editar antes no validaba nada.
- Errores (D-52): `GameNotFound` (subclase de `ValueError`, 404), `GameConflict` (409) cuando la base rechaza la partida.
- Migración `f6a7b8c9d0e1`: `UNIQUE(game_id, player_id)` en `player_results`; aborta listando los duplicados si los hay (probado con un `op` simulado). El modelo ORM declara la misma restricción.
- Bug encontrado por la restricción: `GamesRepository.update` insertaba los resultados nuevos antes de borrar los viejos; ahora vacía y hace flush antes de volver a cargarlos.
- Tests: `tests/test_game_validation.py` (reglas, API 400/404/409, restricción en la base, guarda de la migración, espejo del frontend). La base de tests se recrea en cada sesión para seguir a los modelos; `docker-compose.test.yml` monta el repo entero (los tests leen `fixtures/` y `frontend/`).
