# Milestones

## v1.0 Sistema de Logros (Shipped: 2026-04-02)

**Phases completed:** 4 phases, 8 plans

**Key accomplishments:**

- 4 achievement evaluator types (SingleGameThreshold, Accumulated, WinStreak, AllMaps) and **12 evaluator definitions** registered in `ALL_EVALUATORS` (high_score, games_played, games_won, win_streak, greenery_tiles, all_maps, milestone_master, no_milestone_win, award_master, no_award_win, stolen_awards, card_points)
- Persistence layer with atomic upsert (no-tier-downgrade enforced at DB level via `ON CONFLICT DO UPDATE`)
- 3 achievement REST endpoints wired to `AchievementsService` (POST evaluate-for-game, GET player achievements, GET catalog with holders) plus 8 TypeScript interfaces and `useGames.fetchAchievements` retry hook
- Frontend: post-game `AchievementModal`, profile tab with `AchievementCard`, `AchievementCatalog` page, `AchievementIcon` with Lucide fallback
- Reconciliation tool (POST /achievements/reconcile) for backfill and consistency repair

For details: [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

---

## v1.0-cleanup Post-ship cleanup (Shipped: 2026-04-28)

**Phases completed:** 3 phases, 7 plans (continuation of v1.0; closes audit gaps)

**Key accomplishments:**

- Closed all v1.0-MILESTONE-AUDIT.md gaps: 1 high (INT-01 singleton), 2 medium (INT-02/FLOW-01 retry contract), 4 low-severity drifts, 3 cross-cutting tech_debt items
- `AchievementsService` centralized as singleton in `services/container.py`; 3 routers refactored to consume it (closes the project-rule violation `feedback_container_per_layer`)
- Phase 02 D-09/D-10 retry contract restored to live UI path: `GameRecords.tsx` consumes `useGames.fetchAchievements` with `if (!data) return` guard; 9 new vitest cases lock the contract
- Dead-code removed: `AchievementCatalogItemDTO.title` (was duplicate of description), `AchievementBadgeMini.is_upgrade` and `AchievementCard.max_tier` (declared but never used)
- Documentation reconciled: 8 v1.0 SUMMARYs now carry standardized top-level `requirements:` / `requirements-completed:` frontmatter; "5 evaluators" drift corrected to actual 12
- Zero behavior changes for end users — DI cleanup + dead code removal + doc reconciliation

For details: [v1.0-cleanup-ROADMAP.md](milestones/v1.0-cleanup-ROADMAP.md)

---
