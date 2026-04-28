---
phase: 06-drifts-y-polish
plan: 01
subsystem: api
tags: [pydantic, typescript, achievements, dto, drift-cleanup]

# Dependency graph
requires:
  - phase: 02-integraci-n-y-api
    provides: AchievementCatalogItemDTO, build_catalog_item_dto mapper, GET /achievements/catalog
  - phase: 03-frontend
    provides: AchievementCatalog page consuming the catalog DTO
provides:
  - AchievementCatalogItemDTO without redundant `title` field (backend + frontend)
  - build_catalog_item_dto mapper without `title=evaluator.definition.description` drift
  - GET /achievements/catalog response shape with one fewer redundant field per item
affects: [06-drifts-y-polish, future API consumers of /achievements/catalog]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DTO field cleanup: remove fields that duplicate sibling values rather than synthesizing new sources"

key-files:
  created:
    - .planning/phases/06-drifts-y-polish/06-01-SUMMARY.md
  modified:
    - backend/schemas/achievement.py
    - backend/mappers/achievement_mapper.py
    - frontend/src/types/index.ts
    - backend/tests/test_achievement_schemas.py
    - frontend/src/test/components/AchievementCatalog.test.tsx

key-decisions:
  - "Removed AchievementCatalogItemDTO.title rather than synthesizing a distinct value — the registry has no human-readable source different from `description`, and inventing one would be unsourced"
  - "Test fixtures (backend schema test + frontend mockCatalog) had to drop the `title` key/kwarg as part of Task 3; this is the same drift reflected at fixture level, not a new deviation"
  - "Sibling DTOs (AchievementUnlockedDTO, PlayerAchievementDTO, AchievementTierInfoDTO) keep their legitimate `title` field — sourced from the unlocked/persisted tier"

patterns-established:
  - "Drift closure via reductive change: when a DTO field duplicates a sibling, remove it from contract instead of populating with synthesized values"

requirements-completed: [API-03]
gap_closure: [drift-AchievementCatalogItemDTO-title]

# Metrics
duration: 12min
completed: 2026-04-28
---

# Phase 06 Plan 01: AchievementCatalogItemDTO `title` Drift Closure Summary

**Removed redundant `title` field from `AchievementCatalogItemDTO` across backend (Pydantic schema + mapper) and frontend (TypeScript interface), closing the v1.0 audit drift §4 where the field duplicated `description`.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-28T14:50:00Z (approx)
- **Completed:** 2026-04-28T15:01:54Z
- **Tasks:** 3
- **Files modified:** 5 (3 production + 2 test fixtures)

## Accomplishments

- Closed `drift-AchievementCatalogItemDTO-title` from the v1.0 milestone audit (Phase 02 §4, severity low)
- `AchievementCatalogItemDTO` no longer exposes a `title` field on either side of the API boundary
- `build_catalog_item_dto` mapper no longer assigns `title=evaluator.definition.description`
- Backend test suite remains green: 176/176 passed in Docker (`make test-backend`)
- Frontend typecheck (`tsc -b`) clean and vitest 122/122 passed across 16 test files
- Catalog page (`AchievementCatalog.tsx`) renders identically — it never read `item.title`, only `item.description` and `tier.title` (sibling DTO)

## Task Commits

Each task committed atomically with `--no-verify` (parallel worktree convention):

1. **Task 1: Eliminar `title` del schema y del mapper de catálogo en backend** — `e937f1e` (refactor)
2. **Task 2: Eliminar `title` de la interfaz TypeScript AchievementCatalogItemDTO** — `d84dbfe` (refactor)
3. **Task 3: Validar suite backend (Docker) + typecheck/vitest frontend** — `f66bd7c` (test)

## Files Created/Modified

### Production code (3 files)

- `backend/schemas/achievement.py` — Removed `title: str` from `AchievementCatalogItemDTO` (1 line deleted). Sibling classes (`AchievementUnlockedDTO`, `PlayerAchievementDTO`, `AchievementTierInfoDTO`) untouched — their `title` is legitimate.
- `backend/mappers/achievement_mapper.py` — Removed `title=evaluator.definition.description` kwarg from `build_catalog_item_dto` (1 line deleted). `evaluation_result_to_unlocked_dto` and `build_player_achievement_dto` untouched — they resolve `title` from the matched tier (legitimate).
- `frontend/src/types/index.ts` — Removed `title: string` from `AchievementCatalogItemDTO` interface (1 line deleted). Sibling interfaces preserved.

### Test fixtures (2 files)

- `backend/tests/test_achievement_schemas.py` — Dropped `title="Colono"` kwarg from `TestAchievementCatalogItemDTO.test_serializes_with_tiers_and_holders` (1 line deleted). Same drift reflected at fixture level.
- `frontend/src/test/components/AchievementCatalog.test.tsx` — Dropped `title:` keys from two mock catalog items (`high_score` and `games_played`). Tier-level `title` keys inside `tiers[]` preserved — those are `AchievementTierInfoDTO.title`, a legitimate sibling field consumed by `tier.title` in the modal.

## Decisions Made

- **Removal over re-population:** The audit allowed either fixing the mapper to populate a distinct `title` value, or removing the field. There is no separate human title source in the registry — all titles live at tier level. Removing was the source-faithful choice. (Already captured in the plan rationale.)
- **No DB migration:** The `player_achievements` table never persisted catalog `title`; the field was constructed at response time only. Cleanup is contract-only.
- **Route-level response_model untouched:** `AchievementCatalogResponseDTO` still wraps `list[AchievementCatalogItemDTO]`; FastAPI's automatic Pydantic serialization picks up the field removal without route changes.

## Deviations from Plan

None — plan executed exactly as written.

The two test fixture updates (one backend, two frontend mocks) were anticipated by the plan's Task 3 instructions ("Si falla algún test… eliminar el kwarg `title=...`"). Both fixtures were updated pre-emptively after the read_first grep in Task 3 surfaced them, then validated by `make test-backend` and `npm run typecheck && npm test -- --run`. No code was reintroduced into the schemas or mapper to "satisfy" tests — the fixtures were the ones drifting.

## Issues Encountered

- Frontend `node_modules` was missing in the worktree at the start of Task 3, so `npm run typecheck` failed with `tsc: command not found`. Resolved by running `npm install` (added 194 packages, 6s). This is expected for a fresh worktree and not a code issue. Subsequent typecheck and vitest both clean.

## Verification Evidence

```
=== backend schema ===
PASS: AchievementCatalogItemDTO has no title field

=== mapper ===
PASS: mapper does not assign title=evaluator.definition.description

=== frontend interface ===
PASS: TS interface AchievementCatalogItemDTO has no title

=== legitimate sibling DTOs intact ===
PASS: AchievementUnlockedDTO.title preserved
PASS: AchievementTierInfoDTO.title preserved
```

```
make test-backend
... 176 passed in 2.58s
```

```
cd frontend && npm run typecheck
> tsc -b
(exit 0, no output)
```

```
cd frontend && npm test -- --run --reporter=basic
... Test Files  16 passed (16)
    Tests  122 passed (122)
    Duration  5.28s
```

## User Setup Required

None — no external service configuration required. Pure refactor of an internal DTO contract.

## Next Phase Readiness

- Drift §4 closed. Audit has additional drifts in §5-§8 to address in subsequent plans of Phase 06.
- API-03 requirement (achievement DTO/mapper drift-free) marked complete.
- No blockers for follow-up plans in this phase.

## Self-Check: PASSED

Verified files exist and commits exist:

- FOUND: `backend/schemas/achievement.py` (modified, in commit e937f1e)
- FOUND: `backend/mappers/achievement_mapper.py` (modified, in commit e937f1e)
- FOUND: `frontend/src/types/index.ts` (modified, in commit d84dbfe)
- FOUND: `backend/tests/test_achievement_schemas.py` (modified, in commit f66bd7c)
- FOUND: `frontend/src/test/components/AchievementCatalog.test.tsx` (modified, in commit f66bd7c)
- FOUND commit: `e937f1e` (Task 1)
- FOUND commit: `d84dbfe` (Task 2)
- FOUND commit: `f66bd7c` (Task 3)

---
*Phase: 06-drifts-y-polish*
*Completed: 2026-04-28*
