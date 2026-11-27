# 16-03 Summary — Cargador
- `backend/scripts/load_fixture.py`: guarda `_test`/`_parity`, conserva ids, una transacción, un recálculo de ELO y logros; 63 partidas en ~1,2 s.
- `GamesRepository.to_orm()` público para reutilizar el mapeo dominio → ORM.
- Tests: `backend/tests/test_load_fixture.py` (6).
