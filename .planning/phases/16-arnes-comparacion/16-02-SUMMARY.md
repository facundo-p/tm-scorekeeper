# 16-02 Summary — Fixtures y golden
- `docs/redesign/mockup/js/data/round.js` (half-even) usado por `derive.js` (D-06); `buildModel({ playerCount })` para derivar por mesa.
- `tools/fixtures/export.mjs` + `golden.mjs` → `fixtures/seed.json` (10 jugadores, 63 partidas GameDTO) y `fixtures/golden.json` (sin filtro y mesas 2..5: 5, 19, 28 y 11 partidas). `--check` en CI.
