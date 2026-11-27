# Project Research Summary

**Project:** Terraforming Mars Stats — v1.1 ELO Visualization Frontend
**Domain:** React 18 + TypeScript + Vite + CSS Modules SPA layered over an already-shipped FastAPI multiplayer-ELO backend
**Researched:** 2026-04-27
**Confidence:** HIGH

## Executive Summary

The v1.1 milestone surfaces an already-working ELO backend through three concrete frontend surfaces — current ELO on `PlayerProfile` (Stats tab), per-player `before → after (±delta)` rows on the post-game `GameRecords` screen, and a brand-new top-level `/ranking` page with a multi-line ELO-evolution chart, multi-player selector, and "desde" date filter. Research across all four axes (stack, features, architecture, pitfalls) is unusually consistent: the codebase already supplies most of the building blocks (`MultiSelect`, `Input type="date"`, `formatDate`, the `useGames.fetchAchievements` retry pattern, the inline `useEffect`-on-mount data flow), so this milestone is largely an integration exercise rather than a green-field design problem.

The recommended approach is to add **exactly one** new dependency (`recharts@3.8.1`, picked specifically because SVG-rendered charts accept `stroke="var(--color-accent)"` directly and integrate cleanly with the project's CSS-variable design tokens), build three new small components (`EloBadge`, `EloChangeRow`, `EloLineChart`), one new page (`Ranking`), and one new API wrapper (`elo.ts`). End-of-game ELO sits as a **sibling section inside `GameRecords`**, not as an extension of the celebratory `AchievementModal` (the two have opposite cardinality — ELO fires on every game, achievements fire only on unlocks). Filter state on `/ranking` lives in URL search params via `useSearchParams` for shareability.

The two highest-stakes risks are correctness traps, not implementation difficulty. **Stale ELO after a game-edit cascade** is critical because the backend deletes-and-rewrites every `EloChange` from the edited game's date forward — any frontend-side cache or `localStorage` snapshot becomes silently wrong on the next mutation; the mitigation is to *not* add a cache layer (stay with the existing on-mount-refetch pattern). **Date-filter timezone shift** is critical because `new Date('2026-01-01').toISOString()` parses as UTC midnight and silently moves the day in any non-UTC zone; the mitigation is end-to-end string-only handling of `YYYY-MM-DD` values, never wrapping them in `Date`. A third non-negotiable is **tap-to-pin tooltip on the chart** (Recharts `<Tooltip trigger="click" />`) — hover-only tooltips kill the headline feature on a mobile-first app. There is also one **hard backend prerequisite**: no `GET /elo/history` endpoint exists yet, and the Ranking chart cannot be implemented without it.

## Key Findings

### Recommended Stack

The existing stack (React 18.3.1, Vite 6, TypeScript 5.6, vitest 3, CSS Modules, Lucide icons) covers everything except the chart itself. **Net dependency cost: 1 new package.** The only library decision is which charting lib to pick, and `recharts@3.8.1` is the unambiguous choice for this codebase: SVG-based (so chart elements consume CSS variables natively as prop values), `Tooltip`/`Legend` accept `className` props (clean integration with CSS Modules), `ResponsiveContainer` is mobile-first by default, peer-deps cover React 18, and bundle size is acceptable for the headline feature. Canvas-based libraries (Chart.js, ECharts) lose specifically because they break the project's CSS-variable theming model. See STACK.md for the full alternatives matrix.

**Core technologies:**
- **recharts 3.8.1** — multi-line ELO chart on `/ranking` — only library with native CSS-variable theming, mobile-first defaults, and React-component API (no imperative drawing surface)
- **Existing `MultiSelect` component** — multi-player picker — already token-themed, 36px touch targets, `(value: string[], onChange)` signature is a drop-in fit
- **Native `<input type="date">`** via existing `Input` component — "desde" filter — triggers OS date picker on iOS/Android, zero bundle cost, already proven in `GameForm` and `GamesList`
- **Existing `formatDate.ts` helper** — date display — the project has zero current usage of date-fns/dayjs/moment; the 10-line helper handles ISO + Spanish month abbreviations with no library

**One vitest setup change:** mock `global.ResizeObserver` in `src/test/setup.ts` (3-line stub) so Recharts' `ResponsiveContainer` doesn't crash in jsdom.

### Expected Features

Three concrete surfaces plus two cross-cutting filter concerns. Research surveyed lichess, chess.com, Board Game Arena, Scored, Score Door, and BG Stats; conventions are unusually well-aligned across all of them. The "ours" thing in the matrix is **multi-player overlay on the evolution chart** — every reference is 1-vs-1 framed, but for a closed friend group of N players sharing one dataset, putting all N lines on one chart is the right default and informs both the multi-select reuse and the "default = all" decision.

**Must have (table stakes — v1.1 launch):**
- Current ELO as a hero stat on `PlayerProfile` Stats tab (4-tile grid, mobile collapses to 2x2)
- Per-player `previous → new (±delta)` row for **every** participant of the just-finished game on `GameRecords`, color-coded green/red, sign always shown
- Multi-line chart on `/ranking` with one line per player, color-coded legend, `dataMin - 50` to `dataMax + 50` Y-axis (never `[0, …]` — squashes variation)
- Tap-to-pin tooltip on chart (mobile-first; hover-only is a non-starter)
- Multi-player selector defaulted to "all active players"
- "Desde" date filter with presets (`Todo el tiempo` default / `Últimos 6 meses` / `Últimos 30 días`)
- Current-rank leaderboard above/beside the chart (chart answers "how did we get here", leaderboard answers "where are we now")
- Empty states on all three surfaces (zero games, one game, filter excludes everything)

**Should have (v1.2 differentiators):**
- Delta-from-last-game sub-label on `PlayerProfile` (`+12` green / `-7` red)
- Peak rating ("Pico: 1612") and rank ("#2 de 6") on profile — small N makes rank meaningful
- Click-line-to-highlight, click-data-point → game detail navigation
- Last-N-games preset alongside date filter
- URL query state for shareable filter views
- "New peak!" badge in end-of-game flow when this game pushed the player above their previous personal best

**Defer (v2+ or never):**
- Glicko / rating deviation (requires backend rewrite; out of charter)
- Tier names / divisions ("Gold II") — chrome without value at small N
- Percentile (meaningless at 4–10 players)
- Real-time / websocket updates (manual-entry app)
- Brush/zoom on chart (mobile-hostile; date filter covers it)
- Trend forecast lines (statistically dishonest at this N)
- Stacked area / streamgraph variant (ELO ratings don't sum)
- Per-game records markers on chart (couples to deferred records redesign)

### Architecture Approach

The codebase has a strict layered convention (`api → hooks → pages/components → types`), one hook per *domain* not per *page*, and inline `useEffect`-on-mount data fetching with no global cache. ELO frontend slots into this pattern without inventing anything new. The four structural decisions are: (1) `/ranking` is a new top-level route reachable from Home (matches `/records` and `/achievements` precedent), **not** a `PlayerProfile` tab — multi-player chart is global, not per-player; (2) `EloBadge` lives in the existing Stats tab on `PlayerProfile`, fed by `PlayerResponseDTO.elo` which already exists; (3) end-of-game ELO is a sibling `<section>` inside `GameRecords` next to `Resultados` and `Records`, **not** a modal extension — `AchievementModal` stays celebratory-only; (4) filter state on `/ranking` lives in URL search params (`?players=…&from=…`) via `useSearchParams`, with mount-time intersection of URL ids against active players to defend against deleted-player ghost links.

**Major components:**
1. **`src/api/elo.ts`** (new) — typed wrappers for `GET /games/{id}/elo` and the new `GET /elo/history?from=&player_ids=` endpoint
2. **`EloBadge`** (new) — pill displaying current ELO, used in `PlayerProfile` Stats tab
3. **`EloChangeRow`** (new) — one row of `before → after (±delta)`, reused inside `GameRecords` ELO section (mobile-first grid)
4. **`EloLineChart`** (new) — Recharts multi-line responsive chart with `dot={false}`, `isAnimationActive={false}`, tap-trigger tooltip, deterministic id-keyed palette, `accessibilityLayer` + `role="img"` + `<details>` data-table fallback
5. **`DateFromFilter`** (new) — thin wrapper around `<input type="date">` for "Desde" label + reuse + tests
6. **`Ranking` page** (new) — owns filter state via `useSearchParams`, composes `MultiSelect` + `DateFromFilter` + `EloLineChart` + leaderboard
7. **`useGames.fetchEloChanges`** (extended) — single-retry-on-failure, mirroring the existing `fetchAchievements` pattern (D-09/D-10)
8. **Backend `GET /elo/history` route + service method + mapper** (Phase 0, blocks chart) — repository already has the data via `PlayerEloHistoryORM` and `recorded_at` index, but no route exposes it

### Critical Pitfalls

1. **Stale ELO after game mutation (CRITICAL)** — backend `_recompute_elo_from(game.date)` deletes and rewrites every `EloChange` from the edited game's date forward, plus bulk-rewrites `players.elo`. Any client cache silently goes wrong on the next edit-old-game. **Avoidance:** do not introduce React Query / SWR / `localStorage` caching; stay on the existing inline-`useEffect`-on-mount pattern. After any mutation, the next page entry refetches automatically because RR v6 unmounts on route change. This is a deliberate architectural decision that needs to be documented so the next dev doesn't "improve" it.

2. **Date filter timezone shift (CRITICAL)** — `new Date('2026-01-01').toISOString()` parses as UTC midnight and the resulting date string is one day off in any non-UTC zone. **Avoidance:** treat `YYYY-MM-DD` as opaque string end-to-end; never wrap filter values in `Date`. The existing `formatDate.ts` already does it right (`isoDate.split('-').map(Number)` — match that approach). Validate URL params with `/^\d{4}-\d{2}-\d{2}$/`. For "Últimos 30 días" preset, format the from-date via `toLocaleDateString('en-CA')` or padded components, never `.toISOString().slice(0, 10)`. Add a vitest test in `America/Argentina/Buenos_Aires` TZ.

3. **Mobile tooltip dies on hover-only (HIGH)** — Recharts default tooltip is `mouseover`-triggered; on iOS Safari and Android Chrome there is no hover, and the chart becomes decorative. **Avoidance:** ship with `<Tooltip trigger="click" />` from day one of D.3, plus a visible `cursor` for tap feedback. Manual real-device QA on iPhone and Android before D.3 closes — devtools mobile emulation is not enough.

4. **URL params with deleted/inactive players (HIGH)** — a shared `?players=p_alice,p_charlie` link, where Charlie has been deactivated, can crash the color map (`undefined` lookup), silently desync (chart shows 1 line, chip row shows 2), or create ghost chips that can't be removed. **Avoidance:** on `Ranking.tsx` mount, intersect URL `players` set with `getPlayers({ active: true })`; if intersection is empty, fall back to "default = all active"; rewrite URL silently to the cleaned subset; never index a colors map by raw URL string.

5. **Empty / sparse data states (HIGH)** — three distinct empty shapes (zero games anywhere, one game = single floating dot, filter excludes everything = blank chart canvas) that all look broken without explicit handling. **Avoidance:** make empty-state branches a required sub-task of B/C/D.3 (not "polish later"). Profile badge shows `—` not `1000` for 0-games players. Chart has explicit branches for no players / filter-excludes-all (with "Limpiar filtros" CTA) / single-point (with hint message).

Additional medium-severity pitfalls: chart performance cliff at ~500+ visible nodes on mid-tier Android (mitigated by `dot={false}` + `isAnimationActive={false}`), color collision on dark background with default Recharts palette (mitigated by hand-picked 8-color palette + deterministic id-keyed assignment, ≥3:1 WCAG contrast against `--color-surface`), Recharts CSS leaking into theme via global `index.css` overrides (mitigated by `<CustomTooltip />` component + `:global()` inside `EloLineChart.module.css`), cumulative math errors plotting `delta` instead of `elo_after` (mitigated by jsdoc on the DTO + a unit test). See PITFALLS.md §Pitfall-to-Phase Mapping for the canonical 11-row table.

## Implications for Roadmap

Based on research, suggested phase structure. Phase letters mirror those in ARCHITECTURE.md so cross-references stay clean. Phase 0 is a hard backend prerequisite that gates D.2/D.3 only; A/B/C are independent of it.

### Phase A — Type contracts and API wrapper
**Rationale:** Lands the typed surface with no UI. Smallest possible foundation; everything else imports from here. Half-day work.
**Delivers:** `src/api/elo.ts` (wraps `GET /games/{id}/elo` and stub-typed `getEloHistory`), `src/types/index.ts` extended with `EloChangeDTO`, `PlayerEloHistoryDTO`, `EloHistoryPointDTO` (with jsdoc enforcing "chart Y-axis = `elo_after`, never `delta`").
**Addresses:** Foundation for FEATURES.md surfaces #1, #2, #3.
**Avoids:** Pitfall 11 (cumulative math errors — DTO documents the contract).

### Phase B — PlayerProfile current-ELO badge
**Rationale:** Smallest user-visible win. Pure read of `PlayerResponseDTO.elo` which already exists in the API; no new endpoint needed. Validates the on-mount-refetch pattern that B/C/D all share.
**Delivers:** `EloBadge` component, plumbed into `PlayerProfile.tsx` Stats tab as the 4th tile.
**Addresses:** FEATURES.md §1 table-stakes (current ELO as hero stat).
**Avoids:** Pitfall 1 (on-mount refetch only, no cache); Pitfall 6 case 1 (renders `—` for 0-games players, not seeded `1000`).

### Phase C — End-of-game ELO section
**Rationale:** Independent of B and D; can interleave with B. Reuses the proven retry pattern from `useGames.fetchAchievements`. The post-game flow is the *only* place users see ELO move in real time, so this is the highest-emotional-payoff surface for the milestone.
**Delivers:** `EloChangeRow` component, `useGames.fetchEloChanges(gameId)` callback (single-retry-on-failure mirroring `fetchAchievements`), new `<section>` in `GameRecords.tsx` rendered as sibling to `Resultados` and `Records` (NOT extending `AchievementModal`).
**Addresses:** FEATURES.md §2 table-stakes (per-player rows, color-coded delta, sign always shown, position visible).
**Avoids:** Pitfall 2 (read-after-write race — backend is sync, retry pattern handles network blips only); Pitfall 6 case 2 (silent log on persistent failure, don't render empty card with heading).

### Phase 0 — Backend `GET /elo/history` (parallel; blocks D.2/D.3)
**Rationale:** Repository layer already has the data via `PlayerEloHistoryORM` and `EloRepository.get_baseline_elo_before(date)`; only a route + service method + mapper are missing. Done in parallel with A/B/C, but **must complete before D.2 fires real API calls**.
**Delivers:** `GET /elo/history?from=YYYY-MM-DD&player_ids=id1,id2,...` returning `list[PlayerEloHistoryDTO]` with shape `{ player_id, player_name, points: [{ recorded_at, game_id, elo_after, delta }] }`.
**Addresses:** Hard prerequisite for any chart code.
**Avoids:** Building D.2 against mocked shape and discovering backend ships a different one (Pitfall in PITFALLS.md §"Looks done but isn't").

### Phase D.1 — Ranking page skeleton + routing + nav entry
**Rationale:** Page shell is independent of the chart library and the backend endpoint. Establishes URL-as-source-of-truth filter state before any data fetching.
**Delivers:** `src/pages/Ranking/Ranking.tsx`, `<Route path="/ranking">` in `App.tsx`, "Ranking — Evolución de ELO" tile in `Home.tsx`. Filter state lives in `useSearchParams`. **Mount-time URL validation** intersects `?players=…` against active players, silently rewrites URL to cleaned subset.
**Addresses:** Foundation for FEATURES.md §3, §4, §5.
**Avoids:** Pitfall 5 (URL ghost players — intersection logic + silent rewrite).

### Phase D.2 — Filters wired to API
**Rationale:** Connect the page to real data; chart still absent. Filters can be QA'd against raw JSON output before chart rendering complicates the picture.
**Delivers:** `DateFromFilter` component (preset chips: `Todo / 6 meses / 30 días`, plus optional custom date), `MultiSelect` wired to filter state, `getEloHistory` calls firing on filter change, raw response visible in DOM while chart not yet rendered.
**Requires:** Phase 0 + D.1.
**Avoids:** Pitfall 4 (timezone — string-only handling of `YYYY-MM-DD`, vitest test in non-UTC TZ); Pitfall 6 case 3 (filter excludes everything → "Sin partidas en este rango. Probá ampliar el filtro." with "Limpiar filtros" CTA).

### Phase D.3 — Chart
**Rationale:** Last because it's the most visible and the most pitfall-dense phase. All decisions here have known-good defaults; ship them on day one rather than as follow-ups.
**Delivers:** `EloLineChart` component using Recharts 3.8.1 with: `<Tooltip trigger="click" cursor={{ stroke: 'var(--color-accent)', strokeOpacity: 0.5 }} />`, `<Line dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />`, hand-picked 8-color palette assigned by deterministic player-id hash (not array index), Y-axis `domain={['dataMin - 50', 'dataMax + 50']}`, X-axis as date, `accessibilityLayer` enabled, wrapper `role="img"` + `aria-label`, `<details>` data-table fallback for screen readers, `<CustomTooltip />` and `<CustomLegend />` components using CSS Module classes (no global Recharts overrides in `index.css`).
**Addresses:** FEATURES.md §3 table-stakes (multi-line, hover/tap tooltip, leaderboard, empty states).
**Avoids:** Pitfall 3 (perf — `dot={false}` + `isAnimationActive={false}`); Pitfall 7 (palette + deterministic key); Pitfall 8 (mobile tooltip — `trigger="click"`); Pitfall 9 (a11y); Pitfall 10 (no global CSS leak); Pitfall 11 (Y-axis `dataKey` is `elo_after`, never `delta`).

### Phase Ordering Rationale

- **A goes first** because it's a half-day landing of types/api with no UI; B/C/D all import from here.
- **B and C are independent** of each other and of D, and both reuse a single existing pattern (Stats tile / sibling section). They can interleave or run in parallel after A.
- **Phase 0 (backend) runs in parallel** with A/B/C from a calendar standpoint but **strictly precedes D.2** because the chart consumes whatever shape the real endpoint returns; mocking it on the frontend and committing risks a shape mismatch. Phase D.1 (skeleton + routing + URL state) is safe to ship before Phase 0 lands.
- **D.1 → D.2 → D.3 is strictly serial** because each adds capability the next consumes (URL state → API wiring → visualization). D.3 is last because it's the riskiest unknown and benefits from D.2 having already validated the data flow.
- **No phase skips an empty-state branch.** Empty / 1-data / filtered-empty branches are required acceptance criteria for B, C, and D.3 — not "polish later."

### Research Flags

Phases likely needing deeper research during planning (use `/gsd-research-phase`):
- **Phase D.3:** chart implementation has the most novel surface area for this codebase (first chart library, first SVG component, first `:global()` CSS Module use, first deterministic-key palette). Worth a focused research pass on Recharts patterns once requirements are locked, even though STACK.md has already done the library-vs-library work.
- **Phase 0 (backend):** repository layer is ready, but the route + service + mapper involves decisions about query-param parsing, date validation, and whether to chunk/paginate — not covered by frontend research. Should be planned with backend research.

Phases with standard patterns (skip research-phase):
- **Phase A:** types + api wrapper — established convention in `src/api/players.ts`, `src/api/games.ts`. Mechanical.
- **Phase B:** read existing field, render in existing tab. No novel patterns.
- **Phase C:** retry-once + sibling section — `useGames.fetchAchievements` is the direct precedent.
- **Phase D.1, D.2:** `useSearchParams` is a documented RR v6 pattern; URL intersection logic is straightforward; existing `MultiSelect` and `Input type="date"` cover the controls.

### Open product questions for `/gsd-discuss-phase`

These surfaced during research and are intentionally undecided here. They block requirements:

1. **Chart library final lock-in.** Research recommends Recharts 3.8.1 with HIGH confidence; confirm or reject before D.3 starts. (No research will improve on this decision; it's a product call.)
2. **Modal unification (the `AchievementModal` question).** ARCHITECTURE.md recommends keeping ELO inline in `GameRecords` (sibling to Records section), NOT extending the modal. FEATURES.md flags "unify into `EndOfGameSummaryModal`" as a possible alternative. The two reach opposite conclusions: ARCHITECTURE wins on cardinality argument (modal is celebratory-conditional, ELO is always-deterministic), but UX preference matters — confirm.
3. **Default ELO display when player has 0 games.** Backend seeds `DEFAULT_ELO = 1000`. Profile badge for a never-played player can render `1000` (technically true), `—` em dash (FEATURES.md table-stakes recommendation), or "Sin partidas" string. Affects empty-state design across B and the leaderboard in D.
4. **X-axis: date vs game-index.** For low-frequency play, calendar-spaced ticks produce a sparse chart with mostly-empty regions. Game-indexed x-axis is more readable but breaks the "from date" filter mental model. Pick before D.3 implementation.
5. **Chart legend = multi-select?** Should the chart legend BE the player chip selector, or two synced components? Recommendation: one component to avoid double-state, but the existing `MultiSelect` is a separate primitive. Affects component composition in `Ranking.tsx`.
6. **Leaderboard column set.** Besides current ELO: games-played? last-game delta? trend arrow? Affects the leaderboard DTO shape and what Phase 0 needs to return.
7. **Peak / rank in v1.1 or v1.2?** FEATURES.md routes them to v1.2 (cheap to defer), but they're each ~1 day and high-emotional-payoff. Cost-of-delay decision.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Recharts verified via Context7 + npm registry; existing `MultiSelect` / `Input type="date"` / `formatDate` confirmed by codebase grep; React 18 / Vite 6 peer-deps verified |
| Features | HIGH for surface conventions (chess.com, lichess, BGA, Scored, BG Stats all align); MEDIUM for some defaults (preset choice, multi-select cap) where research informs but a single canonical source doesn't exist | Cross-app convergence on patterns is strong; details like "default = all" come from PROJECT.md not external precedent |
| Architecture | HIGH | Based on direct codebase reads, not assumptions. Layered convention (`api → hooks → pages/components → types`), one-hook-per-domain pattern, retry-once policy in `fetchAchievements`, `PlayerResponseDTO.elo` field, missing `GET /elo/history` endpoint — all verified against live source |
| Pitfalls | HIGH | Each critical/high pitfall is grounded in a specific file read (`elo_service.py:84-90` for the cascade, `useGames.ts:83-96` for the retry pattern, `formatDate.ts` for the timezone-safe pattern, etc.). No pitfall is speculative |

**Overall confidence:** HIGH. The four research files agree without internal contradictions, the codebase reads were direct (not assumed), and the dependency footprint is small (1 new package). The main residual uncertainty is the seven product questions in §"Open product questions" above, all of which are explicitly flagged for `/gsd-discuss-phase` rather than left implicit.

### Gaps to Address

- **Backend `GET /elo/history` shape is not yet ratified.** Research proposes `{ player_id, player_name, points: [{ recorded_at, game_id, elo_after, delta }] }` based on what the chart needs and what the repo layer can produce, but the actual route author may make different choices (pagination, chunking, date format). Mitigation: Phase 0 must ship before D.2 fires real API calls; D.2 plans against the *real* response shape, not the proposed one.
- **Whether `players.elo` is initialized at player creation or at first game.** Affects whether the badge for a 0-games player renders `1000` or `—`. Open product question #3 above. Mitigation: confirm with backend semantics during Phase B.
- **Color palette has not been visually QA'd against real player counts.** Research proposes 8 hand-picked colors; the actual visual review at 6 players on a real Android device on `--color-surface` background is a Phase D.3 manual task.
- **Mobile tooltip behavior on real devices.** Research recommends `trigger="click"`; actual behavior on iOS Safari + Android Chrome must be manually verified before D.3 closes (devtools mobile emulation is not equivalent).
- **No-cache-discipline architectural decision is not yet documented in PROJECT.md.** Pitfall 1 mitigation depends on the next dev *not* introducing React Query / SWR. Mitigation: add a comment in PROJECT.md or in `useGames.ts` documenting why the codebase deliberately has no client cache layer, before this milestone closes.

## Sources

### Primary (HIGH confidence)
- Live codebase reads — `frontend/src/{api,hooks,types,pages,components}`, `backend/{services,routes,schemas,repositories}/elo*.py`, `frontend/src/index.css` design tokens, `frontend/src/utils/formatDate.ts`, `frontend/src/components/MultiSelect/MultiSelect.tsx`, `frontend/src/hooks/useGames.ts:83-96` (retry pattern), `frontend/src/pages/PlayerProfile/PlayerProfile.tsx:25-35` (on-mount fetch pattern)
- `/recharts/recharts` (Context7) — line chart API, `ResponsiveContainer`, accessibility layer, Tooltip/Legend `className` and `content` props, customize/styling sections
- npm registry (`npm view`) — verified package versions: `recharts@3.8.1`, `chart.js@4.5.1`, `victory@37.3.6`, `@nivo/line@0.99.0`, `@visx/*@3.12.0`, `echarts@6.0.0`, `react-day-picker@9.14.0`, `date-fns@4.1.0`, `dayjs@1.11.20`
- `backend/services/elo_service.py:84-90` — confirms recompute cascade is delete-then-rewrite from `start_date` (basis for Pitfall 1)
- `backend/services/game_service.py:141-209` — confirms `create_game`, `update_game`, `delete_game` all run `_recompute_elo_from` synchronously before returning (basis for Pitfall 2 being LOW)
- `backend/schemas/elo.py` — `EloChangeDTO = { player_id, player_name, elo_before, elo_after, delta }` ratified
- `backend/schemas/player.py:43` — confirms `PlayerResponseDTO.elo: int` exists (no new endpoint needed for Phase B)

### Secondary (MEDIUM confidence)
- [Reshaped — Recharts integration guide](https://www.reshaped.so/docs/getting-started/guidelines/recharts) — confirmed `stroke="var(--token-name)"` works directly on Recharts
- [PkgPulse — Recharts vs Chart.js vs Nivo vs Visx 2026](https://www.pkgpulse.com/blog/recharts-vs-chartjs-vs-nivo-vs-visx-react-charting-2026) — bundle-size relativities, Canvas-vs-SVG accessibility tradeoffs
- [Querio — Top React Chart Libraries 2026](https://querio.ai/articles/top-react-chart-libraries-data-visualization) — corroborated bundle ranges and tree-shaking behavior
- [Lichess Changelog](https://lichess.org/changelog) and [FAQ — rating system](https://lichess.org/faq) — end-of-game rating display conventions
- [Chess.com — checking your ELO](https://support.chess.com/en/articles/9855780-how-can-i-check-my-elo-on-chess-com) — profile hero stat conventions
- [Board Game Arena — Rating doc](https://en.doc.boardgamearena.com/Rating) — multi-player ELO conventions
- [Scored: Board Game Tracker (Google Play)](https://play.google.com/store/apps/details?id=pl.remotion.scored&hl=en_US), [Score Door — Go Score Tracker](https://www.scoredoor.app/game/go), [Board Game Stats](https://www.bgstatsapp.com/) — surface-level conventions across BG-tracker apps
- [Mobiscroll — Date filtering with predefined ranges](https://demo.mobiscroll.com/react/range/date-filtering-with-predefined-ranges) — preset-first date filter pattern
- [Metabase — Visualization mistakes](https://www.metabase.com/blog/visualization-mistakes) and [docs — multiple series](https://www.metabase.com/docs/latest/dashboards/multiple-series) — Y-axis-not-zero rule, multi-series readability
- [Recharts issue #329 — toggle visibility via legend](https://github.com/recharts/recharts/issues/329), [issue #590 — toggle on legend click](https://github.com/recharts/recharts/issues/590) — interactivity patterns
- [Recharts Customization Guide](https://recharts.github.io/en-US/guide/customize/) — Tooltip/Legend `className`/`style` props
- WCAG 2.1 AA — 3:1 contrast threshold for non-text graphical objects (chart-line palette planning)
- [Tom Kerrigan — Multiplayer Elo](https://www.tckerrigan.com/Misc/Multiplayer_Elo/), [Gautam Narula — Building a Multiplayer Elo](https://gautamnarula.com/rating/) — multi-player ELO theory background
- [UI Patterns — Leaderboard](https://ui-patterns.com/patterns/leaderboard), [Filter UX Design Patterns — Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering) — UI conventions

### Tertiary (LOW confidence)
- General data-viz best-practice references for "default multi-select cap" and "preset vs custom date" — informed but not load-bearing; defaulted to PROJECT.md's "default: todos" and FEATURES.md recommendations.

---
*Research completed: 2026-04-27*
*Ready for roadmap: yes*
