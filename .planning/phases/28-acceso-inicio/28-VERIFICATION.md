# Phase 28 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Acceso (SCR-01) | `test/screens/Login.test.tsx` (envío, 401/429/503, red caída, campos vacíos, ojo, sesión iniciada); comparación `login`, `login-invalid`, `login-wrong` al 0 % | ✅ |
| Inicio (SCR-02) | `test/screens/Home.test.tsx`, `homeModel.test.ts`; comparación `home`, `home-race-mesa3`, `home-race-cat`, `season-rules` al 0 %, mismo árbol de accesibilidad | ✅ |
| Orden de alta y niveles (D-74) | migración probada con datos (backfill por primera partida, identidad para altas nuevas, ida y vuelta); `test_player_order.py` | ✅ |
| Todo lo exigido hasta F28 | `run.mjs --phase 28 --gated`: 28/28 | ✅ |
| Gates | `GATES_PHASE=28 gates.sh all` | ✅ |
