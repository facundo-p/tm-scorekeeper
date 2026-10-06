# Phase 21 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Transacción única y lock | `test_transactions.py`: rollback, anidamiento, concurrencia (6 hilos = recálculo completo; falla sin lock) | ✅ |
| UNIQUE en historial de ELO | migración con limpieza de repetidos probada sobre datos | ✅ |
| `created_at` y orden canónico | backfill probado (g-a antes que g-b el mismo día); test de partidas del mismo día | ✅ |
| `GET /games/` ≤ 3 consultas | `test_query_count.py` con 1 y 8 partidas | ✅ |
| Índices | migración arriba/abajo; presentes en `pg_indexes` | ✅ |
| Empates y ganadores | `test_results.py`, `test_ties_and_holders.py`; golden con `tied` | ✅ |
| Spacefarer | migración con datos (`{SPACECRAFTER}` → `{SPACEFARER}`); API acepta el nombre viejo | ✅ |
| 404 | `test_not_found.py` (8 rutas) | ✅ |
| Migraciones en CI | job `test-migrations`; ciclo upgrade/downgrade base/upgrade verde en local | ✅ |
| Gates | `gates.sh all` con migraciones: pytest 306, vitest 305, lint, typecheck, build, fixtures, semántica; candidata del arnés arranca (galería OK) | ✅ |
