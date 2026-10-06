---
phase: 02-integraci-n-y-api
plan: 01
subsystem: backend-achievements-service
tags: [service, dtos, mappers, repository, tdd]
requirements: [API-03, INTG-01, INTG-02, INTG-04, INTG-05]
requirements-completed: [API-03, INTG-01, INTG-02, INTG-04, INTG-05]
dependency_graph:
  requires:
    - Phase 01 evaluator system (ALL_EVALUATORS, AchievementEvaluator base)
    - Phase 01 persistence layer (AchievementRepository.upsert, get_for_player)
    - Phase 01 domain models (EvaluationResult, AchievementDefinition, Progress)
  provides:
    - AchievementsService (evaluate_for_game, get_player_achievements, get_catalog)
    - schemas/achievement.py (8 Pydantic DTOs)
    - mappers/achievement_mapper.py (3 mapping functions)
    - AchievementRepository.get_all()
    - achievement_repository singleton in container.py
  affects:
    - Phase 02 Plan 02: routes will import AchievementsService and DTOs from here
tech_stack:
  added: []
  patterns:
    - Service with constructor-injected repositories
    - Pure mapping functions (domain -> DTO)
    - TDD (RED/GREEN/REFACTOR cycle)
key_files:
  created:
    - backend/schemas/achievement.py
    - backend/mappers/achievement_mapper.py
    - backend/services/achievements_service.py
    - backend/tests/test_achievement_schemas.py
    - backend/tests/test_achievements_service.py
  modified:
    - backend/repositories/achievement_repository.py (added get_all)
    - backend/repositories/container.py (added achievement_repository singleton)
decisions:
  - "evaluation_result_to_unlocked_dto uses next(t.title for t in tiers if t.level == new_tier) — correct for non-contiguous tiers"
  - "build_player_achievement_dto uses tiers[0].title as canonical name — consistent with plan spec"
  - "AchievementsService.evaluate_for_game wraps entire body in try/except Exception — returns {} on any error"
  - "Test fixtures use 3-tier definitions to avoid StopIteration when new_tier=2 or 3"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_created: 5
  files_modified: 2
  tests_added: 28
  tests_total_after: 118
---

# Phase 02 Plan 01: AchievementsService — Summary

**One-liner:** AchievementsService with evaluate_for_game/get_player_achievements/get_catalog, backed by 8 Pydantic DTOs and 3 mapper functions, all TDD-verified green.

## What Was Built

### Task 1: DTOs, mappers, repository get_all, and container wiring

**`backend/schemas/achievement.py`** — 8 Pydantic DTO classes:
- `AchievementUnlockedDTO` — compact unlock notification (code, title, tier, is_new, is_upgrade, icon, fallback_icon)
- `AchievementsByPlayerResponseDTO` — dict[player_id, list[AchievementUnlockedDTO]]
- `ProgressDTO` — current/target progress values
- `PlayerAchievementDTO` — full achievement display (includes description, max_tier, unlocked_at, progress)
- `PlayerAchievementsResponseDTO` — list wrapper
- `AchievementTierInfoDTO` — tier metadata for catalog
- `HolderDTO` — player who holds an achievement (player_id, player_name, tier, unlocked_at)
- `AchievementCatalogItemDTO` — full catalog entry with tiers and holders
- `AchievementCatalogResponseDTO` — list wrapper

**`backend/mappers/achievement_mapper.py`** — 3 pure mapping functions:
- `evaluation_result_to_unlocked_dto` — maps EvaluationResult + evaluator to AchievementUnlockedDTO; finds tier title by `tier.level == result.new_tier`
- `build_player_achievement_dto` — maps evaluator state + persisted data to PlayerAchievementDTO; uses `tiers[0].title` as canonical name
- `build_catalog_item_dto` — maps evaluator + holders tuples to AchievementCatalogItemDTO

**`backend/repositories/achievement_repository.py`** — Added `get_all()` returning all PlayerAchievement rows.

**`backend/repositories/container.py`** — Added `achievement_repository = AchievementRepository()` singleton.

### Task 2: AchievementsService

**`backend/services/achievements_service.py`** — 3 public methods:

**`evaluate_for_game(game_id)`:**
- Gets game, extracts player_ids
- For each player: loads games once (INTG-02 bulk load, no N+1), loads persisted tiers, iterates ALL_EVALUATORS, upserts upgrades, collects DTOs
- Returns only players with at least one unlock/upgrade (D-06)
- Entire body wrapped in try/except Exception — returns `{}` on any error

**`get_player_achievements(player_id)`:**
- Returns a DTO for every evaluator in ALL_EVALUATORS (locked + unlocked)
- For `show_progress=True` evaluators, calls `get_progress()` on-demand
- Does NOT persist progress (D-13)

**`get_catalog()`:**
- Loads all PlayerAchievement rows and all players
- Groups holders by achievement code
- Returns one AchievementCatalogItemDTO per evaluator with populated holders

## Test Results

All 118 tests pass (28 new tests added in this plan).

```
118 passed in 0.75s
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test fixture tier count causing StopIteration**
- **Found during:** Task 2 GREEN phase
- **Issue:** Mock evaluators in test_achievements_service.py used `make_definition()` with only `[AchievementTier(level=1, ...)]`. When `EvaluationResult(new_tier=2)` was used, `evaluation_result_to_unlocked_dto` called `next(t.title for t in tiers if t.level == 2)` which raised StopIteration.
- **Fix:** Updated `make_definition()` in tests to default to 3 tiers (levels 1, 2, 3).
- **Files modified:** backend/tests/test_achievements_service.py
- **Commit:** 6f86cd7

## Self-Check: PASSED
