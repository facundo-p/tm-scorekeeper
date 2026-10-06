# 15-03 Summary — Guarda de la base de tests
- `backend/tests/db_guard.py` + `pytest_configure` en `backend/tests/conftest.py`: código 2 si la base no termina en `_test` (incluido el default sin `DATABASE_URL`).
- 11 tests nuevos en `backend/tests/test_db_guard.py` (query string, URL sin base, URL inválida, falsos positivos).
- CI usa `tm_scorekeeper_test`; skill `test-backend` y `backend/README.md` documentan la alternativa sin Docker (se quitó la mención a SQLite).
