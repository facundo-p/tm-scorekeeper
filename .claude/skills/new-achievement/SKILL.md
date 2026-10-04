---
name: new-achievement
description: Add a new achievement to the derived achievements engine (definition, metric, golden and tests)
argument-hint: [description of what the achievement tracks]
---

# New achievement

Add an achievement for `$ARGUMENTS` to the derived engine in `backend/services/achievement_evaluators/` (F23).
Semantics live in `docs/redesign/SEMANTICS.md` §5 (D-04, D-08); read them first.

## Pre-flight

Resolve, from the prompt or the mockup catalog (`docs/redesign/mockup/js/data/catalog.js`, `ACHIEVEMENTS`):

- **code** in snake_case, **description** and **flavor** in Spanish
- **kind**: `max` (best value in one game), `sum` (accumulated) or `flag` (one level, no progress)
- **metric**: name of the running value the tiers compare against
- **tiers**: `(threshold, title)` pairs in ascending order
- **glyph**: icon of the redesign (`frontend/src/ui/icons`); **fallback_icon**: a Lucide name that
  only the pre-v2.0 frontend used (deleted in F35); the API still sends it until 35.2 retires it

The mockup is the reference implementation: add the definition to `ACHIEVEMENTS` in
`docs/redesign/mockup/js/data/catalog.js` and the metric to `achievementMetrics` in `derive.js`,
then regenerate the golden (`node tools/fixtures/export.mjs`).

## Architecture

```
catalog.py     → AchievementDefinition list (order = order on screen)
metrics.py     → AchievementMetrics (running values) and step(): one game for one player
tiers.py       → the single tier loop: level dated with the first game reaching its threshold
derive.py      → derive_achievements(ctx, player_ids): never writes
```

Writes: every game create/edit/delete runs `DerivedService.recompute_from` in the same
transaction (ELO first, then `AchievementsService.recompute_all`, which replaces
`achievement_unlocks`). Reads derive on the fly, with `?player_count=` for the table view.

## Steps

1. Add the field to `AchievementMetrics` and update it in `step()` (or `_win_flags()` if it
   needs a win). Use `max(...)` for `max`, `+` for `sum`, `or int(cond)` for `flag`.
2. Add the `AchievementDefinition(...)` to `ACHIEVEMENTS`.
3. Bump `DERIVED_VERSION` in `backend/services/derived_service.py`: the next start-up recomputes
   every stored unlock (D-13).
4. Add a case to `backend/tests/test_achievement_engine.py`. The golden test
   (`tests/golden/test_golden.py::test_achievements`) checks every player, all games and by table size.

```bash
DATABASE_URL=postgresql://tm_user:tm_pass@localhost:5432/tm_scorekeeper_test \
  backend/.venv/bin/python -m pytest backend/tests -q
```
