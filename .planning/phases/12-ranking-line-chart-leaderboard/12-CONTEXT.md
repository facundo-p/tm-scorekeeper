# Phase 12: Ranking line chart + leaderboard - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the chart skeleton in `/ranking` (left by Phase 11) with the actual Recharts multi-line ELO evolution chart and the leaderboard table below it. Phase 11 owns all wiring: fetch, filters, URL state, empty states, and the skeleton. Phase 12 owns pure visualization — swapping `renderChartSkeleton()` for `<EloLineChart>` and adding `<EloLeaderboard>`.

**Includes:**
- Install `recharts@3.8.1`
- `src/components/EloLineChart/` — `<EloLineChart>` component + CSS Module
- `src/components/EloLeaderboard/` — `<EloLeaderboard>` component + CSS Module
- Wire both into `Ranking.tsx` replacing `renderChartSkeleton()`
- Single-point hint (muted note below chart when only 1 game in window)
- A11y requirements from ROADMAP SC6

**Explicitly NOT in this phase:**
- Fetch, filters, URL state — already done in Phase 11
- Empty states (0 players, 0 data) — already done in Phase 11
- Date presets (RANK-FUT-01) — v1.2
- Click-to-highlight line (RANK-FUT-03) — v1.2
- Switchable X-axis (RANK-FUT-04) — v1.2

</domain>

<decisions>
## Implementation Decisions

### Library
- **D-01:** `recharts@3.8.1` — only library with native CSS-variable theming (SVG-based), mobile-first `ResponsiveContainer`, `accessibilityLayer` in v3, and React component API. One vitest setup change: mock `global.ResizeObserver` in `src/test/setup.ts` (3-line stub) so `ResponsiveContainer` doesn't crash in jsdom.

### Chart legend
- **D-02:** Include Recharts `<Legend>` inside the chart area. The chart is self-contained — user sees player name + color swatch without looking at the MultiSelect filters above. No external legend component.

### Color palette
- **D-03:** Deterministic, id-keyed palette — same player always gets the same color regardless of list order or reordering. Approach: fixed hand-picked array of 6–8 colors (verified ≥3:1 WCAG contrast against `--color-surface: #2c1810`), indexed by a hash derived from `player_id` string (e.g. simple sum of char codes `% palette.length`). Adding or removing other players never reassigns a player's color (SC1 requirement). Claude's Discretion: exact hashing function and exact color values, as long as contrast threshold is met.

### Tooltip
- **D-04:** `trigger="click"` everywhere (mobile + desktop) — matches ROADMAP SC2. Hover-only is a non-starter on a mobile-first app. Includes a visible `cursor` for tap feedback. Tooltip content: player name, date (`YYYY-MM-DD` string, no reformatting), and `elo_after`.

### Y-axis and chart defaults
- **D-05:** Y-axis keyed on `elo_after`, `domain={['dataMin - 50', 'dataMax + 50']}` — locked by ROADMAP SC3. `dot={false}` and `isAnimationActive={false}` as defaults — locked by ROADMAP SC4.

### Single-game hint
- **D-06:** When the filtered dataset has exactly 1 point (across all selected players), the chart renders the single dot (override `dot={true}` on that `<Line>` in the single-point case) and shows a muted-text caption **below** the chart: "Solo hay una partida en este rango". The caption lives in `Ranking.tsx` outside the chart component, rendered conditionally when `totalPoints === 1`.

### Chart height
- **D-07:** 280px height on mobile, 400px on desktop (≥768px) via CSS media query in `Ranking.module.css`. `ResponsiveContainer` handles width automatically; height is set on the container `div` wrapping it.

### Leaderboard — "Última delta" scope
- **D-08:** The leaderboard's "Última delta" column **always shows the player's most recent global delta**, ignoring the active date filter. This reflects current momentum. Implementation: from the full unfiltered `dataset` (already in `Ranking.tsx` state), take each player's last `EloHistoryPointDTO.delta`. The leaderboard receives the `dataset` (unfiltered), not `filtered`.

### Leaderboard — ELO current and ordering
- **D-09:** "ELO actual" in the leaderboard = last `elo_after` from the player's full history (unfiltered), same as PROF-01 semantics. Sorted by ELO descending (RANK-05 requirement). "Posición" = 1-based rank after sort. Tied players: stable sort by `player_name` (alphabetical) as tiebreaker.

### A11y
- **D-10:** `<EloLineChart>` wrapper `div` has `role="img"` and a descriptive `aria-label` (e.g. "Gráfico de evolución de ELO por jugador"). `accessibilityLayer` enabled on `<LineChart>`. Below the chart, a `<details><summary>Ver datos como tabla</summary>` collapsible table with all visible data points. No `.recharts-*` global rules in `index.css` — all Recharts styling via `className` props pointing to CSS Module classes.

### Claude's Discretion
- Exact `player_id` hash function (as long as it's deterministic and uniform)
- Exact 6–8 colors in the palette (must pass 3:1 WCAG contrast against `#2c1810`)
- X-axis tick format — short date labels (e.g. "15/03" or "Mar '25") sparse enough for mobile
- Whether `EloLeaderboard` receives raw `dataset` or a pre-computed `leaderboardRows` array derived in `Ranking.tsx`
- Internal naming of helper functions in the components

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements and success criteria
- `.planning/ROADMAP.md` §"Phase 12: Ranking line chart + leaderboard" — 6 success criteria that govern chart behavior, tooltip, a11y, and leaderboard
- `.planning/REQUIREMENTS.md` §RANK-02, §RANK-05 — the two requirements this phase closes
- `.planning/PROJECT.md` §"Current Milestone: v1.1" — milestone framing

### Research v1.1
- `.planning/research/SUMMARY.md` — §"Recommended Stack" (recharts@3.8.1 rationale), §"Expected Features" (multi-line chart conventions), §"Architecture Approach" (`EloLineChart` component named explicitly)
- `.planning/research/PITFALLS.md` — Pitfall 1 (no-cache, still load-bearing), Pitfall 3 (mobile tooltip), Pitfall 7 (color collision), Pitfall 9 (chart a11y), Pitfall 10 (Recharts CSS leak), Pitfall 11 (cumulative chart math)
- `.planning/research/STACK.md` — alternatives matrix (why not Chart.js/ECharts)

### Phase 11 — what's already built (Phase 12 extends this)
- `.planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md` — D-A4 (client-side filtering from full dataset), D-B1 (fetch already done), D-B5/D-B6 (skeleton to replace), D-B2 (retry/error pattern)
- `frontend/src/pages/Ranking/Ranking.tsx` — `dataset`, `filtered`, `totalPoints` already computed; `renderChartSkeleton()` is what Phase 12 replaces
- `frontend/src/pages/Ranking/Ranking.module.css` — existing design tokens and `.chartSkeleton` class to replace/extend

### Existing frontend
- `frontend/src/index.css` — design tokens (`--color-surface: #2c1810`, `--color-text`, `--color-text-muted`, spacing, border-radius); palette colors must pass 3:1 contrast against `--color-surface`
- `frontend/src/types/index.ts` — `PlayerEloHistoryDTO`, `EloHistoryPointDTO` (Phase 11 owns these)
- `frontend/src/test/setup.ts` — add `ResizeObserver` mock here for Recharts
- `.planning/codebase/CONVENTIONS.md` — naming (PascalCase components, DTO suffix, CSS Modules)
- `.planning/codebase/STRUCTURE.md` — where new components go (`src/components/EloLineChart/`, `src/components/EloLeaderboard/`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`Ranking.tsx` state**: `dataset` (full unfiltered), `filtered` (by active players + fromDate), `totalPoints` — all already computed; the chart and leaderboard consume these without new fetch logic
- **`Ranking.module.css` skeleton classes** (`.chartSkeleton`, `.skeletonLine`) — replace/extend with chart container styles; the `min-height: 280px` pattern is the base for the responsive height decision
- **`formatDate.ts`** (if it exists in `src/utils/`) — the existing helper for `YYYY-MM-DD` → Spanish display; candidate for X-axis tick formatter in the chart
- **`index.css` design tokens** — `--color-surface: #2c1810`, `--color-text-muted`, spacing/border-radius — palette must be tested against these

### Established Patterns
- **CSS Modules + design tokens** — no inline styles, no hardcoded colors; chart container, tooltip, legend styled via CSS Module classes
- **No client cache** — `Ranking.tsx` already follows on-mount-refetch; Phase 12 adds no new data fetching
- **DTO mirror back-to-front** — `EloHistoryPointDTO.elo_after` is the Y-axis dataKey (never delta, never running sum — Pitfall 11)
- **Component file structure** — `src/components/EloLineChart/EloLineChart.tsx` + `EloLineChart.module.css`

### Integration Points
- **`Ranking.tsx`**: replace the `renderChartSkeleton()` call with `<EloLineChart data={filtered} />` (or similar); add `<EloLeaderboard data={dataset} />` below. The single-point hint conditional also lives here.
- **`src/test/setup.ts`**: add `ResizeObserver` mock before any recharts tests run
- **Phase 11 empty state branches already cover** `selectedPlayers.length === 0` and `totalPoints === 0` — Phase 12 only needs to handle the `totalPoints === 1` single-point hint case

</code_context>

<specifics>
## Specific Ideas

- User chose `<Legend>` inside the chart for self-containment — the chart screenshot should be readable without the filters visible.
- "Última delta" in the leaderboard is intentionally global (not filtered) — the user wants it to reflect "current momentum", not "what happened in this zoom window". This means the leaderboard receives `dataset` (the full unfiltered history), not `filtered`.
- Single-point hint is below the chart (not above) — non-intrusive, user sees the single dot first without a warning banner blocking the view.
- Chart height 280px mobile → 400px desktop (768px+) — the `max-width: 700px` container on the main keeps desktop reasonable even at 400px.

</specifics>

<deferred>
## Deferred Ideas

- **Date presets** (Todo / 6m / 30d) — RANK-FUT-01, v1.2
- **Click-line-to-highlight** (focus mode) — RANK-FUT-03, v1.2
- **Switchable X-axis** (date vs game-index) — RANK-FUT-04, v1.2
- **Accessible data table** as always-visible (not `<details>`) — RANK-FUT-02, v1.2; SC6 `<details>` collapsible fallback is enough for v1.1
- **`EloLeaderboard` with click-through to player profile** — not scoped, could be a nice-to-have in v1.2
- **Backend params cleanup** (`from`/`player_ids` on `/elo/history` not consumed by frontend) — deferred from Phase 11, still pending for v1.2 cleanup

</deferred>

---

*Phase: 12-ranking-line-chart-leaderboard*
*Context gathered: 2026-05-01*
