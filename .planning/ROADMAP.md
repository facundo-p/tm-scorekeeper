# Roadmap: Terraforming Mars Stats

## Milestones

- v1.0 Sistema de Logros — Phases 1-4 (shipped 2026-04-01) + Cleanup Phases 5-7 (shipped 2026-04-28)
- v1.1 Visualización de ELO en Frontend — Phases 8-12 (started 2026-04-28)

## Phases

<details>
<summary>v1.0 Sistema de Logros (Phases 1-4) — SHIPPED 2026-04-01</summary>

- [x] Phase 1: Backend Core (2/2 plans) — completed 2026-03-31
- [x] Phase 2: Integración y API (2/2 plans) — completed 2026-03-31
- [x] Phase 3: Frontend (3/3 plans) — completed 2026-04-01
- [x] Phase 4: Reconciliador (1/1 plan) — completed 2026-04-01

</details>

<details>
<summary>v1.0 Cleanup (Phases 5-7) — SHIPPED 2026-04-28</summary>

- [x] Phase 5: Cleanup integración v1.0 (2/2 plans) — completed 2026-04-27 — closed INT-01/INT-02/FLOW-01
- [x] Phase 6: Drifts y polish v1.0 (3/3 plans) — completed 2026-04-28 — closed audit §8 tech_debt
- [x] Phase 7: Documentación y proceso v1.0 (2/2 plans) — completed 2026-04-28 — closed cross-cutting tech_debt

For details: [`.planning/milestones/v1.0-cleanup-ROADMAP.md`](milestones/v1.0-cleanup-ROADMAP.md)

</details>

### v1.1 Visualización de ELO en Frontend — IN PROGRESS

- [x] **Phase 8: Backend `GET /elo/history` endpoint** — Expose per-player ELO time series consumable by the chart, gating downstream chart work (completed 2026-04-29)
- [x] **Phase 9: PlayerProfile ELO surface + frontend foundation** — Land typed contracts + `api/elo.ts` and surface current ELO, peak, rank and last-game delta on the player profile (completed 2026-04-29)
- [ ] **Phase 10: End-of-game unified summary modal with ELO section** — Refactor `AchievementModal` into `EndOfGameSummaryModal` containing records + achievements + per-player ELO changes
- [x] **Phase 11: Ranking page skeleton + filters + URL state** — New `/ranking` route with multi-player selector, "Desde" date filter and shareable URL search params (completed 2026-05-01)
- [x] **Phase 12: Ranking line chart + leaderboard** — Multi-line ELO evolution chart (Recharts) and current-rank leaderboard table on `/ranking` (completed 2026-05-01)

## Phase Details

### Phase 8: Backend `GET /elo/history` endpoint
**Goal**: API exposes the per-player ELO time series the Ranking chart needs, with date and player filters
**Depends on**: Nothing (backend layer; data already exists in `PlayerEloHistoryORM`)
**Requirements**: ELO-API-01
**Success Criteria** (what must be TRUE):
  1. Calling `GET /elo/history` with no filters returns one entry per active player with `points: [{ recorded_at, game_id, elo_after, delta }, ...]` covering all recorded games
  2. Calling `GET /elo/history?from=YYYY-MM-DD` returns only points with `recorded_at >= from`, with no off-by-one drift in non-UTC timezones
  3. Calling `GET /elo/history?player_ids=id1,id2` filters the response to those players; unknown ids are silently dropped (not 400)
  4. Invalid `from` (not `YYYY-MM-DD`) is rejected with 422; the response shape is documented in `backend/schemas/elo.py` and matches what the frontend `PlayerEloHistoryDTO` expects
**Plans**: TBD

### Phase 9: PlayerProfile ELO surface + frontend foundation
**Goal**: Players see their current ELO, peak, rank and last-game delta on their profile, on top of typed ELO contracts shared with every later phase
**Depends on**: Nothing on the frontend side (Phase 8 is parallelizable; this phase only consumes `PlayerResponseDTO.elo` which already exists)
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04
**Success Criteria** (what must be TRUE):
  1. Stats tab on PlayerProfile shows the player's current ELO as a hero stat alongside existing tiles, with a single number and a clear "ELO" label
  2. Below the current ELO the user sees the delta from the last game (`+23` green / `-12` red / `±0` muted), only when the player has at least one game
  3. The user sees the player's peak rating (e.g. "Pico: 1612") and rank among active players (e.g. "#3 de 8")
  4. A player with 0 games shows `—` (not the seeded `1000`) for current ELO, and peak/rank/delta are hidden rather than rendered as `0`
  5. After editing or deleting an old game, returning to the profile reflects the recomputed ELO without any client cache or `localStorage` snapshot getting in the way
**Plans**: 3 plans
Plans:
- [x] 09-01-PLAN.md — Backend ELO Summary Endpoint (route + service + 3 repo methods + integration tests)
- [x] 09-02-PLAN.md — Frontend Foundation: Types + API Wrapper (drift fix + new DTOs + getEloSummary)
- [x] 09-03-PLAN.md — EloSummaryCard component + PlayerProfile integration (depends on 01 + 02)
**UI hint**: yes

### Phase 10: End-of-game unified summary modal with ELO section
**Goal**: After every finished game, players see records, achievements, and ELO changes for all participants in a single unified end-of-game screen
**Depends on**: Phase 9 (consumes `EloChangeDTO` and `api/elo.ts`)
**Requirements**: POST-01, POST-02, POST-03
**Success Criteria** (what must be TRUE):
  1. The existing `AchievementModal` is refactored into `EndOfGameSummaryModal` that opens on every finished game (not only when achievements unlock) and renders three composed sections: records broken, achievements unlocked, and ELO changes
  2. The ELO section lists every participant of the just-finished game with `elo_before → elo_after`, signed delta, and color-coded by sign (green positive, red negative, muted zero)
  3. Each row shows the finishing position (1°, 2°, 3°, …) next to the player name so the delta is anchored to the result that produced it
  4. If `fetchEloChanges` fails twice (single retry mirroring `fetchAchievements`), the ELO section is silently omitted and a `console.warn` is logged — records and achievements still render
  5. The modal handles the empty case (no records, no achievements) by still showing the ELO section, since ELO fires on every game
**Plans**: TBD
**UI hint**: yes

### Phase 11: Ranking page skeleton + filters + URL state
**Goal**: Users reach a `/ranking` page from Home, pick which players and which date window they want, and the URL captures the filter state for reload and sharing
**Depends on**: Phase 8 (real `/elo/history` endpoint — D.2 fires real calls), Phase 9 (`api/elo.ts` and types are reused)
**Requirements**: RANK-01, RANK-03, RANK-04, RANK-06
**Success Criteria** (what must be TRUE):
  1. A "Ranking — Evolución de ELO" tile on Home navigates to `/ranking`; the route is wrapped in `<ProtectedRoute>` like every other authenticated page
  2. The page composes the existing `MultiSelect` for players (default = all active players when URL is empty) and a `DateFromFilter` ("Desde") with a native `<input type="date">`
  3. Changing filters writes to URL search params (`?players=id1,id2&from=YYYY-MM-DD`); reloading the page restores the same selection; copying the URL into a new tab reproduces the same view
  4. On mount, URL `players` are intersected against active players: unknown ids are silently dropped, the URL is rewritten to the cleaned subset, and if the intersection is empty the page falls back to "default = all active"
  5. Filter dates round-trip as opaque `YYYY-MM-DD` strings end-to-end (no `new Date(...).toISOString()` corruption), verified by a vitest test running in `America/Argentina/Buenos_Aires` timezone
  6. When the active filter excludes all data the page shows an empty state ("Sin partidas en este rango") with a "Limpiar filtros" CTA, not a blank page
**Plans**: TBD
**UI hint**: yes

### Phase 12: Ranking line chart + leaderboard
**Goal**: The `/ranking` page renders the multi-line ELO evolution chart with mobile-first interactions and the current-rank leaderboard
**Depends on**: Phase 11 (filter state and data fetch already wired)
**Requirements**: RANK-02, RANK-05
**Success Criteria** (what must be TRUE):
  1. The chart renders one line per selected player with a deterministic, id-keyed color palette (≥3:1 WCAG contrast against `--color-surface`); adding or reordering players never reassigns existing players' colors
  2. Tapping a data point on iOS Safari and Android Chrome opens a tooltip with player name, date, and `elo_after` (Recharts `Tooltip trigger="click"` + a visible cursor), and tooltip is verified on real devices before the phase closes
  3. The chart Y-axis is keyed on `elo_after` (never `delta`, never a client-side running sum) and uses `domain={['dataMin - 50', 'dataMax + 50']}` so variation is readable
  4. The chart uses `dot={false}` and `isAnimationActive={false}` defaults; with one game in the filtered window a single dot renders with an explicit hint ("Solo hay una partida en este rango")
  5. Below the chart, a leaderboard table lists Posición, Jugador, ELO actual, Última delta — sorted by ELO descending — driven by the same `/elo/history` data
  6. The chart is wrapped in `role="img"` with a descriptive `aria-label`, has `accessibilityLayer` enabled, and includes a `<details><summary>Ver datos como tabla</summary>` data-table fallback for screen readers; no `.recharts-*` global rules leak into `index.css`
**Plans**: 4 plans
Plans:
- [x] 12-01-PLAN.md — Wave-0 preflight: install recharts@3.8.1 + add ResizeObserver mock to test setup
- [x] 12-02-PLAN.md — EloLineChart component (Recharts multi-line, deterministic palette, click tooltip, a11y) + tests
- [x] 12-03-PLAN.md — EloLeaderboard component (ranked table, ELO desc + alphabetical tiebreak, delta colors) + tests
- [x] 12-04-PLAN.md — Wire chart + leaderboard into Ranking.tsx + responsive container + single-point hint + Ranking.test.tsx update + human-verify checkpoint
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Backend Core | v1.0 | 2/2 | Complete | 2026-03-31 |
| 2. Integración y API | v1.0 | 2/2 | Complete | 2026-03-31 |
| 3. Frontend | v1.0 | 3/3 | Complete | 2026-04-01 |
| 4. Reconciliador | v1.0 | 1/1 | Complete | 2026-04-01 |
| 5. Cleanup integración | v1.0 cleanup | 2/2 | Complete | 2026-04-27 |
| 6. Drifts y polish | v1.0 cleanup | 3/3 | Complete | 2026-04-28 |
| 7. Documentación y proceso | v1.0 cleanup | 2/2 | Complete | 2026-04-28 |
| 8. Backend `GET /elo/history` | v1.1 | 4/4 | Complete | 2026-04-29 |
| 9. PlayerProfile ELO + foundation | v1.1 | 3/3 | Complete   | 2026-04-29 |
| 10. End-of-game unified modal | v1.1 | 0/? | Not started | - |
| 11. Ranking skeleton + filters + URL state | v1.1 | 6/6 | Complete    | 2026-05-01 |
| 12. Ranking chart + leaderboard | v1.1 | 4/4 | Complete   | 2026-05-01 |
