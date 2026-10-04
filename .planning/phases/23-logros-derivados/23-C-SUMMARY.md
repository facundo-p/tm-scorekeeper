# 23-C SUMMARY — Retiro de los evaluadores de v1

- Se borran `achievement_evaluators/{base,registry,accumulated,single_game_threshold,win_streak,all_maps,definitions}.py`, `models/evaluation_result.py` y `tests/test_achievement_evaluators.py`: desde 23-B nada los usa. Sus casos de semántica viven en `tests/test_achievement_engine.py` y en el golden (18 logros × 10 jugadores × 5 alcances).
- `AchievementDefinition` sin `show_progress` (el progreso sale del `kind`, D-61) y hasheable otra vez (niveles como tupla).
- Skill `new-achievement` reescrito para el motor derivado (incluye subir `DERIVED_VERSION`).
