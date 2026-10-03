# 21-03 SUMMARY — Rendimiento

- `selectinload` de resultados y recompensas en listados (`GET /games/`: 3 consultas con 1 u 8 partidas, test con `event.listen`).
- Migración `c9d0e1f2a3b4`: índices `player_results.game_id`, `player_results.player_id`, `awards.game_id`, `player_elo_history.recorded_at` (también en el modelo ORM).
