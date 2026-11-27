# Phase 15 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| pytest contra una base sin `_test` sale con código 2 | `DATABASE_URL=…/tm_scorekeeper pytest backend/tests` → exit 2; sin `DATABASE_URL` → exit 2 | ✅ |
| Bootstrap idempotente | `bootstrap.sh` dos veces seguidas sin error; la segunda no reinstala | ✅ |
| Gates | `GATES_MIGRATIONS=1 scripts/dev/gates.sh all`: pytest (204), migraciones sobre base vacía, typecheck, vitest (243), build, tamaño de PR en verde | ✅ |
| `requirements-dev.txt` instala en un venv limpio | pip install en venv nuevo | ✅ |
| Merge a `staging` | ver PR de la fase | pendiente |

Comparación visual: no aplica (el arnés llega en F16).
