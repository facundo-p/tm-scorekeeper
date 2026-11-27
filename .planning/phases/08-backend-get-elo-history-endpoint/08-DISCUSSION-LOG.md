# Phase 8: Backend `GET /elo/history` endpoint - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 08-backend-get-elo-history-endpoint
**Areas discussed:** Route placement, Active-but-no-games players, player_ids vs active filter, Repository / filter shape

---

## Route placement

| Option | Description | Selected |
|--------|-------------|----------|
| New routes/elo_routes.py | Dedicated file for /elo prefix; future ELO endpoints (peak/rank/leaderboard) extend here. Mirrors achievements_routes.py. | ✓ |
| Extend games_routes.py | Add to existing file that already has /games/{id}/elo, but /elo/history isn't game-scoped — prefix mismatch. | |
| Extend players_routes.py | Players routes touch player.elo, but /elo/history isn't nested under /players/{id} — same prefix mismatch. | |

**User's choice:** New routes/elo_routes.py
**Notes:** Recommended option chosen — clean prefix, room for /elo to grow with future endpoints.

---

## Active-but-no-games players

| Option | Description | Selected |
|--------|-------------|----------|
| Drop them from response | Only return players with at least one point in the window. Cleaner contract, smaller payload, frontend never handles empty series. | ✓ |
| Include with points: [] | Return every active player even with no history; frontend filters empty series. | |
| Include with seeded 1000 baseline | Synthesize a point at today with elo_after=1000 — invents data the backend never recorded; conflicts with PROF-04 ("— not 1000 for 0-game players"). | |

**User's choice:** Drop them from response
**Notes:** Aligns with PROF-04 (0-games players show "—", not 1000) and removes a class of empty-state handling on the frontend.

---

## player_ids vs active filter

| Option | Description | Selected |
|--------|-------------|----------|
| player_ids overrides active | Explicit player_ids = explicit opt-in; serves history regardless of active flag. Old shared URLs with deactivated players still render the chart. | ✓ |
| Always intersect with active | Active filter wins; inactive players silently dropped even when named. Simpler invariant but two silent-drop reasons (unknown + inactive) frontend can't distinguish. | |
| No active filter when player_ids passed | When player_ids is present, return whoever is named with no active scoping. | |

**User's choice:** player_ids overrides active
**Notes:** Lines up with RANK-06 frontend behavior — frontend already intersects URL ids against active before calling, so any inactive id reaching the backend is intentional.

---

## Repository / filter shape

| Option | Description | Selected |
|--------|-------------|----------|
| New EloHistoryFilter + repo.get_history(filter) | New dataclass in repositories/elo_filters.py; one indexed query against PlayerEloHistory; filter logic centralized on the dataclass per prior feedback. | ✓ |
| Extend GameFilter, walk per-game in service | Reuses existing filter but does N queries and conflates two domains. | |
| Add method with raw kwargs | EloRepository.get_history(date_from, player_ids) without dataclass — spreads filter shape across signatures. | |

**User's choice:** New EloHistoryFilter + repo.get_history(filter)
**Notes:** Honors the project rule "filter capabilities go on the existing/new filter dataclass; services don't reimplement filter logic". Single indexed scan instead of N per-game queries.

---

## Claude's Discretion

- Exact name of the service method (`get_history` vs `list_player_history`)
- Whether the route function destructures the service result inline or via mapper helper
- Internal naming of `EloHistoryFilter` private fields
- Test fixture builders (likely reuse existing `conftest.py` patterns)

## Deferred Ideas

- Leaderboard endpoint (Phase 12 may compute client-side from /elo/history; separate route only if surface need emerges)
- Pagination / limit (revisit only if dataset grows beyond hundreds of points)
- Per-game markers / events on chart line (coupled to deferred records redesign)
- Peak rating endpoint (Phase 9 derives peak client-side from this response)
