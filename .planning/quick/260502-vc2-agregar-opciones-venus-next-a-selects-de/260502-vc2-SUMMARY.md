---
quick_task: 260502-vc2
status: complete
completed_date: "2026-05-02"
duration_minutes: 5
tasks_completed: 2
tasks_total: 2
files_changed: 6
commits:
  - hash: 9bfff8c
    message: "feat(vc2): add EXPANSION_MILESTONES and EXPANSION_AWARDS to gameRules.ts"
  - hash: 2f66ae2
    message: "feat(vc2): show HOVERLORD and VENUPHILE when Venus Next expansion is active"
requirements_fulfilled:
  - VN-01
  - VN-02
  - VN-03
  - VN-04
  - VN-05
key_files:
  modified:
    - frontend/src/constants/gameRules.ts
    - frontend/src/pages/GameForm/steps/StepMilestones.tsx
    - frontend/src/pages/GameForm/steps/StepAwards.tsx
    - frontend/src/test/unit/gameRules.test.ts
    - frontend/src/test/components/StepMilestones.test.tsx
    - frontend/src/test/components/StepAwards.test.tsx
---

# Quick Task 260502-vc2 Summary

**One-liner:** Venus Next expansion HOVERLORD milestone and VENUPHILE award now appear conditionally in GameForm steps via EXPANSION_MILESTONES / EXPANSION_AWARDS lookup tables.

## What Was Built

Two lookup tables were added to `gameRules.ts` mapping expansions to their additional milestones and awards. The `StepMilestones` and `StepAwards` components were updated to merge map-specific options with expansion-specific options via `flatMap`.

## Tasks

### Task 1: Add EXPANSION_MILESTONES and EXPANSION_AWARDS to gameRules.ts (commit 9bfff8c)

- Added `Expansion` to the imports in `gameRules.ts`
- Exported `EXPANSION_MILESTONES: Partial<Record<Expansion, Milestone[]>>` with `VENUS_NEXT → [HOVERLORD]`
- Exported `EXPANSION_AWARDS: Partial<Record<Expansion, Award[]>>` with `VENUS_NEXT → [VENUPHILE]`
- Added tests: Venus Next contains HOVERLORD/VENUPHILE; PRELUDE/COLONIES/TURMOIL are undefined

### Task 2: Merge expansion options in StepMilestones and StepAwards (commit 2f66ae2)

- `StepMilestones`: split into `mapMilestones` + `expansionMilestones` (via `flatMap` over `state.expansions`), merged into `availableMilestones`
- `StepAwards`: split into `mapAwards` + `expansionAwards` (via `flatMap` over `state.expansions`), merged into `availableAwards`
- Tests: HOVERLORD visible with Venus Next active (6 checkboxes), hidden without (5 checkboxes)
- Tests: VENUPHILE visible in award select with Venus Next active, hidden without

## Test Results

All 243 tests pass across 25 test files.

```
Test Files  25 passed (25)
Tests       243 passed (243)
```

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. Frontend-only change; backend already validates HOVERLORD/VENUPHILE against Venus Next presence (T-vc2-01 in threat model).

## Self-Check

- [x] `frontend/src/constants/gameRules.ts` exports `EXPANSION_MILESTONES` and `EXPANSION_AWARDS`
- [x] `StepMilestones.tsx` uses `flatMap` over `state.expansions`
- [x] `StepAwards.tsx` uses `flatMap` over `state.expansions`
- [x] Commit 9bfff8c exists
- [x] Commit 2f66ae2 exists
- [x] Full suite: 243/243 tests passing
