# Phase 25 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Ficha del jugador (STAT-11) | golden `test_player_insights` (27 campos × 10 jugadores × 5 alcances); `test_insights.py`, `test_insights_routes.py` | ✅ |
| Ranking con equidad y cambios de líder | golden `test_ranking_and_lead_changes`; `test_stats_routes.py`, `test_group_stats.py` | ✅ |
| Cara a cara y rivalidades | golden `test_head_to_head` | ✅ |
| Resumen | golden `test_group_summary` | ✅ |
| Bitácora | golden `test_feed` (D-68); `test_seasons_routes.py` | ✅ |
| Temporadas (SEAS-01, D-15) | golden `test_seasons`, `test_season_races` | ✅ |
| p95 < 300 ms en local | medido con 63 partidas: máximo 79 ms | ✅ |
| Gates | `gates.sh all` en cada sub-PR | ✅ |
