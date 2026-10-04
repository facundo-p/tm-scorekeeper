# Phase 32 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Ranking con filtros, ELO de mesa, equidad, cara a cara y por mesa (SCR-08) | Comparación `ranking`, `ranking-mesa5`, `ranking-h2h`, `ranking-by-table`; `Ranking.test.tsx` (lista y filtro de mesa); `rankingModel.test.ts` | ✅ |
| Alta y edición de jugadores con color de cubo (SCR-09) | Comparación `player-new`, `player-edit`; `Ranking.test.tsx` (alta con POST, 409, reactivar con PATCH) | ✅ |
| «Desde» = fecha de alta (D-78) | pytest `test_player_colors.py`, `test_player_joined_on_migration.py` | ✅ |
| Gates | `GATES_PHASE=32 gates.sh all` | ✅ |
