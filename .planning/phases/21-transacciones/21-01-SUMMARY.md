# 21-01 SUMMARY — Unidad de trabajo y lock

- `backend/db/uow.py`: `unit_of_work(lock=...)` con `contextvars` y `session_scope` para los repositorios (D-55); `expire_on_commit=False`.
- `GamesService` crea, edita y borra dentro de una unidad con `pg_advisory_xact_lock`; `EloService.recompute_from_date` también (se suma a la unidad activa).
- Migración `b8c9d0e1f2a3`: `UNIQUE(player_id, game_id)` en `player_elo_history`, borrando antes filas repetidas (derivadas).
- Tests (`tests/integration/test_transactions.py`): rollback completo, unidades anidadas, repositorios fuera de una unidad, concurrencia con 6 hilos (falla si se quita el lock; probado).
