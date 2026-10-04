# 23-A SUMMARY — Motor de logros derivados

- `backend/services/achievement_evaluators/catalog.py`: los 18 logros (12 de v1 + 6 nuevos del dueño), espejo del catálogo del mockup, con `kind`, `metric`, `glyph` y `flavor`.
- `metrics.py`: `AchievementMetrics` por jugador después de cada partida (incluye D-08 con el ELO reproducido del subconjunto). `tiers.py`: bucle de niveles único (nivel fechado con la primera partida que alcanzó el umbral; progreso). `derive.py`: `derive_achievements(ctx, player_ids)`, sin escritura.
- `models/achievement_definition.py` admite los campos nuevos sin romper a los evaluadores de v1, que siguen atendiendo la API hasta 23-B.
- Tests: `tests/test_achievement_engine.py` (14) y golden `test_derived_achievements` en todas las partidas y en las mesas de 2 a 5 (18 logros de los 10 jugadores, exactos).
- `tests/conftest.py` recrea el esquema `public` completo (las tablas retiradas no bloquean el `drop`).
- Revisión (ronda 1, APPROVE): D-59 nombra `catalog.py`; la definición no se hashea (`eq=False`) mientras v1 pase listas; tests de `stolen_awards` (máximo, no suma), derrotas y jugador fuera del subconjunto; `GRANT` al recrear el esquema de tests.
