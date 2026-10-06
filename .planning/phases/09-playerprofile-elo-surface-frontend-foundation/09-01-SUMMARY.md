---
phase: 09-playerprofile-elo-surface-frontend-foundation
plan: 01
subsystem: api
tags: [fastapi, pydantic, sqlalchemy, postgres, elo, integration-tests, docker]

# Dependency graph
requires:
  - phase: pre-milestone (PR #42 — backend ELO system)
    provides: EloService.recompute_from_date, PlayerEloHistory ORM, players.elo column, EloChange domain model
provides:
  - GET /players/{player_id}/elo-summary endpoint returning {current_elo, peak_elo, last_delta, rank}
  - PlayerEloSummaryDTO + EloRankDTO Pydantic v2 schemas (D-02 shape)
  - EloRepository.get_peak_for_player + get_last_change_for_player
  - PlayersRepository.get_active_players_ranked (active-only, elo DESC, player_id ASC)
  - EloService.get_summary_for_player composing the three new methods
  - 11 integration tests pinning PROF-01..PROF-04 backend behavior
affects:
  - 09-02 (frontend EloSummaryCard component will mock this DTO shape)
  - 09-03 (frontend PlayerProfile page integration consumes this endpoint)
  - 12 (leaderboard plan can reuse get_active_players_ranked + summary endpoint)

# Tech tracking
tech-stack:
  added: [] # zero new external dependencies — only sqlalchemy.func used (already installed)
  patterns:
    - "Service composes 3 repositories via singleton container — no session held in service"
    - "On-the-fly aggregation (MAX elo_after) instead of denormalized peak_elo column — D-03 no-drift guarantee"
    - "KeyError → HTTPException(404) idiom mirrored verbatim from get_player_profile"
    - "Pydantic v2 Optional[T] = None for nullable fields (consistent with schemas/player.py)"

key-files:
  created:
    - backend/schemas/elo_summary.py
    - backend/tests/integration/test_elo_summary_endpoint.py
    - .planning/phases/09-playerprofile-elo-surface-frontend-foundation/09-01-SUMMARY.md
  modified:
    - backend/repositories/elo_repository.py
    - backend/repositories/player_repository.py
    - backend/services/elo_service.py
    - backend/routes/players_routes.py

key-decisions:
  - "Mapper layer skipped: EloService.get_summary_for_player constructs PlayerEloSummaryDTO inline because the transformation is genuinely 1:1 and the method is ≤20 lines (project rule). 09-PATTERNS.md flagged the mapper as conditional; conditions for keeping it inline were satisfied."
  - "_compute_rank extracted as a private helper to keep get_summary_for_player ≤20 lines per CLAUDE.md."
  - "Last-change ordering uses recorded_at DESC, game_id DESC for deterministic tie-break on same-day games (consistent with the get_baseline_elo_before pattern)."
  - "Test for 404 asserts 'does-not-exist' substring in body['detail'] to distinguish FastAPI's default 'Not Found' from our route handler's helpful message — verifies the new route was actually hit, not a path-not-matched fallback."

patterns-established:
  - "Pydantic v2 schema with Optional[T] = None for nullable response fields (matches schemas/player.py:35-37 convention)"
  - "Aggregate scalar query via session.query(func.max(...)).scalar() returning None for empty sets"
  - "Active-only ordered list via session.query(ORM).filter(is_active.is_(True)).order_by(elo.desc(), id.asc())"
  - "Service-level rank computation by linear scan of get_active_players_ranked (deterministic, <100 active players in domain — no SQL window function needed)"

requirements-completed: [PROF-01, PROF-02, PROF-03, PROF-04]

# Metrics
duration: 5min
completed: 2026-04-29
---

# Phase 9 Plan 01: Backend ELO Summary Endpoint Summary

**GET /players/{id}/elo-summary returns {current_elo, peak_elo, last_delta, rank} via three new repo methods composed in EloService — no schema migration, on-the-fly peak aggregation, 11 integration tests GREEN.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-29T16:05:56Z
- **Completed:** 2026-04-29T16:10:43Z
- **Tasks:** 3
- **Files modified:** 4 (1 schema NEW, 1 test NEW, 3 backend modules extended)

## Accomplishments

- Shipped the backend half of Phase 9: a single new GET endpoint surfacing ELO data already maintained by the existing recompute cascade (PR #42).
- Added two read-only repository methods (`get_peak_for_player`, `get_last_change_for_player` on `EloRepository`) and one (`get_active_players_ranked` on `PlayersRepository`) — all using existing ORM relations and indices, zero schema changes.
- Composed everything in a new `EloService.get_summary_for_player` method that respects D-04 (active-only rank), D-05 (0-games returns nullables not 404), D-06 (player_id ASC tie-break), and D-19 (no cache, fresh read each request).
- Locked the contract with 11 integration tests covering every PROF-01..PROF-04 behavior plus cascade-after-edit, single-active-player, inactive-player, and 404 — all GREEN against real Postgres in Docker. Full backend suite at 187 tests, no regression.

## Task Commits

Each task was committed atomically (TDD RED → GREEN cycle):

1. **Task 1: Integration test scaffold (RED)** — `dcc9c93` (test) — 11 failing tests for PROF-01..PROF-04 endpoint behavior.
2. **Task 2: Schema + repos + service (domain layer)** — `57d7f30` (feat) — `PlayerEloSummaryDTO`, `EloRankDTO`, three new repo methods, `get_summary_for_player` + `_compute_rank` helper. Tests still RED at this point (route not wired).
3. **Task 3: Route wiring → GREEN** — `ee8b287` (feat) — `GET /{player_id}/elo-summary` on the players router, `KeyError → HTTPException(404)`. All 11 tests pass; full backend suite 187 passed.

_Note: This plan is `type: tdd` — RED commit (`dcc9c93`) precedes GREEN commit (`ee8b287`). REFACTOR phase was unnecessary (helper extraction was done as part of GREEN to satisfy the ≤20-line method rule)._

## Files Created/Modified

### Created (2 source files + 1 doc)

- `backend/schemas/elo_summary.py` — `EloRankDTO(position: int, total: int)` and `PlayerEloSummaryDTO(current_elo, peak_elo, last_delta, rank)` Pydantic v2 models matching CONTEXT D-02 shape. `Optional[T] = None` convention.
- `backend/tests/integration/test_elo_summary_endpoint.py` — 11 integration tests covering current_elo, last_delta-after-win, zero-games-returns-nulls, peak_elo, rank-for-active-player, tie-break-by-player-id, inactive-excluded-from-rank-total, inactive-player-gets-null-rank, single-active-player-rank-1-of-1, summary-reflects-cascade-after-edit, player-not-found-returns-404. Reuses helpers `_pr / _game_payload / _post_game / _seed_three_players` per project per-file convention.
- `.planning/phases/09-playerprofile-elo-surface-frontend-foundation/09-01-SUMMARY.md` — this file.

### Modified (3 backend modules)

- `backend/repositories/elo_repository.py` — added `from sqlalchemy import func`, `get_peak_for_player(player_id) -> int | None` (MAX(elo_after) scalar), `get_last_change_for_player(player_id) -> EloChange | None` (recorded_at DESC, game_id DESC).
- `backend/repositories/player_repository.py` — added `get_active_players_ranked() -> list[Player]` (`is_active=True`, ordered by `elo DESC, id ASC`).
- `backend/services/elo_service.py` — added `from schemas.elo_summary import EloRankDTO, PlayerEloSummaryDTO`, public `get_summary_for_player`, private `_compute_rank` helper.
- `backend/routes/players_routes.py` — extended import line to include `elo_service` from `services.container`, added `from schemas.elo_summary import PlayerEloSummaryDTO`, added `GET /{player_id}/elo-summary` route handler.

### Verification artifacts (not committed; generated by tests)

- 187/187 tests passing in Docker (`make test-backend`) — pre-plan baseline was 176; the 11 new tests are the entire delta.

## Decisions Made

- **Mapper file deferred (deviation from PATTERNS.md "no analog"):** 09-PATTERNS.md proposed an optional `backend/mappers/elo_summary_mapper.py` to keep symmetry with `elo_mapper.py`. The plan itself called it OPTIONAL, conditioned on the service exceeding 20 lines. `get_summary_for_player` clocks in at 14 lines including the docstring; the inline construction is clearer than indirecting through a 1:1 helper function. No mapper file was created. This matches the plan's `<files_modified>` list (which excluded `mappers/elo_summary_mapper.py`).
- **`_compute_rank` linear scan, not SQL window function:** The active-player set is bounded at < 100 in this domain (per `<threat_model>` T-9-02). A two-line Python `for idx, p in enumerate(...)` is simpler than a `RANK() OVER (ORDER BY elo DESC, id ASC)` subquery, and it matches the existing repository pattern (return domain models, do composition in service).
- **`recorded_at DESC, game_id DESC` ordering for last-change:** Two games on the same day for the same player would otherwise tie. `game_id DESC` provides a deterministic secondary key. This matches the project's existing tie-break style (`get_baseline_elo_before` orders by `(player_id, recorded_at, game_id)`).
- **Test 404 detail-string assertion:** The 404 test asserts `'does-not-exist' in body['detail']` rather than equality to FastAPI's default `'Not Found'`, which proves the route handler's custom `f"Player '{player_id}' not found"` message was actually produced. Without this, a typo in the route path would still yield a 404 (FastAPI default) and the test would silently pass against the wrong code path.

## Deviations from Plan

None — plan executed exactly as written. The only borderline call was the optional mapper file (09-PATTERNS.md flagged it conditional on service-method length); the conditions for skipping it were satisfied per the plan's own guidance, so this is execution-of-plan, not deviation.

## Issues Encountered

- **Initial `--collect-only` flag dropped by docker-compose entrypoint:** The Task 1 verify command included `--collect-only`, but the Docker entrypoint passes the test path directly to pytest with `-q`, so the flag was ignored and the suite ran fully. The result was actually MORE informative — 11 expected failures + 176 unrelated passes proved the new test file did not break collection or imports. Treated as expected behavior; no fix needed.
- **No flaky tests, no transient failures, no Docker rebuild loops.** The TDD cycle completed in one pass per task.

## Threat Model Dispositions (T-9-01..T-9-06)

The plan's `<threat_model>` documented 6 STRIDE threats with explicit dispositions. All accepted/mitigated as planned, with the following execution notes:

| Threat | Disposition | Verification at execution |
|--------|-------------|---------------------------|
| **T-9-01** (IDOR — any authenticated user can read any player's summary) | accept | The new route inherits the same router-level auth posture as `get_player_profile` (sibling on the same `players` router). This app currently has no router-level auth dependency on `players_routes.py` — by app design (TM Stats is a solo-developer side project for a friend group). The route was deliberately mounted under the same dependency chain as `/players/{id}/profile`, so any future auth guard added at the router level applies uniformly. **No new auth divergence introduced by this plan.** |
| **T-9-02** (DoS — three queries per request) | mitigate | Verified: `PlayerEloHistory.player_id` and `recorded_at` are indexed at the ORM level (`backend/db/models.py:118-123` — `index=True` on both). `players.is_active` is not indexed, but the active-player count is bounded (< 20 in the production domain) so the full scan is O(N) over a tiny N. Each `get_summary_for_player` call issues exactly 4 queries (player.get + peak scalar + last-change first + active list) — no N+1. Sub-millisecond at realistic scale. |
| **T-9-03** (Spoofing — player_id path param) | accept | `PlayerORM.id` is a primary key with a unique constraint (existing schema). No spoofing risk. |
| **T-9-04** (Tampering — read-only endpoint) | accept | GET-only. No write surface introduced. |
| **T-9-05** (Privilege escalation) | accept | No role hierarchy in the project domain. |
| **T-9-06** (Information disclosure via error messages) | accept | The 404 message echoes the input id (`f"Player '{player_id}' not found"`), matching the existing `get_player_profile` idiom verbatim. ASVS L1 V7.4 satisfied — no stack trace, no DB error, no internal path leaked. |

**Active follow-up flagged for PR review (out of scope for this plan):**
- If the project ever adopts a router-level auth dependency, ensure the new `/elo-summary` route is included automatically by virtue of being on the same router. (Verified: it is.)
- If the active-player count ever exceeds ~1000, add an index on `players.is_active` to keep T-9-02 in the "mitigate" column. (Currently bounded at < 20 — out of phase 9 scope.)

## User Setup Required

None — no environment variables, no external services, no migrations. The endpoint reads from the existing `players` and `player_elo_history` tables which are already populated by PR #42.

## Next Phase Readiness

- **Plan 09-02 (frontend EloSummaryCard component) — UNBLOCKED:** the `PlayerEloSummaryDTO` shape is locked in `backend/schemas/elo_summary.py`; the frontend can mirror it in `frontend/src/types/index.ts` with confidence.
- **Plan 09-03 (frontend PlayerProfile integration) — UNBLOCKED:** the live endpoint at `GET /players/{id}/elo-summary` is consumable end-to-end. No mock layer needed; the frontend can hit real data via the dev backend.
- **Phase 12 (leaderboard) — UNBLOCKED:** `PlayersRepository.get_active_players_ranked` is reusable verbatim; rank computation can be lifted to a separate service method later if needed.
- **No blockers, no concerns.** The cascade-after-edit test confirms D-19 (no client cache) is honored end-to-end.

## Self-Check: PASSED

Verified:
- File `backend/schemas/elo_summary.py` exists.
- File `backend/tests/integration/test_elo_summary_endpoint.py` exists with 11 `def test_` lines.
- Files `backend/repositories/elo_repository.py`, `backend/repositories/player_repository.py`, `backend/services/elo_service.py`, `backend/routes/players_routes.py` modified with the expected new symbols (`get_peak_for_player`, `get_last_change_for_player`, `get_active_players_ranked`, `get_summary_for_player`, `_compute_rank`, `/{player_id}/elo-summary`).
- Commits `dcc9c93`, `57d7f30`, `ee8b287` exist in `git log`.
- `make test-backend` reports 187 passed, 0 failed.

---
*Phase: 09-playerprofile-elo-surface-frontend-foundation*
*Completed: 2026-04-29*
