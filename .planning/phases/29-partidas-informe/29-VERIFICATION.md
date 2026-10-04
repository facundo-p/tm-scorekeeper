# Phase 29 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Partidas (SCR-03) | `Games.test.tsx`, `gamesModel.test.ts`, `sort.test.ts`; comparación `games`, `games-sort-winner`, `games-sort-players`, `games-sort-winner-mobile`, `games-mesa3` al 0 % | ✅ |
| Informe (SCR-04) | `GameReport.test.tsx` (informe, tabla, eliminar con confirmación y aviso, 404), `reportModel.test.ts`; comparación `report-g063`, `report-turmoil`, `report-tie`, `report-delete` al 0 % | ✅ |
| Campos nuevos (D-75) | `test_game_report_routes.py`, `test_player_order.py` | ✅ |
| Todo lo exigido hasta F29 | `run.mjs --phase 29 --gated` | ✅ |
| Gates | `GATES_PHASE=29 gates.sh all` | ✅ |
