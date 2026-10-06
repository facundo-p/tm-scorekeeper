---
name: new-record
description: Add a new record to the v2 records engine (definition, per-game metric or career value, golden and tests)
argument-hint: [record-name]
---

# New record

Add a new record for `$ARGUMENTS` to the v2 engine in `backend/services/records/` (F22).
Semantics live in `docs/redesign/SEMANTICS.md` §4 (D-05, D-18); read them first.

## Pre-flight

Resolve, from the prompt or the mockup catalog (`docs/redesign/mockup/js/data/catalog.js`, `RECORDS`):

- **code** in snake_case (e.g. `highest_venus_points`)
- **title** and **description** in Spanish, **unit** (`pts`, `TR`, `gen`, `M€`, …)
- **scope**: `game` (best value in one game) or `career` (accumulated per player)
- **lower_is_better**: only when a smaller value is the record (e.g. `closest_win`, `fastest_win`)

The mockup is the reference implementation (`derive.js`): add the record there too and
regenerate the golden (`node tools/fixtures/export.mjs`), so both sides stay in step.

## Architecture

```
definitions.py → RecordDef and RECORD_DEFS (order = order on screen)
metrics.py     → GAME_METRICS: code → fn(GameStats) → [(player_id, value)]   (scope "game")
career.py      → CAREER_VALUE: code → fn(CareerTotals) → int                 (scope "career")
tracker.py     → D-05 per game: set / broken / tied, at most one break per game
service.py     → RecordsService: records(subset), history(code, subset), game_context(game_id)
```

`GameStats` (from `services/stats/context.py`) brings the game, its ranked results, the
winners and the margin. `StatsContext` filters by `GameSubset` and keeps canonical order.

## Game record

1. Add the `RecordDef(...)` to `RECORD_DEFS`.
2. Add the metric to `GAME_METRICS`. Return candidates for every player who qualifies; the
   tracker picks the best value and every player who reached it. In higher-is-better
   records a 0 never sets the record (D-30); return nothing for games that don't qualify
   (e.g. `biggest_margin` only with a single winner). Round with `round()` (half-even, D-06).

## Career record

1. Add the `RecordDef(...)` with `scope="career"`.
2. If it needs a new running total, add the field to `CareerTotals` and update `_add_game`.
3. Add the value to `CAREER_VALUE`.

## Tests

- Unit: `backend/tests/test_records_v2.py` (set, tie, break, zero, subset).
- Golden: `backend/tests/golden/test_golden.py::test_records` checks every record, all
  games and by table size, against `fixtures/golden.json`.

```bash
DATABASE_URL=postgresql://tm_user:tm_pass@localhost:5432/tm_scorekeeper_test \
  backend/.venv/bin/python -m pytest backend/tests -q
```
