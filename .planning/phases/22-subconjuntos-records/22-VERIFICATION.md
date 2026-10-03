# Phase 22 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Subconjunto y 422 | `test_records_v2.py::test_subset_filters_by_table_size_map_and_expansion`; `test_records_routes.py::test_out_of_range_subset_is_422` (4 casos) | ✅ |
| ELO de mesa | golden `test_elo_replay` en `all`, 2, 3, 4, 5 | ✅ |
| Reproducir todo = historial guardado | `test_full_replay_equals_stored_history` (63 partidas) | ✅ |
| D-05 (set, tied, broken, un quiebre por partida, cero) | `test_records_v2.py` | ✅ |
| D-18 (historial de carrera) | `test_career_history_only_logs_changes_of_the_holder_set` | ✅ |
| Contexto roto/cerca | `test_game_context_*`, `test_near_records_*` | ✅ |
| `GET /records` aditivo y `/history` | `test_records_routes.py` (contrato viejo, campos nuevos, subconjunto, 404) | ✅ |
| Golden de récords | `test_records` en 5 alcances: 16 récords con valor, poseedores e historial exactos | ✅ |
| Gates | `gates.sh all`: pytest 340, lint, typecheck, vitest, build, fixtures, semántica, tamaño del PR | ✅ |
