# 35-03 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| JS inicial ≤ 100 kB gzip (CLOSE-03, #140) | `node tools/budgets/check-bundle.mjs`: 82,49 kB; `budget.test.mjs` (4) | ✅ |
| Planeta en chunk aparte | El mismo chequeo: `fx/planet/stage.ts` con chunk propio y fuera del JS inicial | ✅ |
| Chequeo en CI | `deploy.yml` → `test-frontend` (build + check-bundle) y `test-tools` (lógica) | ✅ |
| axe sin serios/críticos | Comparación del catálogo completo (`GATES_PHASE=35`), que falla la candidata ante cualquier violación seria o crítica | ✅ |
| Recorridos funcionales de la SPEC | `tools/parity/functional`: 8 chequeos × 2 viewports en verde | ✅ |
| Gates | `GATES_PHASE=35 gates.sh all` | ✅ |
