# 22-03 SUMMARY — Récords v2

- `backend/services/records/`: `definitions.py` (16 récords, espejo del catálogo del mockup), `metrics.py` (candidatos por partida), `tracker.py` (D-05: set/broken/tied, un quiebre por partida, todos los poseedores), `career.py` (totales por partida con el ELO reproducido, historial D-18), `service.py` (`RecordsService.records/history/game_context`, `near_records`).
- API: `GET /records` con subconjunto y campos aditivos (`scope`, `unit`, `lower_is_better`, `value`, `holders`, `history`), conservando `emoji` y `record` para el frontend previo; `GET /records/{code}/history` (404 si no existe). `RecordResultDTO.value` admite decimales.
- Skill `new-record` reescrito para el motor nuevo. README del backend actualizado. D-57 y D-58.
- Tests: 14 unitarios (`tests/test_records_v2.py`), 9 de rutas (`tests/integration/test_records_routes.py`), golden `test_records` en 5 alcances (16 récords cada uno, con poseedores e historial exactos).
