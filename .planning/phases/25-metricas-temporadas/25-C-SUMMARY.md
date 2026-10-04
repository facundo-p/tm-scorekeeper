# 25-C SUMMARY — Temporadas y bitácora

- `services/stats/seasons.py`: tramos de temporada (temperatura, O₂, océanos), lecturas, carrera por promedio con 3 partidas para clasificar y campeón D-15.
- `services/stats/feed.py`: bitácora con los textos del mockup (`js_number` escribe los números como JavaScript); orden D-68.
- `services/seasons_service.py`, rutas `GET /seasons`, `/seasons/current`, `/seasons/{n}` y `/feed`.
- Golden: `seasons` (iguales en los 5 alcances), `season_races` (9 categorías × temporadas × 5 alcances) y `feed` (por grupos de fecha y tipo); se habilitan también `positions` por mesa: todo el golden queda activo.
- Tests: `tests/integration/test_seasons_routes.py` (4), `tests/test_feed.py` (1).
- Latencias locales p95: ranking 64 ms, cara a cara 52, resumen 51, temporadas 50, bitácora 79.
