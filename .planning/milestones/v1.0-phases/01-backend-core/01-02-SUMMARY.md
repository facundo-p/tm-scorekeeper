---
phase: 01-backend-core
plan: 02
subsystem: achievement-evaluators
tags: [achievements, evaluators, tdd, strategy-pattern, python]
dependency_graph:
  requires: [01-01-domain-models]
  provides: [achievement-evaluators, ALL_EVALUATORS-registry]
  affects: [02-achievements-service]
tech_stack:
  added: []
  patterns: [strategy-pattern, factory-pattern, tdd-red-green-refactor]
key_files:
  created:
    - backend/models/achievement_tier.py
    - backend/models/achievement_definition.py
    - backend/models/achievement_progress.py
    - backend/models/evaluation_result.py
    - backend/services/achievement_evaluators/__init__.py
    - backend/services/achievement_evaluators/base.py
    - backend/services/achievement_evaluators/single_game_threshold.py
    - backend/services/achievement_evaluators/accumulated.py
    - backend/services/achievement_evaluators/win_streak.py
    - backend/services/achievement_evaluators/all_maps.py
    - backend/services/achievement_evaluators/definitions.py
    - backend/services/achievement_evaluators/registry.py
    - backend/tests/test_achievement_evaluators.py
  modified: []
decisions:
  - "Domain models created in this plan (not 01-01) due to parallel execution — plan 01-01 not yet committed"
  - "WinStreakEvaluator sorts games by date before streak calculation — GamesRepository does not guarantee order"
  - "SingleGameThresholdEvaluator extractor uses 3-arg signature (player_id, game, game_result) to access calculate_results output"
  - "registry.py owns the counter/extractor lambdas to avoid circular imports with definitions.py"
metrics:
  duration_seconds: 273
  completed_date: "2026-03-31"
  tasks_completed: 3
  files_created: 13
requirements: [CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08]
---

# Phase 01 Plan 02: Achievement Evaluators Summary

Pure domain logic layer for the achievements system — AchievementEvaluator ABC, 2 generic evaluators, 2 custom evaluators, 5 achievement definitions, and the ALL_EVALUATORS registry.

## What Was Built

The complete achievement evaluator system following the strategy pattern established by record calculators:

- **AchievementEvaluator ABC** (`base.py`): abstract `compute_tier`, concrete `evaluate` (compares computed vs persisted tier, returns `EvaluationResult` with `is_new`/`is_upgrade` flags), `get_progress` (default `None`), `_next_tier` helper
- **SingleGameThresholdEvaluator**: evaluates achievements based on best single-game value — uses `calculate_results()` with 3-arg extractor `(player_id, game, game_result_dto) -> int`
- **AccumulatedEvaluator**: evaluates achievements based on accumulated counts — implements `get_progress()` returning `Progress(current, target)` toward next tier
- **WinStreakEvaluator**: custom evaluator with `_calculate_max_streak` (for tier) and `_calculate_current_streak` (for progress) — games sorted by date before calculation
- **AllMapsEvaluator**: custom evaluator counting unique maps played — `_get_played_maps` returns a set
- **definitions.py**: 5 `AchievementDefinition` instances: `HIGH_SCORE` (5 tiers, 50-150pts), `GAMES_PLAYED` (5 tiers, 5-100 games), `GAMES_WON` (5 tiers, 3-50 wins), `WIN_STREAK` (3 tiers, 2/3/5 consecutive), `ALL_MAPS` (3 tiers, 2/3/5 unique maps)
- **registry.py**: `ALL_EVALUATORS` list with exactly 5 evaluator instances, unique codes

## Test Coverage

36 tests across 6 test classes — all green:
- `TestAchievementEvaluatorBase` (8 tests): code property, evaluate edge cases, _next_tier
- `TestSingleGameThreshold` (6 tests): tier calculation, best game wins, other players ignored
- `TestAccumulatedEvaluator` (5 tests): tier calculation, progress, max tier returns None
- `TestWinStreakEvaluator` (6 tests): no wins, streak calculation, max vs current, out-of-order games
- `TestAllMapsEvaluator` (7 tests): tiers by unique map count, duplicate map ignored, progress
- `TestRegistry` (4 tests): 5 entries, unique codes, expected codes, all are AchievementEvaluator instances

Full suite: 82 passed (no regressions).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created prerequisite domain models from plan 01-01**
- **Found during:** Task 1 setup
- **Issue:** Plan 01-02 depends_on 01-01, but plan 01-01 had not yet been executed in this worktree (parallel execution). The 4 domain model files (AchievementTier, AchievementDefinition, Progress, EvaluationResult) were missing.
- **Fix:** Created all 4 domain model dataclasses as part of this plan's execution.
- **Files modified:** `backend/models/achievement_tier.py`, `backend/models/achievement_definition.py`, `backend/models/achievement_progress.py`, `backend/models/evaluation_result.py`
- **Commit:** e39aaa9

## Self-Check: PASSED

All 13 created files found on disk. All 3 task commits verified in git log.
