# Pitfalls Research — ELO Visualization Frontend

**Domain:** React 18 + TS + Vite + CSS Modules SPA over an existing FastAPI multiplayer-ELO backend (synchronous recompute on every game mutation)
**Researched:** 2026-04-27
**Confidence:** HIGH (grounded in direct codebase reads — `backend/services/elo_service.py`, `backend/services/game_service.py`, `backend/routes/games_routes.py`, `backend/schemas/elo.py`, `frontend/src/hooks/useGames.ts`, `frontend/src/pages/PlayerProfile/PlayerProfile.tsx`, `frontend/src/index.css`)

---

## Pitfall-to-Phase Anchor (the lookup the roadmap reads)

Phase letters reuse the lettering in `ARCHITECTURE.md` (Phase A = types/api, B = profile badge, C = end-of-game, D.1/D.2/D.3 = Ranking skeleton/filters/chart). "Phase 0" = backend prerequisite (history endpoint).

| # | Pitfall | Severity | Phase to address | Quality-gate check |
|---|---------|----------|------------------|---------------------|
| 1 | Stale ELO after game mutations | CRITICAL | A (types) + B/C/D consumers | After creating/editing/deleting any game in the app, every visible ELO surface (profile badge, ranking chart, leaderboard) re-reads from the server on next mount/route-enter |
| 2 | End-of-game read-after-write race | LOW (already addressed by sync backend) | C | `fetchEloChanges` uses retry-once pattern from `useGames.fetchAchievements`; no extra delay logic |
| 3 | Chart performance with many points | MEDIUM | D.3 | Recharts mounted with `dot={false}` and `isAnimationActive={false}` once dataset > ~500 points across all visible series |
| 4 | Date filter timezone bugs | CRITICAL | D.2 | All date math is string-based on `YYYY-MM-DD`; no `new Date(isoString).toISOString()` conversions on filter values |
| 5 | Multi-player URL param desync | HIGH | D.1 / D.2 | Unknown player ids in `?players=` are silently dropped; if all are dropped, default-all-active falls back; URL is rewritten to the cleaned subset |
| 6 | Empty / sparse data | HIGH | B, C, D.3 | Each surface has explicit branch for "no games", "1 game" (single-point), "filter excludes everything" |
| 7 | Color collision on multi-line chart | MEDIUM | D.3 | Palette is fixed array indexed by deterministic player order; verified at 6+ players on dark background; lines have ≥3:1 contrast against `--color-surface` |
| 8 | Hover-only tooltip dies on mobile | HIGH | D.3 | Manual mobile QA on real iOS Safari + Android Chrome before D.3 closes; tap-to-pin verified |
| 9 | Chart inaccessible to screen readers | MEDIUM | D.3 | Recharts `accessibilityLayer` enabled (default in v3); chart wrapped in `role="img"` with `aria-label`; data-table fallback in `<details>` |
| 10 | Recharts CSS leaking into theme | LOW | D.3 | All Recharts styling uses `className` props on Tooltip/Legend pointing at CSS Module classes; no `<style>` tags imported from recharts |
| 11 | Cumulative chart math errors | MEDIUM | A (DTO contract) + D.3 | Y-axis dataKey is `elo_after` (rating value), never a running sum; backend contract documented in `src/types/index.ts` comment |

---

## Critical Pitfalls

### Pitfall 1: Stale ELO after game mutation (the cascade-ignorance bug)

**What goes wrong:**
User edits a 3-month-old game on `/games/:id`. Backend runs `_recompute_elo_from(game.date)` which **deletes and rewrites every `EloChange` from that date forward** (`elo_service.py:84-90`). The `players.elo` column is also bulk-rewritten. The frontend, though, has the old `PlayerResponseDTO.elo` cached in `PlayerProfile.tsx` component state from a previous mount, the previous game's ELO rows cached on `/games/:id/records`, and the leaderboard / chart series cached on `/ranking`. User navigates back to any of these surfaces and sees pre-edit numbers.

**Why it happens:**
- The codebase has **no global cache layer** (no React Query, no SWR, no Redux). Each page does inline `useEffect → setState`. So "invalidation" means "re-mount the page or re-trigger the effect."
- React Router v6 keeps page state when you navigate back via the history stack — a previously-mounted `PlayerProfile` is not re-fetched on `<Link>`-back.
- Devs new to the codebase often add a "smarter" caching layer to avoid refetches, then forget that ELO depends on every other game in time-order.

**How to avoid:**
- **Don't add a client-side cache for ELO.** Stay consistent with the existing pattern: each page's `useEffect` refetches on mount; navigation away unmounts. This is the simplest correct behavior.
- **After any game create/update/delete, force a refetch on next page entry** by treating the success response as the trigger. Concretely: `useGames.submitGame` already returns `id` and resolves only after the server commit. Any page the user navigates *to* after that resolves will run its `useEffect` fresh — which is correct.
- **For the Ranking page specifically**, key the chart effect on a route-mount counter or `useSearchParams` change so that returning to `/ranking` after a mutation re-fetches. Do **not** use a global "lastUpdated" timestamp — over-engineering for the friend-group scale.
- **Never store ELO in `sessionStorage` / `localStorage`** as a "speed up the home page" optimization. The cascade makes any persisted snapshot wrong as soon as a game is edited.

**Warning signs:**
- A developer proposes adding React Query or SWR "to make navigation snappier."
- A PR introduces a "current ELO" memo at app level rather than per-page.
- Someone asks "why is the chart flickering on the ranking page?" — that's because it *is* refetching, which is correct; resist the urge to cache it away.
- QA test: edit an old game, then navigate to `/ranking` — the chart must update.

**Phase to address:** Phase A (write the contract correctly: every fetch returns fresh server data, no `If-None-Match`/ETag plumbing) and reinforced in B/C/D consumer phases (each must use the on-mount-refetch pattern from existing `PlayerProfile.tsx:25-35`).

---

### Pitfall 4: Date filter timezone bugs (the "from 2026-01-01" silent shift)

**What goes wrong:**
User in UTC-3 (Argentina) sets the "Desde" filter to `2026-01-01`. Frontend does `new Date('2026-01-01').toISOString()` → `'2025-12-31T03:00:00.000Z'`. Sent to backend as a query param, it parses to date `2025-12-31`, includes one extra game from December 31, and the chart's first point is *before* the filter the user set. Inverse on UTC+3: user picks Jan 1, backend parses Jan 1 too, but the local-midnight game is missed because Date comparison happened at `00:00 UTC = 03:00 ART` and the game's `date` field is a calendar date.

**Why it happens:**
- `new Date('YYYY-MM-DD')` parses as **UTC midnight** in modern engines, not local. Calling `.toISOString()` then **shifts** when displayed back in any non-UTC zone.
- `<input type="date">` returns a `value` of `'YYYY-MM-DD'` (already correct), but devs reflexively wrap it in `new Date(...)` to "validate" or "format" it — which corrupts it.
- The backend `Game.date` is a `date` (no time, no zone). Mixing `datetime` math on the frontend with `date` semantics on the backend is the root cause.

**How to avoid:**
- **All filter date math is plain string compare on `YYYY-MM-DD`.** This is a sortable lexicographic representation. `'2026-01-01' <= game.date <= '2026-12-31'` Just Works. No `Date` object enters the pipeline.
- The existing `frontend/src/utils/formatDate.ts` already does it right (`isoDate.split('-').map(Number)` — no `new Date()`). Match that approach in the new `DateFromFilter` and any URL-param parsing.
- **URL param format = exactly `YYYY-MM-DD`.** Reject anything else (or coerce, but never via `Date`). Validate with `/^\d{4}-\d{2}-\d{2}$/.test(v)` — pattern already used in `tryFormatDate`.
- For "Últimos 30 días" preset, compute the from-date as `new Date()` once, format manually as ISO using `toLocaleDateString('en-CA')` or pad components — **not** `.toISOString().slice(0, 10)` (which uses UTC and shifts the day).
- Backend query param: pass the string through, parse as `date.fromisoformat()` — no timezone in the path.

**Warning signs:**
- Any code path with `new Date(...).toISOString()` near a filter value.
- The chart's leftmost point is one day off from what the user picked.
- Tests pass on the CI runner (UTC) but the bug shows in production for users in non-UTC zones.

**Phase to address:** Phase D.2 (filter wiring). Add a unit test that `DateFromFilter` round-trips `2026-01-01` → URL → API call without alteration in a non-UTC timezone (vitest can fake the TZ via `process.env.TZ='America/Argentina/Buenos_Aires'` in `setup.ts`).

---

### Pitfall 5: Multi-player URL param desync (deep link to deleted players)

**What goes wrong:**
User shares `/ranking?players=p_alice,p_bob,p_charlie&from=2026-01-01`. Recipient opens it after Charlie has been deactivated/deleted on the backend. Frontend tries to filter the chart by `[p_alice, p_bob, p_charlie]`, but `p_charlie` is no longer in `getPlayers()`. Depending on implementation:
- **Crash mode:** chart's player-color map throws on `playerColors[p_charlie]` undefined, page blanks.
- **Silent-bad-data mode:** API `GET /elo/history?player_ids=...` returns 200 with two series (alice, bob); chart legend silently shows two lines while URL claims three; user is confused.
- **Empty-chart mode:** Backend treats unknown ids as a hard 400 → page error-boundaries → blank chart.
- **Persistent ghost mode:** Selection chip row shows "Charlie ✗" which the user can't deselect because deselect updates URL, but on next render Charlie is re-injected from URL, infinite ghost.

**Why it happens:**
- URL params are user-controllable strings. There's no schema validation between "what URL says" and "what's in the database."
- Players in this app can be deactivated (the `active` filter exists in `getPlayers`).
- It's the kind of bug nobody hits in dev because dev DB has no deletions.

**How to avoid:**
- On `Ranking.tsx` mount: load `getPlayers({ active: true })`. **Intersect** the URL `players` set with the active-players set; the *intersection* is the chart's selected list.
- If intersection is **empty** (e.g. all linked players were deleted), fall back to "default = all active" and **rewrite the URL** via `setSearchParams({ players: undefined })` so the URL no longer references ghosts.
- If intersection is a **proper subset** of URL claim, also rewrite URL to the cleaned subset (silently — don't toast). The URL is now self-consistent.
- Never index a colors map by raw URL string. Always derive the colors map from the *resolved active players* list.
- For the request to `GET /elo/history`, only send the resolved id list. Backend should also tolerate (filter out) unknown ids defensively — but the frontend doing it first avoids the network call.

**Warning signs:**
- Page blank with a TypeError on player.name or color.
- Chart legend has 3 lines but the chip row has 4.
- "Why does this URL keep changing in my address bar?" — that's the cleanup, comment it.
- Two users get different views from the same URL because their `getPlayers` returns differ (someone added a player after the link was shared).

**Phase to address:** Phase D.1 (URL state + mount-time validation) — must land before D.2 fires real API calls. Recovery UX: silent rewrite, no toast.

---

## High-Severity Pitfalls

### Pitfall 6: Empty / sparse data states (the three-shape problem)

**What goes wrong:**
Three distinct "no data" shapes that all need explicit handling, and forgetting any of them ships a broken-feeling UI:

1. **Zero games anywhere** (fresh install): PlayerProfile ELO badge renders `1000` (the seeded `DEFAULT_ELO`) for every player — looks technically correct, semantically lies ("they have a rating before they played?"). Ranking chart renders empty axes.
2. **One game in the world** (or one game in the filtered window): Recharts draws a single point — *not* a line. Looks like a bug ("why is there a dot floating in space?").
3. **Filter excludes everything**: User picks "Desde 2027-01-01" today. Backend returns `[]`. Recharts renders a chart canvas with no series. Indistinguishable from a loading bug.

**Why it happens:**
- Devs test with seeded fixtures (the project has them) and never see the genuinely-empty state.
- "It works for the happy path" reflex.
- Recharts doesn't have a built-in "no data" placeholder — the chart still mounts and looks blank.

**How to avoid:**
- **PlayerProfile EloBadge:** if `player.games_played === 0`, render `—` (em dash) or "Sin partidas" rather than the seeded 1000. (FEATURES.md explicitly flags this as table-stakes; verify the chosen branch with the backend's seeding semantics during Phase B.)
- **End-of-game ELO section:** never empty (every game produces N rows). But if `fetchEloChanges` returns empty due to a backend bug, render nothing (don't render an empty card with a heading) and log a warn — the achievements pattern in `useGames.ts:91` is the precedent.
- **Ranking page** has three branches:
  - `players.length === 0` (no players defined yet) → "No hay jugadores cargados aún. [Ir a Jugadores →]" CTA.
  - `series.every(s => s.points.length === 0)` (filter excluded everything) → "Sin partidas en este rango. Probá ampliar el filtro." with a "Limpiar filtros" button that resets URL params.
  - `series.length === 1 && series[0].points.length === 1` → render a chart but **also** show a hint: "Solo hay una partida en este rango — la línea aparece como un punto."
- Don't conflate "loading" and "empty." Show `Spinner` only while `loading === true`; show empty state only after first successful fetch.

**Warning signs:**
- New deployment shows blank chart on day 0 with no message — "is the app broken?"
- A user picks an out-of-range date and the page feels frozen.
- A 1-game player profile shows a chart with one floating dot and no explanation.

**Phase to address:** Each consumer phase (B for profile, C for end-of-game, D.3 for chart). Make the empty-state branch a **required** sub-task of each phase, not "polish later."

---

### Pitfall 8: Hover-only tooltip dies on mobile (the desktop-bias bug)

**What goes wrong:**
Recharts' default `<Tooltip />` shows on `mouseover`. On iOS Safari / Android Chrome there is no hover — the touch translates to a click. Behavior depends on lib version: some show momentarily on tap, then the next tap anywhere dismisses; some never show at all. Result on a mobile-first app: the chart is decorative — users can read the lines but can't get the date/value of any specific point. The headline interactive feature is broken on the primary platform.

**Why it happens:**
- Devs build and QA on desktop (laptop). Recharts looks great there.
- The project rule "Mobile-first" is repeatedly stated but easy to forget for a chart.
- Recharts tooltip docs barely mention touch.

**How to avoid:**
- Use Recharts' built-in `Tooltip` with `trigger="click"` instead of the default `"hover"`. Tap-to-pin is the right pattern for touch.
- Add a `<Tooltip cursor={{ stroke: 'var(--color-accent)', strokeOpacity: 0.5 }} />` to give visual feedback on tap (vertical line at touched X).
- For the multi-line chart, the default Recharts behavior is "hover anywhere shows tooltip for that X across all series" — that maps fine to tap. But on dense data, two tap targets may overlap. Mitigation: large hit-area dots (`<Line dot={{ r: 6 }} activeDot={{ r: 10 }} />`) when zoomed in.
- **Manual mobile test required before D.3 closes.** Real device, not just Chrome devtools mobile emulation (touch behavior differs).
- Highlight-on-tap-line is a separate concern. Recharts supports `onClick` on `<Line />` — wire it to a `highlightedPlayer` state and use it to dim the others (FEATURES.md P2). Keep this in v1.2 unless trivially cheap.

**Warning signs:**
- "I can see the chart but I can't read any numbers" feedback from a phone user.
- Tooltip flashes and disappears on tap.
- The page looks fine in Chrome desktop responsive mode but not on a real iPhone.

**Phase to address:** Phase D.3 — bake `trigger="click"` into the `EloLineChart` component from day one, not as a follow-up.

---

## Medium-Severity Pitfalls

### Pitfall 3: Chart performance cliff with many points

**What goes wrong:**
Once the dataset reaches a few thousand SVG nodes, Recharts on a mid-tier Android phone goes from "smooth" to "1-2 second hitch on filter change." The cliff is roughly:

| Visible nodes (lines × points × dots) | Mid-tier Android | Notes |
|---|---|---|
| < 500 | smooth (60fps) | typical for first year of friend-group play |
| 500–2,000 | noticeable hitch on filter change, fine static | the realistic ceiling for this app |
| 2,000–5,000 | visibly laggy, panning/scrolling stutters | unlikely to hit pre-v2 |
| > 5,000 | SVG approach starts being wrong | switch to canvas (Chart.js) |

For a closed friend group of 4-6 players playing weekly, you'd hit ~1,500 EloChange rows over **5+ years**. So the realistic problem isn't "we'll have 10K points" — it's "with 6 players × 200 games each = 1,200 points + per-point dots = 2,400 SVG nodes" already touching the medium tier.

**Why it happens:**
- Recharts renders an SVG `<circle>` per data point by default (the dot). Each is a real DOM node. 2,400 dots = 2,400 nodes.
- Default `isAnimationActive={true}` re-runs the entry animation on every prop change (filter toggle).
- Devs leave defaults on because "performance is fine" — until it isn't.

**How to avoid:**
- `<Line dot={false} activeDot={{ r: 5 }} />` — render no static dots, only the on-hover/click activeDot. Saves N nodes per line.
- `<Line isAnimationActive={false} />` — kill the entry animation. The chart still feels fine; tooltip and active-dot transitions still animate (those are separate).
- For "downsampling," don't bother yet — once at 5K+ points, implement LTTB downsampling client-side. Out of scope for v1.1.
- **Don't render lines for unselected players.** When `selectedPlayerIds` is a subset, only pass those series to `<LineChart>`. The MultiSelect drives this; the chart never has hidden-but-mounted lines.

**Warning signs:**
- Filter change has a visible delay before the chart updates.
- Profiler shows >50ms render time for `<LineChart>`.
- Mobile users report "the chart feels laggy."

**Phase to address:** Phase D.3, defaults in the `EloLineChart` component. Codify `dot={false}` and `isAnimationActive={false}` as the standard.

---

### Pitfall 7: Color collision on multi-line chart

**What goes wrong:**
With 6 players, naive palette (e.g. Recharts defaults: `#8884d8`, `#82ca9d`, `#ffc658`, `#ff7300`, `#a4de6c`, `#d0ed57`) produces two pairs that are visually similar (the two greens, the orange/yellow). On the project's dark background (`--color-background: #1a0a05` / `--color-surface: #2c1810`), some of those colors have terrible contrast. Crossing lines become indistinguishable.

Worse: if the palette is **assigned in render order** (`players.map((p, i) => palette[i])`) and the order changes (player added, player deactivated, sort by current ELO), each player's "color identity" shifts between visits — Alice was blue yesterday, green today.

**Why it happens:**
- Default chart-library palettes are picked for light backgrounds and 3-4 series. The project is dark-themed and has 6+ series.
- Order-dependent palette assignment is the easy/wrong default.

**How to avoid:**
- **Hand-pick a palette of 8 high-contrast colors** that work on the project's dark background. Candidate set (informed by the project's design tokens):
  - `--color-accent` (#e67e22 orange) — already a brand color
  - `#3498db` (sky blue, complementary to accent)
  - `#27ae60` (success green, already in tokens)
  - `#e74c3c` (error red, already in tokens — careful with semantic overload; use a different red like `#c44569`)
  - `#9b59b6` (purple)
  - `#1abc9c` (teal)
  - `#f1c40f` (yellow — use sparingly, low contrast on warm dark)
  - `#ecf0f1` (off-white — last resort, very high contrast)
- Verify each line color has **≥3:1 contrast against `--color-surface`** using the WCAG contrast formula. (3:1 is the WCAG AA threshold for non-text graphical objects.)
- **Deterministic key:** assign color by `player.player_id` hash, not array index. Simple stable hash:
  ```ts
  const colorIndex = [...playerId].reduce((acc, c) => acc + c.charCodeAt(0), 0) % palette.length
  ```
  Or maintain an explicit map in the player store (won't change once seeded) — better long-term but heavier.
- Add the player initial or a small player avatar (existing pattern in `PlayerProfile`) to the legend, so even color-blind users can identify lines.
- For 8+ players, fall back to dashed/dotted line styles for the overflow players (`<Line strokeDasharray="5 5" />`).

**Warning signs:**
- Two players' lines are routinely confused in design review.
- Lines disappear into the background on certain regions of the chart.
- "Alice changed color when I added a new player" is the actual symptom of order-dependent assignment.

**Phase to address:** Phase D.3 — palette + assignment-key are part of `EloLineChart`'s initial implementation. Don't ship with the Recharts default palette.

---

### Pitfall 9: Chart inaccessible to screen readers

**What goes wrong:**
Recharts renders an SVG. Without explicit ARIA, screen readers announce nothing meaningful — "graphic" or silence. The headline visual feature becomes a black box for screen-reader users. Failing this isn't catastrophic for an internal friend-group app, but the project's CSS Modules / accessibility-aware approach (and the existence of `aria-` patterns in `Button.tsx` etc.) suggests a baseline is expected.

**Why it happens:**
- Charts are visual-by-nature; devs default to "well, it's a chart, what can you do."
- Recharts v3 added an `accessibilityLayer` prop but it's off by default in older docs and only handles keyboard navigation, not announcements.

**How to avoid:**
- Set `<LineChart accessibilityLayer>` (Recharts v3 default-on, but be explicit). This adds keyboard-arrow navigation across data points and announces the focused point.
- Wrap the chart in `role="img"` with a descriptive `aria-label` summarizing the data: `aria-label={`Evolución de ELO de ${selectedPlayers.map(p => p.name).join(', ')} desde ${fromDate}`}`.
- Provide a **data-table fallback** in a collapsed `<details>` element below the chart:
  ```tsx
  <details>
    <summary>Ver datos como tabla</summary>
    <table>...</table>
  </details>
  ```
  The `<table>` lists each player's points (date, ELO). Screen readers read `<table>` natively. This is the most pragmatic baseline.
- **What NOT to do:** import a heavy a11y library, rewrite Recharts as `react-aria` primitives, or skip and pretend it's fine. The data-table fallback is ~15 lines of code and covers the screen-reader case without distorting the design for sighted users.

**Warning signs:**
- Lighthouse accessibility audit drops below 90 on the Ranking page.
- VoiceOver (Mac) or TalkBack (Android) announces nothing when focused on the chart.
- The chart has no text alternative.

**Phase to address:** Phase D.3 — `accessibilityLayer` + `role="img"` + aria-label are 3 lines, do them with the chart. Data-table fallback can be a follow-up sub-task within D.3 if pressed for time, but NOT deferred to v1.2.

---

### Pitfall 10: Recharts CSS leaking into the theme

**What goes wrong:**
Recharts injects some default styles for tooltips and the legend. Without overrides, the tooltip shows up with white background + black text on a dark-themed app — visually jarring and inconsistent with the rest of the UI. Worse: if a dev "fixes" it via a global CSS override (`.recharts-tooltip-wrapper { background: ... }`), they create a global rule that bypasses CSS Modules and lives in tension with other components.

**Why it happens:**
- Recharts sets inline styles + default class names on its DOM. CSS Modules' scoping doesn't apply to elements rendered by a third-party library.
- The path-of-least-resistance fix is `index.css` global overrides, which violates "Sin inline styling. CSS separado y reutilizable" implicitly (it works, but it's brittle and global).

**How to avoid:**
- Use Recharts' **prop-based theming**, not CSS overrides:
  - `<Tooltip contentStyle={{...}} />` — but **avoid inline-style strings**; instead use `<Tooltip content={<CustomTooltip />} />` where `CustomTooltip` is a component using a CSS Module class.
  - `<Legend wrapperStyle={...}>` — same: prefer `<Legend content={<CustomLegend />} />` with a Module.
- Pass design-token strings **as prop values** (allowed by the project rule, since they're not `style` attributes):
  ```tsx
  <Line stroke="var(--color-accent)" />
  <CartesianGrid stroke="var(--color-border)" />
  <XAxis tick={{ fill: 'var(--color-text-muted)' }} />
  ```
- For the few classes Recharts emits that you *do* need to override (e.g. `.recharts-default-legend`), put them in `EloLineChart.module.css` as `:global(.recharts-default-legend)` — scoped via CSS Modules' `:global()` escape hatch. This keeps them visible only in the chart component's stylesheet, not bleeding to the rest of the app.
- **Do NOT** add Recharts overrides to `frontend/src/index.css`. Keep them inside `EloLineChart.module.css`.

**Warning signs:**
- Tooltip shows white-on-white or doesn't follow the dark theme.
- A new global selector (`.recharts-*`) appears in `index.css` after this milestone.
- Adding Recharts to a different page later breaks this page's chart styling.

**Phase to address:** Phase D.3 — establish the pattern in `EloLineChart` setup. The `<CustomTooltip>` component is needed anyway for the multi-player tooltip layout (FEATURES.md table-stakes).

---

### Pitfall 11: Cumulative chart math errors (rating value vs running delta)

**What goes wrong:**
Backend `EloChangeDTO` exposes `elo_before`, `elo_after`, `delta` per change. A dev wiring the chart writes `<Line dataKey="delta" />` thinking "show how much they gained" — the chart now plots per-game gains, not the rating itself. Lines bounce around 0 instead of orbiting 1500. Worst case: dev "fixes" it by computing a running sum of deltas client-side, gets it slightly wrong (e.g. summing in the wrong order, off-by-one with the seeded 1000 baseline), and the chart silently disagrees with the profile badge.

**Why it happens:**
- The DTO exposes both representations; nothing forces the chart consumer to pick the right one.
- Devs reflexively compute things client-side that the backend already serves correctly.
- ELO baseline is 1000 (per `elo_service.py:9`), but "what does 'no games yet' show on the chart?" is ambiguous — easy to start the line at 0 instead of 1000.

**How to avoid:**
- **The chart Y-axis dataKey is ALWAYS `elo_after`.** Document this in `src/types/index.ts`:
  ```ts
  /**
   * One point in a player's ELO evolution.
   * IMPORTANT: chart Y-axis = elo_after (the rating after this game).
   * Use `delta` only for end-of-game "+12 / -8" labels. Never for chart lines.
   */
  export type EloHistoryPointDTO = {
    recorded_at: string
    game_id: string
    elo_after: number
    delta: number
  }
  ```
- **Never compute running sums client-side.** The backend's `_walk_and_persist` (`elo_service.py:99-115`) already does this correctly with proper baseline handling. Trust the `elo_after` it gives you.
- **Y-axis domain:** use `domain={['dataMin - 50', 'dataMax + 50']}` — Recharts pattern. Do NOT pin to `[0, dataMax]` (FEATURES.md explicitly flags this — squashes variation into a flat band).
- Add a unit test asserting that `EloLineChart` plots `elo_after` and never `delta` or computed values.

**Warning signs:**
- Lines on the chart hover around 0 instead of ~1500.
- A new helper `computeRunningElo()` appears in the frontend code.
- The profile badge shows `1024` while the chart's last point reads `+12` or `0` — they should be the same number.

**Phase to address:** Phase A (DTO contract documented in types) + Phase D.3 (chart implementation enforces it). Phase B and C also touch the same DTO and benefit from clear docs.

---

## Low-Severity Pitfalls

### Pitfall 2: End-of-game read-after-write race

**What goes wrong (theoretically):**
User submits a game; frontend immediately fetches `/games/{id}/elo`; the GET arrives before the create transaction has committed; returns `[]`; modal shows no ELO changes; user thinks ELO is broken.

**Why this is actually LOW for this codebase:**
- `POST /games/` (`games_routes.py:38-44`) calls `games_service.create_game(game)` which executes everything **synchronously** — including `_recompute_elo_from(game.date)` (`game_service.py:161`) which calls `elo_service.recompute_from_date` (writes the EloChange rows + commits). Only then does the response return.
- This means by the time `useGames.submitGame` resolves with `{ id }`, the EloChange rows for that game are already persisted in PostgreSQL. The subsequent `GET /games/{id}/elo` cannot race.
- This is identical to the achievements path (which also runs synchronously and uses `fetchAchievements` with a single retry — for transient network errors, NOT for races).

**How to avoid:**
- Mirror the achievements pattern exactly. `useGames.fetchEloChanges(gameId)` with retry-once-on-failure (network blips, not race conditions). No artificial delay. No polling.
- **Do NOT** add `setTimeout` before the first fetch "to give the backend time" — the backend already finished by the time you got the response.
- **Do NOT** add a generic "wait for elo to be ready" endpoint or websocket subscription. Premature complexity.

**Warning signs:**
- Someone proposes adding a delay before fetching ELO post-game.
- A PR introduces polling (`setInterval` checking for ELO).
- The retry-once succeeds where the first fetch failed (legitimate — network blip; pattern works).

**Phase to address:** Phase C. Just copy the `fetchAchievements` retry shape into a sibling `fetchEloChanges`.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Cache ELO in `localStorage` for fast reload | Snappy first paint | Stale data after edit-old-game; cascade silently breaks correctness | **Never** — the cascade makes any persisted ELO snapshot wrong on next mutation |
| Run a global React Query / SWR for the whole app | Consistent caching pattern, devtools | New dependency, deviates from existing inline-`useEffect` style, requires invalidation discipline that the codebase has never needed | **Not for v1.1** — only if the app grows to ~20 routes with shared data |
| Skip empty-state branches "we'll add them when QA finds them" | Faster phase close | Looks broken on day 0; user reports "chart is empty" with no actionable guidance | **Never** — empty states are required acceptance criteria for B/C/D.3 |
| Compute running ELO sum client-side instead of using `elo_after` | Avoids one new DTO field | Drift between profile badge and chart; off-by-one bugs around player creation date | **Never** — backend already computes it correctly |
| Use Recharts default palette to ship faster | Saves 30 minutes of palette work | Two players visually indistinguishable; "Alice was blue, now she's green" | **Never for production** — palette is a 30-min task, do it in D.3 |
| Hover-only tooltip "we'll add tap later" | Faster D.3 close | Headline feature broken on mobile; users can't read values | **Never** — `trigger="click"` is one prop |
| Load `getPlayers()` fresh on every chart render | Always-current player list | Wasted requests; flicker on every filter change | **Acceptable in v1.1** if cached for the page lifetime via `useEffect` deps; revisit if profile shows it as a hot path |
| `aria-label` only, no data-table fallback | Saves ~15 lines | Screen-reader users can't actually consume the data | **Acceptable in v1.1** if data-table fallback is tracked in a v1.2 issue, NOT silently dropped |
| URL params not validated (trust browser input) | Less code in `Ranking.tsx` | Crash on shared link with deleted player | **Never** — Pitfall 5; intersection logic is required |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Recharts + jsdom (vitest) | `ResponsiveContainer` throws "ResizeObserver is not defined" | Mock `global.ResizeObserver` in `src/test/setup.ts` (3-line stub from STACK.md), or pass explicit `width`/`height` in tests |
| Recharts + CSS Modules | Trying to scope `.recharts-tooltip` via plain CSS Module class | Use `<Tooltip content={<CustomTooltip />} />` with a Module-classed component; OR `:global(.recharts-tooltip)` inside the Module file |
| Recharts + design tokens | Reading `--color-accent` via JS `getComputedStyle` and passing as a JS string | Pass `stroke="var(--color-accent)"` directly as the prop value — Recharts forwards to SVG which resolves the CSS variable natively |
| `<input type="date">` + `Date` object | Wrapping the value in `new Date(...)` to "format" it, getting timezone shift | Treat the value as `'YYYY-MM-DD'` string end-to-end; never construct a `Date` from it for filter logic |
| `useSearchParams` + boolean params | Storing `selectedAll` as `?all=true` | Don't — use the explicit `?players=...` list (or absence-means-all). Boolean URL params lead to ambiguity ("does empty mean all or none?") |
| Backend `/elo/history` (Phase 0) + frontend Phase D.2 | Mocking the response shape and going forward; backend ships a different shape later | Block D.2 on Phase 0 ship. The chart consumes whatever the real endpoint returns. Mock only at the API-wrapper level inside vitest, not at the page level |
| `react-router-dom` v6 history navigation | Assuming back-nav re-runs `useEffect` | It does (page is unmounted on route change), but if you cache state at app-level via context, that state survives. Avoid app-level ELO context |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-point SVG dot rendering | Chart hitches on filter change; mobile feels sluggish | `<Line dot={false} activeDot={{ r: 5 }} />` | ~500+ visible points |
| Entry animation on every prop change | Filter toggles trigger a 1s re-animation; users wait to read | `<Line isAnimationActive={false} />` (or only animate on initial mount via a `useState(true)` flag) | Any time, but most painful at 1K+ points |
| Re-fetching `getPlayers()` on every selection change | Network tab fills with duplicate calls | Fetch once in page mount; selection is pure client state | At ~5 selection changes per session |
| Re-computing color map on every render | Render time inflates; can break memo'd children | `useMemo(() => buildColorMap(players), [players])` | Negligible at small N; hygiene matters |
| Loading the full game list to derive ELO | Frontend pulls `/games/` (potentially MB of payload) just to get rating evolution | Use the dedicated `/elo/history` endpoint (Phase 0); never reconstruct from games | At 100+ games, payload becomes notable |
| Sending all 6 player ids to `/elo/history` even when only 2 are selected | Backend returns 6 series, frontend filters down to 2 — wasted bandwidth | Send only the selected ids in the query; backend filters server-side | Mobile data; latency on slow connections |
| Refetching on every `setSearchParams` flicker | URL updates trigger duplicate fetches before debounce | Debounce filter changes by ~150ms before firing the API call (or rely on user explicitly applying via a "Aplicar" button — but that's a UX downgrade) | Rapid filter changes by power users |

---

## Security Mistakes

This is an internal friend-group app behind `<ProtectedRoute>`. Domain-specific security concerns are minimal but a few apply:

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting URL params to decide who can see what | A user crafts `?players=...` containing every player_id and views data they shouldn't | Backend's `/elo/history` is already auth-gated. Frontend doesn't enforce visibility — backend does. |
| Embedding player names in URLs (`?players=Alice,Bob`) | Player names leak in shared URLs / browser history | Use `player_id` (already opaque strings, not names) in URLs — current convention. |
| Logging full `EloHistoryDTO` to console in prod | Player names + ELO history end up in browser logs / error reporters | Don't `console.log` data shapes in production; use `console.warn` only on actionable failures (the achievements pattern) |
| Cross-site request to a different origin's `/elo/history` | Not currently a concern (same-origin) | Standard CORS posture from FastAPI; no change needed |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Chart starts at Y=0 instead of orbiting actual values | Lines all squashed into a flat band; can't see variation | Use `domain={['dataMin - 50', 'dataMax + 50']}`; FEATURES.md flags this |
| "+0" delta on tied positions rendered as gray text user can't see | User doesn't realize a 0-delta is intentional | Render `±0` (with explicit ± sign) and use `--color-text-muted`, not pure gray |
| Filter chip with no clear-all affordance | User stuck with the filter, has to manually deselect each | Add "Limpiar filtros" button next to the filter chip row |
| Single-game player profile shows just `1012` with no context | "Is this their score? Their rating? Their game count?" | Always pair the number with a label "ELO" and ideally a delta-from-default `+12 desde 1000` for first-game players |
| Chart legend uses player-id (`p_alice`) instead of name | Unreadable legend | Always render `player.name` from the resolved player list, never the id |
| Date picker opens with no default | User has to click into the year/month/day individually on iOS | Set `defaultValue` to a sensible date (the earliest game in the dataset, or 6 months ago). FEATURES.md says "Todo el tiempo" is the default — present that as a chip preset, not as an empty date input |
| No loading state visible on Ranking page during initial fetch | User sees blank page, thinks app is broken | Reuse existing `Spinner` while `loading === true`; pattern from `PlayerProfile.tsx:72` |
| Transitioning from "loading" to "empty" without clear distinction | User confused: is it still loading, or is it empty? | Show `Spinner` only while `loading === true`; only show empty state after `loading === false && !error && data.length === 0` |
| Player deactivated server-side, still in URL deep link | Crash or ghost in chip row | Pitfall 5: intersect URL with active players, silent rewrite |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces. Verify each before closing the relevant phase.

- [ ] **EloBadge on profile (Phase B):** Renders for a 0-games player without showing a misleading `1000` (Pitfall 6 case 1). Verify with a freshly-created player.
- [ ] **EloBadge on profile (Phase B):** Updates after editing an old game that affected this player. Open profile, edit a game in another tab, navigate back — number must reflect new state. (Pitfall 1.)
- [ ] **End-of-game ELO section (Phase C):** Renders all participants, not just the logged-in / focused one. Color-coded with sign. Position visible alongside delta. (FEATURES.md table-stakes.)
- [ ] **End-of-game ELO section (Phase C):** Retry-once on transient API failure, silent log on second failure — pattern matches `fetchAchievements` exactly. (Pitfall 2, codebase consistency.)
- [ ] **Ranking page (Phase D.1):** Empty `?players=` query gets defaulted to all-active players, not "no chart." (Pitfall 5.)
- [ ] **Ranking page (Phase D.1):** Unknown player ids in URL are silently filtered, URL is rewritten to the cleaned list. (Pitfall 5 recovery.)
- [ ] **Ranking page (Phase D.2):** "Desde 2026-01-01" filter sends `2026-01-01` to backend exactly (no timezone shift). Verified in non-UTC TZ. (Pitfall 4.)
- [ ] **Ranking page (Phase D.2):** "Últimos 30 días" preset computes the from-date in user-local time without crossing a day boundary via `.toISOString()`. (Pitfall 4.)
- [ ] **Ranking page (Phase D.2):** Filter that excludes all data shows a useful empty state with a "Limpiar filtros" button, not a blank chart. (Pitfall 6 case 3.)
- [ ] **Chart (Phase D.3):** Tooltip works on real mobile (iOS Safari + Android Chrome) — manually verified, not just devtools emulation. (Pitfall 8.)
- [ ] **Chart (Phase D.3):** `<LineChart>` has `accessibilityLayer`, wrapper has `role="img"` + `aria-label`, data-table fallback present in `<details>`. (Pitfall 9.)
- [ ] **Chart (Phase D.3):** Y-axis dataKey is `elo_after`, not `delta`. Documented in `EloHistoryPointDTO` jsdoc. (Pitfall 11.)
- [ ] **Chart (Phase D.3):** Y-axis domain is `['dataMin - 50', 'dataMax + 50']`, not `[0, ...]`. (UX pitfall.)
- [ ] **Chart (Phase D.3):** With 6 players selected, every line has ≥3:1 contrast against `--color-surface` and no two lines are easily confused. (Pitfall 7.)
- [ ] **Chart (Phase D.3):** Player color is keyed by id (deterministic), not by render order. Adding a player doesn't recolor existing players. (Pitfall 7.)
- [ ] **Chart (Phase D.3):** `dot={false}` and `isAnimationActive={false}` set as defaults. (Pitfall 3.)
- [ ] **Chart (Phase D.3):** No global Recharts CSS overrides in `index.css`. All theming via props or `:global()` inside `EloLineChart.module.css`. (Pitfall 10.)
- [ ] **Single-game state (Phase D.3):** A player with one game in the filtered window renders as a single dot with a hint message, not a confusing floating point. (Pitfall 6 case 2.)
- [ ] **Vitest setup:** `ResizeObserver` mocked in `src/test/setup.ts`. Recharts tests don't crash. (Integration gotcha.)
- [ ] **Pitfall 1 regression test:** After mutating a game (create / edit / delete), navigating to `/ranking` re-fetches; chart updates. Add a Playwright test if the existing E2E suite covers this flow.

---

## Recovery Strategies

When pitfalls slip through despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Stale ELO surface (Pitfall 1) | LOW | Force-refresh the page (Cmd-R). Long-term: ensure each page does on-mount fetch — usually a one-line `useEffect` fix. |
| Date timezone shift (Pitfall 4) | LOW | Replace `new Date(iso).toISOString()` with raw string. One-line change per occurrence; grep for `toISOString` in the frontend should yield 0 results in filter code. |
| URL ghost player crash (Pitfall 5) | LOW | Add intersection logic at page-mount; rewrite URL. Affects one place: `Ranking.tsx` mount effect. |
| Missing empty state (Pitfall 6) | LOW | Add a count check + JSX branch. ~10 lines per surface. |
| Tooltip broken on mobile (Pitfall 8) | LOW | Set `trigger="click"` on Recharts `<Tooltip />`. One prop change. |
| Color collision (Pitfall 7) | MEDIUM | Hand-pick palette + commit deterministic id-keyed assignment. Visual review on real data needed; ~1-2 hours. |
| Chart perf cliff (Pitfall 3) | LOW | `dot={false}` + `isAnimationActive={false}`. Two props. If still slow, downsample series client-side (LTTB, ~50 lines). |
| Recharts CSS leak (Pitfall 10) | MEDIUM | Move global rules from `index.css` to `:global()` inside `EloLineChart.module.css`. Audit all `.recharts-*` selectors; takes ~30min. |
| Cumulative math wrong (Pitfall 11) | MEDIUM | Replace running-sum logic with `elo_after`. Add a test asserting chart matches profile badge for a known player at the latest game. |
| End-of-game retry not catching (Pitfall 2) | LOW | Verify `fetchEloChanges` follows the same try/catch shape as `fetchAchievements`. ~5min. |
| Inaccessible chart (Pitfall 9) | LOW | Add `accessibilityLayer`, `role="img"`, `aria-label`, `<details>` table. Maybe 20 lines. |

---

## Pitfall-to-Phase Mapping (canonical)

For the roadmap. Each pitfall has a phase that owns its prevention and an explicit verification.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Stale ELO after mutation | Phase A (architecture decision: no client cache) + B/C/D (each consumer uses on-mount refetch) | Edit-old-game E2E test asserts `/ranking` reflects new state |
| 2. End-of-game read-after-write race | Phase C | `fetchEloChanges` matches `fetchAchievements` retry shape; codepath is sync end-to-end |
| 3. Chart performance cliff | Phase D.3 | Chart defaults: `dot={false}`, `isAnimationActive={false}`; load-test with 6 players × 200 games dataset |
| 4. Date filter timezone | Phase D.2 | Unit test in non-UTC TZ; round-trip `2026-01-01` through filter to API call unchanged |
| 5. URL params with deleted players | Phase D.1 | Unit test: open `?players=ghost,real` → only `real` rendered, URL rewritten to `?players=real` |
| 6. Empty / sparse data | Phase B (badge), C (rows), D.3 (chart) | Each surface has explicit no-data / 1-data / filtered-empty branch with copy and CTA |
| 7. Color collision | Phase D.3 | Manual visual review at 6 players on real device; deterministic id-keyed palette; WCAG 3:1 contrast verified |
| 8. Mobile-broken tooltip | Phase D.3 | Manual real-device QA on iOS Safari + Android Chrome before phase close |
| 9. Chart accessibility | Phase D.3 | Lighthouse accessibility ≥ 90 on `/ranking`; data-table fallback in `<details>` |
| 10. Recharts CSS leak | Phase D.3 | Grep `index.css` for `.recharts-*` returns 0; all chart styling inside `EloLineChart.module.css` |
| 11. Cumulative math errors | Phase A (DTO contract) + D.3 (enforce in chart) | Unit test asserting chart `dataKey === 'elo_after'`; chart latest point matches profile badge |

---

## Cross-cutting concerns flagged

Three concerns thread through multiple phases and deserve explicit roadmap callouts:

1. **Timezone hygiene (Pitfall 4)** — every place that touches a date string should treat it as `'YYYY-MM-DD'` opaque. This applies to `DateFromFilter` (D.2), URL params (D.1), and any preset-computation helper (D.2). Adding a project-wide rule comment in `formatDate.ts` would help future devs.

2. **Accessibility (Pitfall 9)** — partly addressed in D.3, but the `EloBadge` and `EloChangeRow` on profile/end-of-game also need labels. The badge should have `aria-label="ELO actual: 1234"` and the row should have semantic markup (`<dl>` or labeled spans), not just visual layout.

3. **No-cache discipline (Pitfall 1)** — the project deliberately has no React Query / SWR layer. This needs to be a documented decision in PROJECT.md or a comment somewhere obvious, otherwise the next dev will "improve" it and silently break the cascade-correctness guarantee.

---

## Sources

- Live codebase reads (HIGH confidence):
  - `backend/services/elo_service.py` — confirms recompute is synchronous, deletes-and-rewrites from `start_date`
  - `backend/services/game_service.py:141-209` — confirms `create_game`, `update_game`, `delete_game` all call `_recompute_elo_from` synchronously before returning
  - `backend/routes/games_routes.py` — confirms POST/PUT/DELETE return only after the service call completes
  - `backend/schemas/elo.py` — `EloChangeDTO = { player_id, player_name, elo_before, elo_after, delta }`
  - `frontend/src/hooks/useGames.ts:83-96` — the canonical retry-once-on-failure pattern (`fetchAchievements`)
  - `frontend/src/pages/PlayerProfile/PlayerProfile.tsx:25-35` — the canonical inline-fetch on-mount pattern
  - `frontend/src/index.css:3-19` — verified design tokens for palette planning
  - `frontend/src/components/MultiSelect/MultiSelect.tsx` — confirmed signature for player picker reuse
  - `frontend/src/utils/formatDate.ts` — confirmed string-based date handling pattern
- Sibling research (HIGH confidence):
  - `.planning/research/STACK.md` — chart library is Recharts 3.8.1; `ResizeObserver` mock; SVG-friendly CSS-variable theming
  - `.planning/research/FEATURES.md` — empty-state requirements, "default: all" multi-select, FEATURES anti-features (Y=0 squash, hover-only tooltip)
  - `.planning/research/ARCHITECTURE.md` — phase ordering (A → B,C in parallel; Phase 0 → D.2 → D.3); decisions on routing and modal vs inline
- External (MEDIUM confidence — informed but not load-bearing):
  - WCAG 2.1 AA — 3:1 contrast for non-text graphical objects (the threshold cited for chart-line palette)
  - Recharts v3 docs — `accessibilityLayer`, `Tooltip` `trigger`, `Line` `dot`/`isAnimationActive` props (per STACK research's Context7 lookup)

---
*Pitfalls research for: ELO visualization frontend (milestone v1.1) on existing React 18 + Vite + CSS Modules SPA*
*Researched: 2026-04-27*
