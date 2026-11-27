---
phase: 9
slug: playerprofile-elo-surface-frontend-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Backend Framework** | pytest (Docker-only via `docker-compose.test.yml`) |
| **Backend Config file** | `backend/tests/conftest.py` (autouse `setup_db` + `clean_tables`) |
| **Backend Quick run command** | `docker compose -f docker-compose.test.yml down && docker compose -f docker-compose.test.yml run --rm --build backend_test sh -c "alembic upgrade head && python -m pytest tests/integration/test_elo_summary_endpoint.py -q" && docker compose -f docker-compose.test.yml down` |
| **Backend Full suite command** | `make test-backend` |
| **Backend Estimated runtime** | ~45s for the new file; ~3min for full suite |
| **Frontend Framework** | Vitest 3.x + Testing Library 16.x + jsdom 25 |
| **Frontend Config file** | `frontend/src/test/setup.ts` |
| **Frontend Quick run command** | `cd frontend && npm run test -- src/test/components/EloSummaryCard.test.tsx` |
| **Frontend Full suite command** | `cd frontend && npm run test -- --run && cd frontend && npm run typecheck` |
| **Frontend Estimated runtime** | ~5s for the new file; ~30s for full suite + typecheck |

**NEVER run pytest on host** — wipes dev DB. Always Docker.

---

## Sampling Rate

- **Per task commit:**
  - Backend task → `docker compose -f docker-compose.test.yml ... -m pytest tests/integration/test_elo_summary_endpoint.py -q`
  - Frontend task → `cd frontend && npm run test -- src/test/components/EloSummaryCard.test.tsx`
- **Per wave merge:**
  - Backend wave → `make test-backend` (full suite)
  - Frontend wave → `cd frontend && npm run test -- --run && npm run typecheck`
- **Before `/gsd-verify-work`:** Both full suites green + manual smoke test of profile page (5 success criteria + inactive-player edge case).
- **Max feedback latency:** ~45 seconds (backend quick run is the slowest gate).

---

## Per-Task Verification Map

> **Note:** Task IDs filled in as `9-XX-YY` placeholders. Planner replaces these when emitting PLAN.md files. Each row MUST be linked to a real task or to Wave 0.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 9-01-W0a | 01 | 0 | PROF-01..04 | T-9-01 | N/A (test scaffold) | scaffold | (creates `tests/integration/test_elo_summary_endpoint.py`) | ❌ W0 | ⬜ pending |
| 9-01-01 | 01 | 1 | PROF-01 | T-9-01 | Endpoint returns `current_elo` matching `players.elo` | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_returns_current_elo -q` | ❌ W0 | ⬜ pending |
| 9-01-02 | 01 | 1 | PROF-02 | T-9-01 | `last_delta = +N` after winning game | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_returns_last_delta_after_win -q` | ❌ W0 | ⬜ pending |
| 9-01-03 | 01 | 1 | PROF-02, PROF-03, PROF-04 | T-9-01 | 0-games player → all nullable fields = null, current_elo = 1000 | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_zero_games_returns_nulls -q` | ❌ W0 | ⬜ pending |
| 9-01-04 | 01 | 1 | PROF-03 | T-9-01 | `peak_elo = max(elo_after)` over EloChange history | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_returns_peak_elo -q` | ❌ W0 | ⬜ pending |
| 9-01-05 | 01 | 1 | PROF-04 | T-9-01 | Rank `{position, total}` for active player | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_returns_rank_for_active_player -q` | ❌ W0 | ⬜ pending |
| 9-01-06 | 01 | 1 | PROF-04 | T-9-01 | Tie-break by `player_id ASC` (D-06) | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_tie_break_by_player_id -q` | ❌ W0 | ⬜ pending |
| 9-01-07 | 01 | 1 | PROF-04 | T-9-01 | Inactive players excluded from rank pool (D-04) | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_inactive_excluded_from_rank_total -q` | ❌ W0 | ⬜ pending |
| 9-01-08 | 01 | 1 | PROF-04 | T-9-01 | Inactive player → `rank = null` (D-18) | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_inactive_player_gets_null_rank -q` | ❌ W0 | ⬜ pending |
| 9-01-09 | 01 | 1 | PROF-04 | T-9-01 | Single active player → `rank = {1, 1}` | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_single_active_player_rank_one_of_one -q` | ❌ W0 | ⬜ pending |
| 9-01-10 | 01 | 1 | Success #5 | T-9-01 | Profile reflects recomputed ELO after game-edit cascade (no client cache) | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_summary_reflects_cascade_after_edit -q` | ❌ W0 | ⬜ pending |
| 9-02-W0a | 02 | 0 | PROF-01..04 | — | N/A (test scaffold) | scaffold | (creates `frontend/src/test/components/EloSummaryCard.test.tsx`) | ❌ W0 | ⬜ pending |
| 9-02-01 | 02 | 1 | PROF-01 | — | Card renders current ELO as hero number for non-zero player | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "renders current_elo"` | ❌ W0 | ⬜ pending |
| 9-02-02 | 02 | 1 | PROF-01 | — | Card renders `—` (em-dash) when player has 0 games | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "renders em-dash for zero games"` | ❌ W0 | ⬜ pending |
| 9-02-03 | 02 | 1 | PROF-02 | — | `+23` uses success class for positive delta | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "positive delta uses success class"` | ❌ W0 | ⬜ pending |
| 9-02-04 | 02 | 1 | PROF-02 | — | `-12` uses error class for negative delta | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "negative delta uses error class"` | ❌ W0 | ⬜ pending |
| 9-02-05 | 02 | 1 | PROF-02 | — | `±0` uses muted class for zero delta (D-17) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "zero delta uses muted class"` | ❌ W0 | ⬜ pending |
| 9-02-06 | 02 | 1 | PROF-02 | — | Delta span has `aria-label="Cambio de ELO en la última partida: ..."` (D-11) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "delta has aria-label"` | ❌ W0 | ⬜ pending |
| 9-02-07 | 02 | 1 | PROF-02 | — | Delta span hidden when `last_delta === null` (D-17) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "delta hidden when null"` | ❌ W0 | ⬜ pending |
| 9-02-08 | 02 | 1 | PROF-03 | — | "Pico: 1612 · actual" when peak == current (D-16) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "peak equals current shows actual suffix"` | ❌ W0 | ⬜ pending |
| 9-02-09 | 02 | 1 | PROF-03 | — | "Pico: 1612" without suffix when peak > current | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "peak greater than current omits suffix"` | ❌ W0 | ⬜ pending |
| 9-02-10 | 02 | 1 | PROF-03 | — | Peak line hidden when `peak_elo === null` (D-16) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "peak hidden when null"` | ❌ W0 | ⬜ pending |
| 9-02-11 | 02 | 1 | PROF-04 | — | Card renders "#3 de 8" when rank present | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "renders rank"` | ❌ W0 | ⬜ pending |
| 9-02-12 | 02 | 1 | PROF-04 | — | Rank line hidden when `rank === null` (D-18) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "rank hidden when null"` | ❌ W0 | ⬜ pending |
| 9-03-W0a | 03 | 0 | D-14 | T-9-02 | N/A (test scaffold) | scaffold | (creates `frontend/src/test/components/PlayerProfile.test.tsx` if not present) | ❌ W0 | ⬜ pending |
| 9-03-01 | 03 | 2 | D-14 isolation | T-9-02 | Summary fetch failure does NOT break profile render | frontend page | `npm run test -- PlayerProfile.test.tsx -t "summary failure does not block profile"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/integration/test_elo_summary_endpoint.py` — covers all PROF-01..04 backend behaviors + 0-games + tie-break + inactive + cascade-reflection
- [ ] `frontend/src/test/components/EloSummaryCard.test.tsx` — covers PROF-01..04 visual rendering + all nullable branches + delta sign formatting + aria-label + delta colors
- [ ] `frontend/src/test/components/PlayerProfile.test.tsx` — does not yet exist; required for D-14 (summary-failure-isolation). Planner decides: create new file OR fold isolation test into existing test if a sibling exists. Scenario MUST exist.

**Framework install:** None — Vitest, pytest, jsdom, Testing Library, msw all already installed in `package.json` / `requirements.txt`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual hierarchy of EloSummaryCard on real device | success #1 | Tests cannot assert visual prominence vs. statsCard | Open `/players/:id` on iPhone Safari + Android Chrome (per CLAUDE.md mobile-first); confirm hero card stacks above the existing 3-tile grid; ELO number is visually larger than tile values |
| Color contrast of delta against `--color-surface` | success #2 (D-09) | Component test asserts class but not WCAG contrast against background | Inspect rendered card in browser dev tools — verify computed `color` against `--color-surface` ≥ 4.5:1 for green and red variants |
| Profile reflects recomputed ELO after manual game-edit | success #5 (D-19) | Cascade test exists at backend; full E2E user-facing flow needs human confirmation | Edit an old game from `/games/:id` → navigate back to `/players/:id` → confirm current_elo + delta reflect cascade without page-refresh hack |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter (toggled when execute-phase confirms tests pass)

**Approval:** pending
