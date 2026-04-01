---
phase: 04-reconciliador
plan: "01"
subsystem: backend
tags: [achievements, reconciler, service, endpoint, tdd]
dependency_graph:
  requires:
    - backend/services/achievements_service.py (AchievementsService)
    - backend/repositories/achievement_repository.py (upsert)
    - backend/services/achievement_evaluators/registry.py (ALL_EVALUATORS)
    - backend/repositories/container.py (players_repository)
  provides:
    - POST /achievements/reconcile endpoint
    - AchievementsService.reconcile_all() method
    - ReconcileResponseDTO, PlayerReconcileChangeDTO schemas
  affects:
    - backend/schemas/achievement.py
    - backend/routes/achievements_routes.py
tech_stack:
  added: []
  patterns:
    - TDD (RED/GREEN cycle)
    - Service method with per-player try/except error isolation
    - Dataclass internal result type (not DTO leak into service layer)
    - Route maps service dataclass -> Pydantic DTO
key_files:
  created:
    - .planning/phases/04-reconciliador/04-01-SUMMARY.md
  modified:
    - backend/services/achievements_service.py
    - backend/schemas/achievement.py
    - backend/routes/achievements_routes.py
    - backend/tests/test_achievements_service.py
    - backend/tests/integration/test_achievements_routes.py
decisions:
  - "Use compute_tier (not evaluate) in reconcile_all — evaluate() collapses no-change and downgrade into same None result, preventing downgrade detection and logging"
  - "Internal ReconcileSummaryResult dataclass in service layer, mapped to ReconcileResponseDTO at route level — keeps service free of Pydantic dependency"
  - "Per-player try/except with logger.exception — errors isolated, never abort full reconciliation"
metrics:
  duration_minutes: 6
  tasks_completed: 2
  files_modified: 5
  completed_date: "2026-04-01"
---

# Phase 4 Plan 1: Achievements Reconciler Summary

**One-liner:** POST /achievements/reconcile endpoint with reconcile_all() that applies upward tier corrections, logs downgrades, and isolates per-player errors.

## What Was Built

Implemented the achievements reconciler as a new method `reconcile_all()` on `AchievementsService`, exposed via `POST /achievements/reconcile`. The reconciler:

1. Iterates all players via `players_repository.get_all()`
2. For each player, loads games once (no N+1) and gets persisted achievement tiers
3. Calls `evaluator.compute_tier()` (not `evaluate()`) on each evaluator — this distinction is critical because `evaluate()` collapses "no change" and "downgrade" into the same `None` result, preventing the reconciler from detecting and logging downgrade attempts
4. Upserts only when `computed > persisted_tier` (upward corrections only)
5. Logs at INFO level when `computed < persisted_tier` ("Reconciler skipping downgrade")
6. Skips equal tiers (no-op, no upsert, no log)
7. Catches per-player exceptions with `logger.exception()`, appends `player_id` to errors, continues
8. Returns `ReconcileSummaryResult` with `total_players`, `players_updated`, `achievements_applied`, and `errors`

The route maps the internal dataclass to `ReconcileResponseDTO`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Tests for reconcile_all and POST /achievements/reconcile (RED) | 806bb61 | backend/tests/test_achievements_service.py, backend/tests/integration/test_achievements_routes.py |
| 2 | Implement reconcile_all, DTOs, and POST /achievements/reconcile (GREEN) | 0619e8a | backend/services/achievements_service.py, backend/schemas/achievement.py, backend/routes/achievements_routes.py |

## Test Coverage

9 new tests across 2 files:

**Unit (TestReconcileAll in test_achievements_service.py):**
- `test_reconcile_applies_upward_changes` — TOOL-01: upsert called, summary shows players_updated=1 and change with correct old/new tier
- `test_reconcile_skips_downgrade` — TOOL-02: upsert NOT called when computed < persisted
- `test_reconcile_logs_downgrade` — TOOL-02: INFO log emitted with "skipping downgrade" on downgrade attempt
- `test_reconcile_all_players` — TOOL-01: all 3 players processed (get_games_by_player called 3 times)
- `test_reconcile_skips_failed_player` — TOOL-03: per-player exception isolated, second player still processed
- `test_reconcile_no_change_when_tiers_equal` — TOOL-02: no upsert when computed == persisted
- `test_reconcile_backfill_new_player` — TOOL-03: player with no prior achievements gets upsert with old_tier=0

**Integration (test_achievements_routes.py):**
- `test_reconcile_returns_200_with_summary` — TOOL-01: POST /achievements/reconcile returns 200 with correct JSON shape

Final test run: **131 passed, 0 failed**.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `backend/services/achievements_service.py` — contains `def reconcile_all(self) -> ReconcileSummaryResult:`
- `backend/schemas/achievement.py` — contains `class ReconcileResponseDTO(BaseModel):`
- `backend/routes/achievements_routes.py` — contains `@router.post("/reconcile"`
- Commits 806bb61 and 0619e8a verified in git log
