# 35-02 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Se retira la API deprecada (CLOSE-02, #139) | `test_retired_endpoints_are_gone` (7 endpoints → 404/405); `test_records_routes` sin `emoji`/`record`; logros sin `icon`/`fallback_icon` | ✅ |
| Lo retirado tiene reemplazo | Golden de posiciones y ELO por partida contra `GET /games/{id}/report`; e2e de la API con informe y ficha; recálculo de logros con `POST /admin/recompute` | ✅ |
| El frontend no lo usaba | Ningún `fetch` del frontend apunta a lo retirado; comparación completa en verde | ✅ |
| Gates | `GATES_PHASE=35 gates.sh all` | ✅ |
