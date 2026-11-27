---
phase: quick
plan: 260501-r3p
subsystem: backend-enums, backend-migrations, backend-services, frontend-enums
tags: [enums, migration, venus-next, validation, awards, milestones]
dependency_graph:
  requires: []
  provides:
    - Spanish Award enum keys in backend (TERRATENIENTE/BANQUERO/CIENTIFICO/TERMALISTA/MINERO)
    - Alembic migration c1d2e3f4a5b6 renaming 5 DB labels + adding 2 Venus Next labels
    - Milestone.HOVERLORD and Award.VENUPHILE in backend and frontend
    - Venus Next validation in game_service._validate_venus_requirements
  affects:
    - backend/models/enums.py
    - backend/db/migrations/versions/c1d2e3f4a5b6_fix_award_tharsis_enums_add_venus.py
    - backend/services/game_service.py
    - backend/tests/test_enums.py
    - backend/tests/test_achievement_evaluators.py
    - frontend/src/constants/enums.ts
tech_stack:
  added: []
  patterns:
    - rename_enum_value/add_enum_value helpers for safe PostgreSQL enum migration
    - Venus expansion gate validation in service layer before DB write
key_files:
  created:
    - backend/db/migrations/versions/c1d2e3f4a5b6_fix_award_tharsis_enums_add_venus.py
  modified:
    - backend/models/enums.py
    - backend/services/game_service.py
    - backend/tests/test_enums.py
    - backend/tests/test_achievement_evaluators.py
    - frontend/src/constants/enums.ts
decisions:
  - Award enum key rename (Spanish) aligns DB label with frontend key, eliminating mismatch
  - VENUPHILE/HOVERLORD PostgreSQL enum additions are irreversible; downgrade only reverses renames
  - Venus validation raises ValueError before DB write; enum coercion in mapper rejects unknown strings
metrics:
  duration_minutes: ~15
  completed_date: "2026-05-01"
  tasks_completed: 3
  files_modified: 6
---

# Quick Task 260501-r3p: Fix Award Tharsis Enums + Add Venus Next Summary

**One-liner:** Renamed backend Tharsis Award enum keys to Spanish (matching frontend) via Alembic migration, added Venus Next milestone (HOVERLORD) and award (VENUPHILE) to both backend and frontend, and added `_validate_venus_requirements` guard in game_service.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update backend enums + Alembic migration | f376ba7 | enums.py, c1d2e3f4a5b6_*.py |
| 2 | Venus validation + tests + frontend enums | 9577ddb | game_service.py, test_enums.py, enums.ts |
| 3 | Run tests in Docker + verify enum sync | c0f365a (Rule 1 fix) | test_achievement_evaluators.py |

## Verification Results

- `test_award_enum_contract` PASSED — expects Spanish Tharsis values + Venuphile
- `test_milestone_enum_contract` PASSED — expects Hoverlord
- `test_corporation_enum_contract` PASSED — unchanged
- Full suite: 192 tests passed in Docker (docker-compose.test.yml)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed old English Award values in achievement evaluator test fixtures**
- **Found during:** Task 3 (Docker test run)
- **Issue:** `test_achievement_evaluators.py` used `_make_award("Landlord", ...)`, `_make_award("Banker", ...)`, `_make_award("Scientist", ...)` — these construct `Award` by value. After renaming the enum values to Spanish, `Award("Landlord")` raised `ValueError: 'Landlord' is not a valid Award`. 12 tests failed.
- **Fix:** Replaced all 36 occurrences of English Award string values (`Landlord` → `Terrateniente`, `Banker` → `Banquero`, `Scientist` → `Científico`) in the test fixtures. The specific award chosen in these tests is arbitrary — the tests verify achievement counting logic, not award identity.
- **Files modified:** `backend/tests/test_achievement_evaluators.py`
- **Commit:** c0f365a

## Known Stubs

None.

## Threat Surface Scan

No new network endpoints or auth paths introduced. The `_validate_venus_requirements` method is an internal service-layer guard (T-r3p-01 from plan threat model — mitigated as planned). Migration runs in controlled deploy context (T-r3p-02 — accepted).

## Self-Check: PASSED

All created/modified files exist on disk. All task commits (f376ba7, 9577ddb, c0f365a) verified in git log.
