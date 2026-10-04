# Phase 23 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Niveles derivados y fechados (D-04) | `test_achievement_engine.py`; golden `test_achievements` (18 logros × 10 jugadores, todas y mesas 2..5) | ✅ |
| Tabla `achievement_unlocks` | `test_stored_unlocks_match_the_derived_view`; migración arriba/abajo con datos y desde base vacía; job `test-migrations` | ✅ |
| Recálculo en crear/editar/borrar después del ELO | `test_editing_and_deleting_games_update_the_unlocks`, `test_creating_games_unlocks_levels_dated_with_their_game` | ✅ |
| `POST /games/{id}/achievements` repetible | `test_post_game_achievements_is_a_repeatable_read` | ✅ |
| `derived_version` (D-13) | `test_startup_recomputes_when_derived_version_is_behind` | ✅ |
| 6 logros nuevos | engine tests (fotofinish, blitz, mesa llena, D-08, corporaciones, ciudades) y golden | ✅ |
| Vista por mesa sin escritura | `test_table_view_is_labelled_and_never_writes`, 422 fuera de rango | ✅ |
| Gates | `gates.sh all` en cada sub-PR | ✅ |
