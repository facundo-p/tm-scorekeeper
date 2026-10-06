# Phase 8: Backend `GET /elo/history` endpoint - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a new REST endpoint `GET /elo/history` that exposes the per-player ELO time series the v1.1 Ranking chart needs. Supports optional `from` (date) and `player_ids` filters. No frontend, no chart, no migration — repository data already exists via `PlayerEloHistory`. This phase ratifies the response shape that Phases 9–12 will consume.

</domain>

<decisions>
## Implementation Decisions

### Route placement
- **D-01:** Endpoint lives in a new `backend/routes/elo_routes.py` with `prefix="/elo"`, `tags=["Elo"]`. Register the router in `backend/main.py` alongside the existing four routers (mirrors the `achievements_routes.py` pattern).
- The existing `GET /games/{id}/elo` stays in `games_routes.py` (it is genuinely game-scoped). New per-player and cross-player ELO endpoints go under `/elo` going forward.

### Response semantics
- **D-02:** Players with zero points in the requested window are dropped from the response (no `points: []` entries). The default candidate set is "active players", but a player who is active and has no history in the window simply does not appear in the list. Frontend chart never has to handle empty series.
- **D-03:** When the caller passes `player_ids`, it overrides the active filter — explicit opt-in. Inactive players named in `player_ids` ARE returned with their history. When `player_ids` is absent, the candidate set is "active players only". Unknown ids in `player_ids` are silently dropped (per ROADMAP success criterion 3).

### Repository / filter shape
- **D-04:** New `EloHistoryFilter` dataclass in `backend/repositories/elo_filters.py` with `date_from: Optional[date] = None` and `player_ids: Optional[set[str]] = None`. New `EloRepository.get_history(filter: EloHistoryFilter)` method does ONE indexed query against `player_elo_history` (the existing `recorded_at` index covers the `from` filter; `player_id` is also indexed). Filter capabilities live on the dataclass — service does NOT reimplement filter logic.
- Service orchestration: `EloService.get_history(date_from, player_ids)` resolves the candidate player set (active players from `PlayersRepository.get_all()` filtered by `is_active`, OR explicitly named players when `player_ids` is passed), builds the `EloHistoryFilter`, calls the repo, groups rows by `player_id`, and maps to `list[PlayerEloHistoryDTO]`.

### Route validation
- `from` is parsed as `date` via FastAPI's built-in `Query` type-coercion (`from_: Optional[date] = Query(None, alias="from")`). Invalid format triggers FastAPI's automatic 422 response — no custom validator needed.
- `player_ids` is parsed as comma-separated string via `Query` (e.g. `player_ids=p1,p2`), split server-side into a `set[str]`. Empty string and missing param both treated as "no filter".

### Schemas (locks the contract for Phases 9–12)
- Add `EloHistoryPointDTO { recorded_at: date, game_id: str, elo_after: int, delta: int }` to `backend/schemas/elo.py`.
- Add `PlayerEloHistoryDTO { player_id: str, player_name: str, points: list[EloHistoryPointDTO] }` to the same file.
- Existing `EloChangeDTO` is unchanged.
- `recorded_at` serializes as `YYYY-MM-DD` string (Pydantic default for `date`); the frontend treats it as opaque per the timezone pitfall guidance in research.

### Sorting / ordering
- Points within a player are sorted ascending by `(recorded_at, game_id)` — same tuple the recompute walker uses, so re-runs and reads stay consistent.
- Top-level player order is not contractual (frontend assigns colors by id hash, not order), but the implementation should sort by `player_name` for deterministic test fixtures.

### Mappers
- New `elo_history_changes_to_player_dto(player_id, player_name, history_rows)` in `backend/mappers/elo_mapper.py` (alongside the existing `elo_changes_to_dtos`). Reuses the same player-names-map pattern as `games_routes._player_names_map`.

### Container wiring
- `EloService` already exists in `services/container.py` with `elo_repository`, `players_repository`, `games_repository`. The new `get_history` method is added there — no new container entries needed.
- The new route file imports `elo_service` from `services/container.py` (no per-request DI inversion).

### Tests
- Unit test the mapper and the service candidate-resolution logic (mock repos).
- Integration tests in `backend/tests/integration/` covering the four ROADMAP success criteria: no filters → all active players, `from` filter, `player_ids` filter (incl. unknown ids silently dropped), invalid `from` → 422.
- One test runs in `America/Argentina/Buenos_Aires` TZ to enforce no off-by-one drift (success criterion 2). All pytest runs go through `docker-compose.test.yml` per project rule.

### Claude's Discretion
- Exact name of the service method (`get_history` vs `list_player_history`)
- Whether the route function destructures the service result inline or via mapper helper
- Internal naming of `EloHistoryFilter` private fields
- Test fixture builders (likely reuse existing `conftest.py` patterns)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase intent and success criteria
- `.planning/ROADMAP.md` §"Phase 8: Backend GET /elo/history endpoint" — goal, depends-on, requirement mapping, 4 success criteria
- `.planning/REQUIREMENTS.md` §ELO-API-01 — single requirement this phase fulfills
- `.planning/PROJECT.md` §"Current Milestone: v1.1" — milestone framing and constraints

### Research backing the contract
- `.planning/research/SUMMARY.md` — milestone-wide research synthesis; §"Phase 0 — Backend GET /elo/history" defines the expected response shape; §"Gaps to Address" flags pagination as undecided (this phase resolves it: no pagination)
- `.planning/research/ARCHITECTURE.md` — layered backend convention (route → service → repository → mapper)
- `.planning/research/PITFALLS.md` — Pitfall 4 (date filter timezone shift) governs the non-UTC TZ test

### Existing ELO backend (read before extending)
- `backend/services/elo_service.py` — `EloService` constructor, `recompute_from_date`, `_build_baseline`; new `get_history` method goes here
- `backend/repositories/elo_repository.py` — repo to extend with `get_history(filter)`; existing `get_baseline_elo_before` shows the indexed-query pattern
- `backend/repositories/elo_filters.py` — DOES NOT YET EXIST; create alongside the new method (mirrors `repositories/game_filters.py`)
- `backend/repositories/game_filters.py` — pattern reference for `EloHistoryFilter` dataclass (`@dataclass`, `Optional` fields)
- `backend/schemas/elo.py` — `EloChangeDTO` already lives here; add `EloHistoryPointDTO` and `PlayerEloHistoryDTO` to the same file
- `backend/mappers/elo_mapper.py` — `elo_changes_to_dtos` shows the player-names-map pattern to reuse
- `backend/db/models.py` §`PlayerEloHistory` (lines 114–125) — ORM table; `recorded_at` and `player_id` are both indexed
- `backend/routes/games_routes.py` — current `/games/{id}/elo` route + `_player_names_map` helper to imitate
- `backend/routes/achievements_routes.py` — closest pattern for a new top-level routes file with its own prefix
- `backend/main.py` — register the new `elo_router` here
- `backend/services/container.py` — `EloService` is already wired with all needed repos; just extend the class
- `backend/repositories/player_repository.py` — `get_all()` returns Player domain objects with `is_active` field used to derive the active set

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`EloRepository.get_baseline_elo_before(date)`** — proves the indexed query against `PlayerEloHistory.recorded_at` works; `get_history` follows the same shape but with optional player filter and returns rows instead of last-value baseline.
- **`elo_changes_to_dtos` + `_player_names_map`** in `games_routes.py` — pattern for resolving `player_id → player_name` in one pass.
- **`GameFilter`** — template for `EloHistoryFilter`'s structure (small `@dataclass` with `Optional` fields, lives next to the repo it serves).
- **`PlayerEloHistory` ORM** — already has indexes on `recorded_at` AND `player_id`, so the combined filter is a single indexed scan with no schema change.
- **`achievements_routes.py`** — closest precedent for "new top-level prefix" route file (achievements, like elo, isn't nested under players or games).

### Established Patterns
- Routes import service singletons from `services/container.py` (never instantiate per request).
- Filter capabilities live on dataclasses (per project rule); services orchestrate, repositories execute the query, mappers convert ORM → DTO.
- Pydantic DTOs use `BaseModel`, primitive types, no validators unless needed (FastAPI handles 422 on bad path/query types).
- Tests for backend services use `docker-compose.test.yml` (NEVER pytest on host — project rule).

### Integration Points
- `backend/main.py` line 21–24 — add `app.include_router(elo_router)`.
- `backend/services/container.py` — `EloService` instance is reused; new method just extends the class definition in `elo_service.py`.
- Frontend Phase 9 will define `PlayerEloHistoryDTO` in `src/types/index.ts` to match this contract; success criterion 4 ties them together. Any shape change here ripples to D.2 plans, so this CONTEXT locks the shape.

</code_context>

<specifics>
## Specific Ideas

- The endpoint is a frontend-driven contract — every shape decision here is consumed by Phase 9 (`api/elo.ts`), Phase 11 (`Ranking` page filter wiring), and Phase 12 (chart). The chart Y-axis MUST key on `elo_after`, never `delta`, never a client-side running sum (per PITFALLS.md §11).
- The `from` filter is opaque-string end-to-end on the frontend; backend parses it as `date` once via FastAPI Query coercion and never reformats. No `.toISOString()` anywhere.
- Pagination is explicitly out: friend-group dataset, manual entry, expected order-of-magnitude is hundreds of points — single response is fine. If this stops being true, future-us adds a `limit`/`cursor` without breaking the current shape.

</specifics>

<deferred>
## Deferred Ideas

- **Leaderboard endpoint** — RANK-05 (current rank + last delta per player) is in Phase 12. The chart endpoint and the leaderboard could share data via a single `/elo/history` call (frontend computes rank from latest `elo_after`); if Phase 12 surfaces a need for a separate `/elo/leaderboard` endpoint, that is a new phase.
- **Pagination / limit** — not added in v1.1; revisit if dataset grows.
- **Per-game markers / events on the chart line** — coupled to deferred records redesign; not consumed by this endpoint.
- **Peak rating endpoint** — Phase 9 (PROF-03) computes peak client-side from this endpoint's response; no separate route needed.

</deferred>

---

*Phase: 08-backend-get-elo-history-endpoint*
*Context gathered: 2026-04-28*
