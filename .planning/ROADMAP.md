# Roadmap: Terraforming Mars Stats

## Milestones

- v1.0 Sistema de Logros — Phases 1-4 (shipped 2026-04-01) + Cleanup Phases 5-7 (post-ship)

## Phases

<details>
<summary>v1.0 Sistema de Logros (Phases 1-4) — SHIPPED 2026-04-01</summary>

- [x] Phase 1: Backend Core (2/2 plans) — completed 2026-03-31
- [x] Phase 2: Integración y API (2/2 plans) — completed 2026-03-31
- [x] Phase 3: Frontend (3/3 plans) — completed 2026-04-01
- [x] Phase 4: Reconciliador (1/1 plan) — completed 2026-04-01

</details>

### v1.0 Cleanup (post-ship) — closes gaps from `v1.0-MILESTONE-AUDIT.md`

- [ ] **Phase 5: Cleanup integración v1.0** — closes INT-01 (high), INT-02 (medium), FLOW-01
- [ ] **Phase 6: Drifts y polish v1.0** — clears low-severity drifts named in audit §8 / §10
- [ ] **Phase 7: Documentación y proceso v1.0** — reconciles docs with shipped code (12 evaluators) and standardizes SUMMARY frontmatter

#### Phase 5: Cleanup integración v1.0
**Goal:** Restore documented architectural patterns (singleton `AchievementsService` + retry-once on achievement triggers) so v1.0 ships clean against project rules
**Depends on:** Nothing (independent cleanup of existing v1.0 code)
**Requirements:** INTG-03 (architectural), TOOL-02 (architectural), ENDG-01 (retry behavior)
**Gap Closure:** INT-01, INT-02, FLOW-01
**Success Criteria:**
  1. `services/container.py` exposes `achievements_service` as a singleton; `games_routes`, `players_routes`, `achievements_routes` import it (no local instantiation)
  2. `GameRecords.tsx` calls `useGames.fetchAchievements` (retry-once preserved); no direct `triggerAchievements` + bare `.catch(() => {})` anywhere
  3. All 131+ existing tests still pass
**Plans:** 2 plans
- [ ] 05-01-PLAN.md — Backend: AchievementsService singleton en services/container.py + 3 routers refactorizados (cierra INT-01)
- [ ] 05-02-PLAN.md — Frontend: GameRecords.tsx consume useGames.fetchAchievements (cierra INT-02 / FLOW-01)

#### Phase 6: Drifts y polish v1.0
**Goal:** Eliminate dead/misleading code surface area flagged as low-severity drifts
**Depends on:** Nothing
**Requirements:** API-03 (DTO consistency), ENDG-02/ENDG-03 (badge props), PROF-02 (card props)
**Gap Closure:** Audit tech_debt items — `AchievementCatalogItemDTO.title` mapper drift, `AchievementBadgeMini.is_upgrade` unused prop, `AchievementCard.max_tier` unused prop, cosmetic blank-line cleanup in `games_routes.py`
**Success Criteria:**
  1. `AchievementCatalogItemDTO.title` carries a value distinct from `description` (or the field is removed from DTO + frontend usage)
  2. `AchievementBadgeMini` and `AchievementCard` declare only props they actually consume; parent components stop passing the removed props
  3. Backend lint/format clean on `games_routes.py`
**Plans:** TBD via `/gsd-plan-phase 6`

#### Phase 7: Documentación y proceso v1.0
**Goal:** Bring shipped documentation in sync with shipped code and standardize plan SUMMARY frontmatter
**Depends on:** Nothing
**Requirements:** None (process/documentation phase)
**Gap Closure:** Audit cross-cutting tech_debt — evaluator count drift (5 documented vs 12 shipped) and SUMMARY frontmatter inconsistency (only 2 of 8 SUMMARYs carry standardized requirements list)
**Success Criteria:**
  1. `MILESTONES.md`, Phase 01 SUMMARY, and `RETROSPECTIVE.md` accurately list the 12 evaluators registered in `registry.py`
  2. All 8 v1.0 plan SUMMARYs carry `requirements` / `requirements-completed` frontmatter
  3. Audit re-run shows zero `tech_debt` items in the doc/process category
**Plans:** TBD via `/gsd-plan-phase 7`

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Backend Core | v1.0 | 2/2 | Complete | 2026-03-31 |
| 2. Integración y API | v1.0 | 2/2 | Complete | 2026-03-31 |
| 3. Frontend | v1.0 | 3/3 | Complete | 2026-04-01 |
| 4. Reconciliador | v1.0 | 1/1 | Complete | 2026-04-01 |
| 5. Cleanup integración | v1.0 cleanup | 0/? | Pending | — |
| 6. Drifts y polish | v1.0 cleanup | 0/? | Pending | — |
| 7. Documentación y proceso | v1.0 cleanup | 0/? | Pending | — |
