# 23-B SUMMARY — Tabla, recálculo, versión y vista por mesa

- `achievement_unlocks(player_id, code, tier, game_id, unlocked_on)` con `UNIQUE(player_id, code, tier)` y `app_meta(key, value)`; migración `e1f2a3b4c5d6` reemplaza `player_achievements` (la bajada restituye el nivel máximo de cada logro).
- `services/derived_service.py`: crear, editar y borrar recalculan ELO y después logros dentro de la misma transacción con el lock (#44); `derived_version` en el arranque (D-13, D-62); `POST /admin/recompute` y `POST /achievements/reconcile` recalculan lo mismo.
- `AchievementsService` sobre el motor derivado: regenera la tabla, `POST /games/{id}/achievements` es una lectura repetible (D-61), perfil y catálogo derivan al vuelo con `?player_count=2..5` y `view: "mesa"` (sin escritura).
- DTOs aditivos: `kind`, `glyph`, `flavor`, `value`, `unlocks`, `view`.
- Tests: `tests/integration/test_achievements_routes.py` (13: recálculo en alta, edición y borrado; rollback completo si falla el recálculo; lectura repetible; mesa sin escritura y con conteo y poseedores por tamaño; 422; catálogo; reconcile; arranque con versión atrasada y arranque con recálculo fallido). Golden `test_achievements` por HTTP en 5 alcances y `test_stored_unlocks_match_the_derived_view`. Se retiran los tests del servicio, mapper y repositorio de v1 (reescritos).
- Migración probada arriba/abajo con datos y desde base vacía.
- Revisión (ronda 1, APPROVE): tests de rollback, arranque con fallo y mesa con datos; catálogo indexado por código; docstrings de la bajada y del anidamiento de unidades.
