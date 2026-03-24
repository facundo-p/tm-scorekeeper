# Project Research Summary

**Project:** Terraforming Mars Scorekeeper — Achievement System
**Domain:** Gamification / Achievement system added to an existing React + FastAPI + PostgreSQL stats app
**Researched:** 2026-03-23
**Confidence:** HIGH (architecture and stack grounded in direct codebase inspection; features MEDIUM due to niche domain)

## Executive Summary

This milestone adds an achievement and gamification layer to an existing, working Terraforming Mars stats tracker. The research is unusually concrete because the codebase is already well-structured: a `record_calculators/` pattern with a base class, evaluators, and a registry already exists, and the achievement system mirrors it exactly. The recommended approach is to follow that established pattern end-to-end — definitions in code, state in DB, evaluation triggered by `create_game`, results surfaced in the API response for frontend display. No new architectural ideas are needed; this is an additive feature that slots into the existing layered architecture.

The minimum viable feature set is well-defined: a backend evaluator pipeline, persistent unlock storage via PostgreSQL upsert, three UI surfaces (end-of-game notification, player profile section, global catalog), and a reconciler for correctness after definition changes. The feature set is deliberately constrained — record-based achievements, leaderboards, and elaborate animations are explicitly excluded. This constraint keeps scope manageable and aligns with the app's character as a personal-group tracker rather than a competitive platform.

The critical risks are operational correctness issues that are easy to build wrong: N+1 query loading per evaluator, TOCTOU race conditions on achievement writes, and the reconciler accidentally downgrading tiers (violating the "permanent achievement" guarantee). All three have clear, tested solutions that must be baked in from the start of the persistence layer implementation. Building the database foundation first — table, upsert pattern, constraint — makes subsequent phases safe.

## Key Findings

### Recommended Stack

The existing stack (React 18, TypeScript, Vite 6, FastAPI, SQLAlchemy >=1.4, PostgreSQL, Alembic) requires only two frontend additions: `lucide-react` for icon fallbacks and `vite-plugin-svgr` for custom SVG icons as React components. No new backend dependencies are needed — PostgreSQL's native `INSERT ... ON CONFLICT DO UPDATE` handles atomic upserts via `sqlalchemy.dialects.postgresql.insert`, and Alembic handles the one required migration.

**Core technologies:**
- `lucide-react ^0.577.0`: Achievement badge fallback icons — tree-shakeable, per-icon imports, ~1400 icons including all TM-relevant ones (trophy, flame, medal, star, gamepad, target)
- `vite-plugin-svgr ^4.5.0`: Transforms `.svg` files into React components at build time via `?react` suffix — enables the custom SVG → Lucide fallback chain without HTTP requests or runtime parsing
- `sqlalchemy.dialects.postgresql.insert`: Atomic upsert with `on_conflict_do_update` and a `where` guard — prevents tier regression and eliminates TOCTOU race conditions at the DB level
- CSS-only progress bar: Two-div pattern with CSS variables — no library needed for a 6px fill bar

The one version concern worth noting: `requirements.txt` currently pins `sqlalchemy>=1.4`. Upgrading to `>=2.0` for this milestone is recommended since 1.4 is end-of-life and the new code should use the 2.0 unified execute style.

### Expected Features

The feature research draws on BGA, NemeStats, and BGStats patterns. The must-have set is focused and non-negotiable for the system to feel complete rather than broken.

**Must have (table stakes):**
- Persistent unlocks that never disappear — core trust guarantee
- End-of-game notification (mini toast: icon + title + new/upgraded label) — without it, players don't know they earned anything
- Player profile achievement section (full badge grid with icon, title, tier, description, progress) — achievements need a home
- Global achievement catalog with locked/unlocked state — discoverability requires knowing what exists
- Progress indicator for accumulated-type achievements only ("7/10 partidas") — motivation hook; single-game achievements stay binary
- Initial achievement catalog (3-5 entries covering all 3 types: single-game, accumulated, combination) — needed to prove the system works end-to-end
- Reconciler (manual/startup) — required for correctness whenever tier thresholds change
- Profile section restructure to accommodate the new Logros section without breaking existing layout

**Should have (competitive differentiators):**
- Differentiated notification: "Nuevo logro!" vs "Logro mejorado!" — competitors (BGA, NemeStats) don't do this; it's a meaningful improvement
- TM-specific achievement definitions with game-knowledge thresholds — generic achievements are table stakes; TM-specific ones are the value
- Win streak / combination evaluator — higher complexity but high perceived value for a game where streaks matter
- SVG custom icons (can ship with Lucide fallbacks and add SVGs progressively)

**Defer (v2+):**
- Contextual "almost there" hint (80%+ toward next tier) — add only if players ask "how close am I?"
- Catalog filtering/search — only valuable once catalog exceeds ~20 entries
- Per-achievement rarity stats — meaningful only with usage data
- Time-based achievements — only worth building if app has sustained daily usage

**Explicitly excluded (anti-features):** Record-based achievements (revocability conflicts with permanence), leaderboards (wrong for small group dynamics), push/email notifications, elaborate unlock animations, hidden/secret achievements, negative/penalty badges.

### Architecture Approach

The architecture mirrors the existing `record_calculators/` pattern with near-identical separation: `AchievementDefinition` dataclasses in code, a base `AchievementEvaluator` ABC, generic evaluators (`SingleGameThresholdEvaluator`, `AccumulatedEvaluator`), custom evaluators (`WinStreakEvaluator`), an `ALL_EVALUATORS` registry, and an `AchievementsService` that orchestrates evaluation and persistence. Only unlock state (`player_id`, `code`, `tier`, `unlocked_at`) goes in the DB. Definitions stay in Python. Progress is computed on-demand from game history. The `evaluate_game()` call is injected into `GamesService.create_game()` post-commit, so the route layer stays thin and the game creation endpoint returns both the game result and the list of newly unlocked achievements in a single response.

**Major components:**
1. `achievement_evaluators/` (backend) — base class, generic evaluators, definitions, registry; mirrors `record_calculators/` exactly
2. `AchievementsService` — orchestrates evaluation + persistence + catalog assembly; keeps route layer thin
3. `AchievementsRepository` — `get_all(player_id)` and `upsert(player_id, code, tier)` backed by atomic PG upsert
4. `achievements_routes.py` — three endpoints: `GET /players/{id}/achievements`, `GET /achievements/catalog`, reconciler trigger
5. `AchievementBadge` + `AchievementBadgeMini` (frontend) — separate components for full profile view and end-game toast; do not collapse into one over-parametrized component
6. `NewAchievementsToast` — post-game notification, receives `unlocked_achievements` as a prop from `GameForm` response handling
7. `AchievementCatalog` page — global view with who-has-what

### Critical Pitfalls

1. **N+1 history loading per evaluator** — load game history once per player before the evaluator loop, not once per evaluator. A player with 5 evaluators and 50 games should trigger 1 DB query for history, not 5. Define the bulk-load pattern before writing any evaluator.

2. **TOCTOU race on achievement writes** — use `INSERT ... ON CONFLICT DO UPDATE` (upsert) from day one in `AchievementsRepository`. Never use conditional insert/update. Add `where computed_tier > persisted_tier` guard to prevent tier regression under concurrency.

3. **Reconciler downgrades** — the reconciler must only upgrade tiers, never lower them. Achievements are permanent by definition. A `computed_tier < persisted_tier` case should be logged, not applied. Make "no downgrade" a test case before shipping the reconciler.

4. **evaluate_game runs before DB commit** — `evaluate_game()` must be called after `games_repository.create()` returns. Evaluators load history from the repository; if the new game isn't committed yet, progress and tier values will be off by one. Document this ordering constraint in `GamesService.create_game()`.

5. **Notification flooding for tier jumps** — if a player jumps from Tier 0 to Tier 3 in one game save (e.g., catching up on multiple unregistered games), emit a single notification for the final tier, not one per intermediate tier. Validate with a scenario where a player crosses multiple tiers.

## Implications for Roadmap

The component dependency graph has clear layers. Backend must precede frontend. Within backend, the DB schema and repository must precede the service, which must precede route integration. The reconciler is independent of the critical path and can be built any time after the service layer exists.

### Phase 1: Database Foundation and Repository

**Rationale:** Everything else depends on the `player_achievements` table and the atomic upsert pattern. Establishing this first eliminates the TOCTOU race condition as a risk for all subsequent phases. The Alembic migration must ship before any evaluator can write state.
**Delivers:** `player_achievements` table with `UniqueConstraint("player_id", "code")`, index on `player_id`, `PlayerAchievement` ORM model, `AchievementsRepository` with `get_all()` and `upsert()` backed by `pg_insert().on_conflict_do_update()`.
**Addresses:** Persistent unlocks (table stakes), unique-per-player constraint
**Avoids:** TOCTOU race (Pitfall 2), tier regression on concurrent writes

### Phase 2: Backend Evaluator Pipeline

**Rationale:** The evaluators and definitions are the core of the system. Building them in isolation (before wiring into `create_game`) allows thorough unit testing with no side effects. The `ALL_EVALUATORS` registry pattern is already proven by `ALL_CALCULATORS`.
**Delivers:** `AchievementDefinition` dataclasses, `AchievementEvaluator` ABC, `SingleGameThresholdEvaluator`, `AccumulatedEvaluator`, `WinStreakEvaluator`, initial achievement catalog (3-5 achievements, one of each type), `ALL_EVALUATORS` registry.
**Uses:** Existing `record_calculators/` pattern as the structural template
**Avoids:** N+1 loading (Pitfall 1) — bulk-load pattern defined here before evaluators are used in service

### Phase 3: AchievementsService and create_game Integration

**Rationale:** Once evaluators and repository exist, the service layer can be built and wired. This is the most integration-sensitive phase — evaluation must run after game commit, the response must carry unlock results, and error handling must not let an evaluator bug crash game creation.
**Delivers:** `AchievementsService.evaluate_game()` (bulk-load, evaluate, upsert), `AchievementsService.get_player_achievements()` (on-demand progress), `AchievementsService.get_catalog()`, modified `GamesService.create_game()` returning `GameCreatedResponseDTO` with `unlocked_achievements`, `achievements_routes.py` (3 endpoints).
**Avoids:** Progress inconsistency (Pitfall 4) — ordering constraint enforced here; Notification flooding (Pitfall 5) — single result per achievement returned from service

### Phase 4: Frontend Profile and Catalog

**Rationale:** With the API fully operational, frontend views can be built against real data. Profile section restructure (Stats / Records / Logros tabs) and the catalog page are independent of each other but share the same API client and badge components.
**Delivers:** `api/achievements.ts` typed fetch wrappers, `AchievementBadge` component (full profile card), `AchievementsSection` (badge grid), `PlayerProfile` Logros tab, `AchievementCatalog` page, TypeScript types for all achievement DTOs. Frontend icon setup: `lucide-react` install + `vite-plugin-svgr` config + `?react` imports.
**Implements:** Profile view (Flow 2), Catalog view (Flow 3)

### Phase 5: End-of-Game Notification

**Rationale:** This phase wires the frontend to the achievement results already returned by `POST /games/`. It is last because it depends on the `GameCreatedResponseDTO` shape being stable (Phase 3) and the badge component existing (Phase 4). It is also the phase most exposed to the notification flooding pitfall.
**Delivers:** `AchievementBadgeMini` component, `NewAchievementsToast` component, `GameForm` modification to read `unlocked_achievements` from response and conditionally show the toast, CSS animation (fade-in only, no library).
**Avoids:** Notification flooding (Pitfall 5) — validates multi-tier jump scenario; Elaborate animation scope creep (anti-feature)

### Phase 6: Reconciler

**Rationale:** The reconciler is a correctness infrastructure tool, not a user-facing feature. It belongs last because it requires the full evaluator pipeline to exist but is independent of the game creation flow and all UI. It can also be used retroactively to populate achievements for games already in the DB before the system launched.
**Delivers:** `AchievementsReconciler.run()` (upgrade-only, logs discrepancies without downgrading), CLI trigger, reconciler test suite including the "no downgrade" invariant.
**Avoids:** Reconciler downgrades (Pitfall 6), Definition/DB tier drift (Pitfall 3)

### Phase Ordering Rationale

- DB migration must precede all writes; repository must precede service; service must precede routes; routes must precede frontend. This is the standard bottom-up dependency order.
- Evaluators are isolated from persistence intentionally so they can be tested with in-memory data before the service wires them to the DB.
- The end-of-game notification is last among user-facing features because it depends on both the API response shape and the badge component — building it last avoids rework.
- The reconciler is deliberately decoupled from the critical path and earns its own phase to ensure the no-downgrade invariant is explicitly tested rather than assumed.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Service + create_game integration):** The `GamesService` dependency injection pattern needs to be confirmed against the actual service constructor. The `GameCreatedResponseDTO` schema change is a breaking change for the frontend — needs careful coordination.
- **Phase 5 (End-of-game notification):** The existing `GameForm` post-submit flow and any existing result modal need to be inspected to understand z-index/ordering implications before adding the toast.

Phases with standard patterns (can skip research-phase):
- **Phase 1 (DB + Repository):** Alembic migration and SQLAlchemy upsert patterns are HIGH confidence and fully documented in STACK.md.
- **Phase 2 (Evaluators):** Mirrors `record_calculators/` exactly. Pattern is in-codebase and well-understood.
- **Phase 4 (Frontend components):** Standard React component + CSS Modules pattern. Lucide and vite-plugin-svgr setup is documented in STACK.md.
- **Phase 6 (Reconciler):** Logic is simple iteration; the only non-obvious constraint (no downgrade) is documented and testable.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Lucide and vite-plugin-svgr confirmed on npm/GitHub. SQLAlchemy upsert verified against official docs. CSS progress bar is universal. |
| Features | MEDIUM | Core table-stakes are HIGH confidence. TM-specific achievement threshold values and the initial catalog design are not researched — those are design decisions to be made during planning. |
| Architecture | HIGH | Based on direct codebase inspection. The `record_calculators/` mirror pattern is already validated by the working records system. |
| Pitfalls | HIGH | N+1 and TOCTOU are established backend engineering patterns. Reconciler no-downgrade is derived from the explicit PROJECT.md requirement. Notification flooding is documented by real user reports (Steam community). |

**Overall confidence:** HIGH for implementation approach. MEDIUM for initial achievement catalog design (which achievements to create, what thresholds make sense for TM gameplay at this group's scale).

### Gaps to Address

- **Initial achievement catalog design:** Research did not specify which 3-5 achievements to build first or what thresholds are appropriate for this player group's game history. This is a design decision for the planning phase, not researchable from external sources. Recommend inspecting actual game history to set meaningful thresholds (e.g., what score constitutes "high" for this group).
- **GameCreatedResponseDTO breaking change:** The existing frontend consumers of `POST /games/` need to be audited before Phase 3 to confirm nothing breaks when `unlocked_achievements` is added to the response. Additive JSON fields are typically safe, but the TypeScript types need updating.
- **PlayerProfile existing layout:** Phase 4 restructures the profile into tabs (Stats / Records / Logros). The current layout needs to be reviewed to assess restructuring complexity before the phase begins.
- **SQLAlchemy version upgrade:** Upgrading `sqlalchemy>=1.4` to `>=2.0` in `requirements.txt` is recommended but should be validated against the existing ORM usage in the codebase to ensure no 1.4-specific patterns would break.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `record_calculators/`, `GamesService`, `PlayerProfile`, `db/models.py`, existing routes and repository patterns
- [lucide-react on npm](https://www.npmjs.com/package/lucide-react) — version 0.577.0 confirmed
- [vite-plugin-svgr GitHub releases](https://github.com/pd4d10/vite-plugin-svgr/releases) — v4.5.0 confirmed, `?react` suffix API
- [SQLAlchemy PostgreSQL dialect docs](https://docs.sqlalchemy.org/en/21/dialects/postgresql.html) — `on_conflict_do_update` with `constraint` and `where` params
- [NemeStats Badges and Achievements](https://nemestats.com/Home/AboutBadgesAndAchievements) — tier patterns, permanent achievement design
- SQLAlchemy N+1 prevention patterns — established backend engineering knowledge

### Secondary (MEDIUM confidence)
- [BGA Achievements FAQ](https://forum.boardgamearena.com/viewtopic.php?t=15001) — catalog approach, tier display patterns
- [Collectible Achievements UX Pattern](https://ui-patterns.com/patterns/CollectibleAchievements) — difficulty curve, quality over quantity
- [Why Badges Fail in Gamification](https://www.gamedeveloper.com/design/why-badges-fail-in-gamification-4-strategies-to-make-them-work-properly) — anti-pattern analysis
- [Steam community thread on notification spam](https://forum.paradoxplaza.com/forum/threads/excessive-notification-spam-for-progress-on-steam-achievements-1-1000-2-1000-3-1000-etc.1604503/) — notification flooding, real user reports

### Tertiary (LOW confidence)
- [Gamification Design Patterns 2025 — Smartico](https://www.smartico.ai/blog-post/gamification-strategies-in-2025) — general gamification principles (marketing source)
- [Why Badges Fail — Gamify](https://www.gamify.com/gamification-blog/7-gamification-mistakes-and-how-to-avoid-them) — generic, not code-level

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
