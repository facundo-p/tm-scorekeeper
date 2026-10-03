# 22-02 SUMMARY — ELO de mesa

- `backend/services/stats/elo_replay.py`: `replay_elo(ctx)` reutiliza `calculate_elo_changes`; devuelve cambios por partida, ratings finales y picos.
- Golden: `test_elo_replay` compara el ELO reproducido con `golden.elo` sin filtro y por mesa 2..5 (`enabled.yaml`: `elo: [all, 2, 3, 4, 5]`); `test_full_replay_equals_stored_history` compara la reproducción completa con `GET /games/{id}/elo` en las 63 partidas.
