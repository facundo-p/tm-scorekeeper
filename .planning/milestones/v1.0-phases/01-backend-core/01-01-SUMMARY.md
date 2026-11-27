---
phase: 01-backend-core
plan: 01
subsystem: backend/persistence
tags: [achievements, orm, repository, migration, tdd]
requirements: [PERS-01, PERS-02, PERS-03, PERS-04]
requirements-completed: [PERS-01, PERS-02, PERS-03, PERS-04]
dependency_graph:
  requires: []
  provides: [PlayerAchievement ORM, AchievementRepository, domain models, Alembic migration]
  affects: [Phase 02 (evaluator service), Phase 03 (API endpoints), Phase 04 (frontend)]
tech_stack:
  added: [sqlalchemy pg_insert on_conflict_do_update]
  patterns: [repository pattern, dataclass domain models, TDD red-green]
key_files:
  created:
    - backend/models/achievement_tier.py
    - backend/models/achievement_definition.py
    - backend/models/achievement_progress.py
    - backend/models/evaluation_result.py
    - backend/repositories/achievement_repository.py
    - backend/db/migrations/versions/add_player_achievements.py
    - backend/tests/test_achievement_repository.py
  modified:
    - backend/db/models.py
decisions:
  - "Used 85250527884f as down_revision (latest actual migration) instead of 7ab0ad45d0f2 from plan — plan had stale revision ID"
  - "on_conflict_do_update with WHERE PlayerAchievement.tier < excluded.tier enforces no-downgrade atomically at DB level"
metrics:
  duration: 3 minutes
  completed: 2026-03-31
  tasks_completed: 3
  files_created: 7
  files_modified: 1
---

# Phase 01 Plan 01: Persistence Layer for Achievements Summary

**One-liner:** PostgreSQL persistence layer with PlayerAchievement ORM, atomic no-downgrade upsert via pg_insert().on_conflict_do_update(WHERE), and 4 domain dataclasses.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Domain model dataclasses | 3dadd28 | achievement_tier.py, achievement_definition.py, achievement_progress.py, evaluation_result.py |
| 2 | PlayerAchievement ORM + Alembic migration + Player relationship | 07cfa52 | db/models.py, migrations/versions/add_player_achievements.py |
| 3 | AchievementRepository with atomic upsert + integration tests | 9769af7 | repositories/achievement_repository.py, tests/test_achievement_repository.py |

## Verification Results

```
54 passed in 1.04s
```

All 8 achievement-specific tests pass (domain model smoke test + 6 upsert/query tests + 1 relationship test).

## Success Criteria Checklist

- [x] 4 domain model dataclasses exist and import cleanly
- [x] PlayerAchievement ORM class is in db/models.py with correct columns and UniqueConstraint
- [x] Player.achievements relationship exists with cascade="all, delete-orphan"
- [x] Alembic migration file exists with upgrade() and downgrade()
- [x] AchievementRepository.upsert() uses pg_insert().on_conflict_do_update() with WHERE clause
- [x] `pytest tests/test_achievement_repository.py -x -q` passes green
- [x] No-downgrade test explicitly verifies tier stays at 3 after attempting upsert with tier=1

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected down_revision in Alembic migration**
- **Found during:** Task 2
- **Issue:** Plan specified `down_revision = "7ab0ad45d0f2"` but the actual latest migration on disk was `85250527884f` (update corporation enum), not `7ab0ad45d0f2`
- **Fix:** Used `85250527884f` as down_revision so migration chain is valid
- **Files modified:** backend/db/migrations/versions/add_player_achievements.py
- **Commit:** 07cfa52

## Key Design Notes

- The `WHERE PlayerAchievement.tier < stmt.excluded.tier` clause is the atomicity guarantee: if the existing DB tier is >= the incoming tier, PostgreSQL skips the UPDATE entirely — no application-level race condition possible.
- The four domain dataclasses have zero ORM dependencies — they are pure Python dataclasses suitable for use in evaluators, services, and API mappers.
- `conftest.py` `setup_db` fixture picks up `PlayerAchievement` automatically because it imports from `db.models` which now includes the class. The migration is also applied via `alembic upgrade head` in the test container entrypoint.
