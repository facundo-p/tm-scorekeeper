# Feature Research — ELO Visualization Frontend

**Domain:** Multiplayer board-game scorekeeper (casual, small/closed group). Visualization layer over an already-shipped multiplayer ELO backend (`EloChange`, history per player, recompute cascade).
**Researched:** 2026-04-27
**Confidence:** HIGH for surface-level conventions (chess.com, lichess, BGA, Scored, Score Door, Board Game Stats all align). MEDIUM for some defaults (multi-select cap, preset choice) — domain-dependent and informed by general data-viz best practices rather than a single canonical source.
**Scope note:** This file covers product/feature decisions only. Library choice (Recharts vs Chart.js vs MUI X vs Visx vs Chakra Charts) is a STACK decision and lives in `STACK.md`.

---

## 0. Surface map at a glance

Three concrete UI surfaces + two cross-cutting concerns:

1. **PlayerProfile** — current-ELO surface on the existing player profile page (Stats / Records / Logros tabs).
2. **End-of-game** — ELO before/after panel, alongside the existing `AchievementModal` post-game flow.
3. **Ranking page** — new top-level route with multi-line ELO-evolution chart + leaderboard.
4. **Multi-player selector** (cross-cutting) — used in #3.
5. **Date "from" filter** (cross-cutting) — used in #3.

Each surface is researched independently below: Table Stakes / Differentiators / Anti-Features, with complexity tags (S/M/L) and dependency notes.

---

## 1. PlayerProfile — current ELO display

### Table Stakes

| Feature | Why Expected | Complexity | Dependency |
|---------|--------------|------------|------------|
| **Current ELO as a hero stat** in the existing Stats tab grid (alongside `games_played`, `games_won`, `win_rate`) | Every rating-tracking app puts the rating front-and-center on the profile. Hiding it in a sub-table feels like burying the lede. The four tiles fit the existing 3-up grid by becoming a 4-up grid (mobile collapses to 2x2). | **S** | None. Pure read of a field already returned (or trivially added) to the `PlayerProfileDTO`. |
| **Number alone is enough** if there's nothing else (no delta, no peak, no rank) | Chess.com and lichess display the bare rating on profile cards by default. A standalone integer is not "broken." | **S** | None. |
| **Empty state** when player has 0 games (no rating yet) | Without it, you'd render `1500` for someone who has never played, which is misleading. Show "—" or "Sin partidas" or hide the tile. | **S** | Backend: clarify whether ELO is initialized at first game or at player creation. |

### Differentiators

| Feature | Value Proposition | Complexity | Dependency |
|---------|-------------------|------------|------------|
| **Delta from last game** as a sub-label under the rating (`+12` green / `-7` red / `±0` neutral) | Highest-information-per-pixel addition. Lichess shows this on profile cards; Scored and Score Door surface deltas prominently. Tells the player "am I trending up?" without a chart. | **S** | Requires `last_change` field on profile DTO (last `EloChange` row). Pairs with #2 backend additions. |
| **Peak rating** ("Pico: 1612") below the current value | Vanity metric, but a strong one. Chess.com and lichess both expose peak. For a 4-friend group it's bragging-rights candy. | **S** | Backend: add `peak_elo` (max over `EloChange.new_rating`). Cheap aggregate. |
| **Rank/position among all players** ("#2 de 6") | Tiny group → rank is meaningful and easy to grok. Less useful for ladders with thousands of players, very useful here. | **S–M** | Backend needs to compute rank (already-sorted leaderboard query, or derive from same query feeding the Ranking page). |
| **Mini sparkline** of ELO over last N games inline with the hero tile | Visual trend with no interaction cost. Sparkline conventions are well-established (MUI X, Chakra, Mantine all ship a primitive). | **M** | Couples to the chart-library decision. Don't build a sparkline before the library is picked. |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Glicko/Elo "rating deviation" / confidence interval (`1500 ± 80`)** | Lichess shows it; feels rigorous. | Backend computes plain ELO (not Glicko-2). Surfacing deviation we don't compute would be a lie; computing it is a backend rewrite. | Show the bare number. If confidence matters, show `games_played` next to it. |
| **Percentile** ("Top 17% of all players") | Chess.com style. | With 4–10 players in a closed group, percentile is meaningless ("Top 25%" = 2nd of 4). | Use rank ("#2 de 6") instead. |
| **Tier/division name** ("Gold II", "Diamante") | Looks fun. | Adds a whole tier-mapping table, naming bikeshed, and visual chrome. Out of scope for v1.1; logros already provide progression flavor. | Defer indefinitely. |
| **Dedicated ELO tab in profile** | Symmetry with Stats / Records / Logros tabs. | Wastes a tab on one number + a sub-chart that already lives on the Ranking page. Overuses navigation. | Keep ELO in Stats tab; deep-link to Ranking page filtered to this player. |
| **"Highest delta ever" / "Worst loss ever"** as sub-stats | Cute. | Marginal value, more pixels, more backend aggregates. | Skip. |

---

## 2. End-of-game — ELO before/after per player

### Table Stakes

| Feature | Why Expected | Complexity | Dependency |
|---------|--------------|------------|------------|
| **Per-player row showing `previous → new (±delta)`** for *all* participants of the just-finished game | This is the canonical pattern across every rating-aware game app surveyed (BGA, Scored, lichess, Score Door). Showing only the viewer's change breaks the social loop — in a 4-person living-room session everyone is watching the same screen. | **S** | Requires the game-creation response (or a follow-up call) to return `EloChange` rows for the new game. Backend likely already does this; verify. |
| **Color-coded delta**: green for positive, red for negative, neutral for 0 | Universal convention; absence reads as a bug. Re-use existing CSS variables / accent palette. | **S** | None (CSS only). |
| **Sign always shown** (`+12`, `-7`, never `12`/`7`) | Without sign the direction is ambiguous at a glance. Standard. | **S** | None. |
| **Clear association with player name + finishing position** | In a 4-player non-zero-sum game, "Ana lost 8" only makes sense if you also see Ana came 4th. The mental model is "position drove the delta". The existing `PlayerScoreSummary` component already shows position — sit ELO next to or under it. | **S** | Reuse / extend `PlayerScoreSummary`. |

### Differentiators

| Feature | Value Proposition | Complexity | Dependency |
|---------|-------------------|------------|------------|
| **Sit ELO panel in the SAME post-game flow as Achievements** (single end-of-game summary screen, not two separate modals) | The user already lands on `AchievementModal` after a game. Splitting ELO into a second modal doubles the friction. Better: one screen with three stacked sections — ELO changes / Records broken / Achievements unlocked. | **M** | Touches `AchievementModal.tsx` (rename → `EndOfGameSummaryModal`), the page that opens it, and types. Sequencing decision: render even if no achievements (today the modal only opens when achievements exist). |
| **Subtle count-up / slide animation** on the delta number | Adds celebratory feel. Lichess users have requested clearer up/down animation; chess.com does it well. | **S–M** | Pure CSS / a small `useCountUp` hook. Don't import an animation library for this. |
| **Position icon next to the delta** (medal for 1st, number badge for others) — already exists conceptually in `gamePosition` styles | Reinforces "your finish drove this number." Positions are already styled (`.gamePosition`, `.winner`) on PlayerProfile; carry that into the modal. | **S** | Reuse position styling. |
| **"New peak!" badge** when this game pushed the player above their previous personal best | Cheap, high-emotional-payoff. Use the same is_new pattern that achievements already implement (`AchievementBadgeMini.is_new`). | **S** | Backend needs to flag (or frontend computes from `previous_peak < new_rating`). Cheap derivation. |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Show only the current viewer's ELO change** (chess-style 1v1 framing) | Privacy by default; less data on screen. | This is a multi-local-player app — everyone is around the same table looking at the same phone/laptop. Hiding 3 of 4 deltas defeats the use case. | Always show all participants (current behavior of `AchievementModal`). |
| **Big animated chart of just-this-game's deltas** (bar chart, gain/loss waterfall, etc.) | Looks fancy. | A 4-row `prev → new` table communicates exactly the same information in 1/4 the screen space and 0 chart-library footprint. Mobile-hostile. | Plain text rows with color. |
| **"Expected vs actual"** ("You were expected to win, +0 because you did") | Statistically rigorous. | Confusing to a casual audience and clutter for the savvy one. Backend doesn't expose per-player expected score. | Skip. |
| **Auto-dismiss timer / fade-out** | "Move users along faster." | Users want to read the deltas, take a screenshot, gloat. Manual dismiss only. | Manual close button (existing pattern). |
| **Per-player share/export image** of "you gained +X this game" | Social. | Out of scope for an internal-friend-group app. | Skip; revisit if the app ever ships publicly. |

---

## 3. Ranking page — ELO evolution line chart

### Table Stakes

| Feature | Why Expected | Complexity | Dependency |
|---------|--------------|------------|------------|
| **Multi-line chart, one line per player, color-coded with a legend** | Universal convention. Every leaderboard-with-history surface ships this shape. | **M** | Chart library decision (STACK). Color palette must be generated/assigned deterministically per player (don't recolor on every render). |
| **X-axis = time (game date), Y-axis = ELO** with sane padding (don't start Y at 0; ELO orbits 1500) | Starting Y at 0 squashes all variation into a flat band. ELO is a relative scale, not an absolute one. | **S** | Configure `domain` / `yAxis` of the chart. |
| **Hover tooltip** with player name, ELO value, date, and (ideally) game link | Without tooltip the chart is decorative. This is the primary "what happened on day X" affordance on desktop. | **M** | Custom tooltip component for the chosen library. Can deep-link to `/games/{game_id}`. |
| **Touch-friendly equivalent on mobile** — tap a line to highlight it, tap a point to reveal the tooltip pinned (no hover state on touch) | Mobile-first per project rules. Pure-hover tooltips are unusable on phones. | **M** | Library-dependent. Recharts' tooltip on `onClick` is a known-good pattern; Chart.js has built-in touch tooltips. Confirm during STACK selection. |
| **Empty state** — "Aún no hay suficientes partidas para ver evolución." When there is exactly 1 game, a line chart degenerates to a single dot. | Missing empty states are a top reason apps "feel broken." | **S** | Just a count check on the data series. |
| **Current-rank leaderboard** above or beside the chart (player, current ELO, optionally delta-from-previous-game) | The chart answers "how did we get here," the leaderboard answers "where are we now." Both are needed; users glance at the leaderboard first. | **M** | Reuses the same data the chart consumes (current ELO per player) plus rank ordering. Sortable later (defer). |

### Differentiators

| Feature | Value Proposition | Complexity | Dependency |
|---------|-------------------|------------|------------|
| **Click a line (or legend entry) to highlight / dim others** | Makes a 6-line chart actually readable. Standard Recharts pattern. | **M** | Same as multi-line chart. |
| **Click a player row in the leaderboard to highlight their line** (bidirectional sync between leaderboard and chart) | Tight, polished feel. Cheap once the highlight state exists. | **S** (additive) | Depends on the highlight feature above. |
| **Click a data point → navigate to that game's detail page** | Closes the loop: "the spike on April 14 — what game was that?" | **S** | Tooltip already has `game_id`; just wrap in a `<Link>`. |
| **Last-N-games preset filters** ("Últimas 10 partidas", "Últimas 25") in addition to date-from filter | For a 4-player group that plays weekly, "últimas 10" is more meaningful than "últimos 30 días" (which might mean 1 game or 8). | **S** | Backend: filter accepts either `from_date` or `last_n`. Or compute client-side over the full series. |
| **"Reset zoom" / "Show all"** when filters narrow the view | Standard escape hatch. | **S** | UI button that clears filter state. |
| **Annotate game dates on x-axis as ticks** (one tick per game, not evenly-spaced calendar days) | For a low-frequency game (~weekly), evenly-spaced calendar ticks produce a mostly-empty chart with three sad data clusters. Game-indexed x-axis ("game 1 ... game 23") sidesteps this. **Tradeoff:** breaks the "from date" filter mental model — dates and game-indexes drift apart. **Recommendation:** keep date-axis but add visual game markers. | **M** | Open question; flag for /gsd-discuss. |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Zoom/pan/brush selection on the chart** (drag-to-zoom on a date range) | Power-user feel. | Mobile drag conflicts with vertical page scroll. Adds significant complexity. The date-from filter already covers the use case. | Use date filter + last-N presets. |
| **Real-time auto-refresh** (websocket / polling for new games) | "Live leaderboard" hype. | Games are entered manually post-session; no concurrent activity. Polling is wasted bandwidth and battery. | Refetch on route mount. |
| **Animated line drawing on every render** | Looks slick the first time. | On a phone, animating a 6-line chart with 50 points each is laggy and the user is waiting to read data, not watch it draw. Initial-mount animation OK; on every filter change it's hostile. | Animate on mount only, instant on re-render. |
| **Per-player rating-deviation bands** (Glicko-style shaded confidence) | "Looks scientific." | We don't compute Glicko deviation. See §1 anti-feature; same reason. | Plain lines. |
| **Trend forecast / projection lines** ("at this rate you'll hit 1700 by June") | Fun. | Statistically dishonest with N=5 players and ~weekly games. Cargo-cult feature. | Skip. |
| **Stacked area / streamgraph variant** | Visually striking. | Stacking implies the values sum to something meaningful. ELO ratings don't sum. Misleading visualization. | Plain multi-line. |
| **Per-game records-broken markers on the chart** | Connects ranking to existing records system. | Cross-feature coupling, scope creep into the deferred records redesign. | Defer; possibly v1.2. |

---

## 4. Multi-player selector — default behavior

### Table Stakes

| Feature | Why Expected | Complexity | Dependency |
|---------|--------------|------------|------------|
| **Show all players selected by default** | The user requirement explicitly states "default: all". Aligns with closed-group expectations — small N means "all" is reasonable. | **S** | Reuse the existing `MultiSelect` component already in `frontend/src/components/MultiSelect/`. |
| **Allow deselect to declutter** | Once you pick a focal player, hiding 5 others should be one tap, not a mode switch. | **S** | Existing MultiSelect supports this. |
| **Visible chip / pill row of currently selected players** with the line color swatch | The legend on the chart will already list them, but a separate selector chip row makes "who am I comparing?" obvious without scanning the chart. **Tradeoff with chart legend:** if the chart legend is interactive, the chip row is redundant — pick one or fold them together. | **M** | Decide if MultiSelect output and chart legend are the same component or two synced components. Recommend: chart legend IS the selector chip row to avoid double-state. |

### Differentiators

| Feature | Value Proposition | Complexity | Dependency |
|---------|-------------------|------------|------------|
| **"Top N by current ELO" quick toggle** ("Top 6", "All") next to the multi-select | Even with 6 players "all" is fine; if the friend group ever grows past ~8 a Top-N escape valve becomes important. Cheap to add when adding the selector itself. | **S** | None new. |
| **Persist selection in URL query string** (`/ranking?players=p1,p3&from=2026-01-01`) | Lets users share specific comparisons; survives reload. Standard route-as-state pattern. | **S–M** | `react-router-dom` is already installed; use `useSearchParams`. |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Hard-cap "all" at top-6 by default** when the player count is small | Looked clean in research. | Today the friend group is likely ≤6. Capping is a solution to a problem that doesn't exist. **Decision:** show all by default, soft-cap (warn + auto-collapse to top-N) only when N>8 — and revisit only if/when that hits. | Show all; defer capping. |
| **Saved/named selection presets** ("My rivals", "Top 3") | Cute. | Premature personalization for a 4-friend app. | Use URL query string for sharing. |
| **Auto-select "me" based on logged-in user** | Personal-dashboard reflex. | The app is shared / kiosk-mode within a group. There isn't really a "me" in the multi-local-player flow. | Default: all. |

---

## 5. Date "from" filter

### Table Stakes

| Feature | Why Expected | Complexity | Dependency |
|---------|--------------|------------|------------|
| **Preset list as primary affordance**: `Todo el tiempo` (default), `Últimos 6 meses`, `Últimos 30 días` | Mobiscroll / filter-pattern research and Metabase guidance both flag preset-first as the lowest-friction default. Raw date pickers on mobile are slow and error-prone. | **S** | None. |
| **"Todo el tiempo" as default** | The dataset is small (~tens of games over the lifetime of the app for now). Defaulting to a window risks showing an empty chart on first visit. "All time" is the safe, low-surprise default. | **S** | None. |
| **Visible indication of the active filter** (highlighted preset chip / displayed date) | Without it, the user can't tell why the chart looks the way it does. | **S** | Standard chip-active state. |

### Differentiators

| Feature | Value Proposition | Complexity | Dependency |
|---------|-------------------|------------|------------|
| **"Custom date" option** that opens a native `<input type="date">` (mobile-friendly free) | Power-user escape valve, cheap. Use the platform date picker — don't import a date library. | **S** | None. |
| **"Last N games" preset alongside date presets** (see §3 Differentiators) | More meaningful than calendar windows for low-frequency play. | **S** | Already covered above. |
| **Filter state in URL query** (`?from=2026-01-01` or `?last=10`) | Same shareable-state argument as multi-select. Implement together. | **S–M** | `useSearchParams`. |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Date *range* picker (from + to)** | Symmetry with from. | "To" is almost always "now" in this app. Adds a second control + validation (`from <= to`) for marginal value. | "From" only; user can use last-N presets to bound the other side. |
| **Heavy date-picker library** (react-datepicker, MUI DatePicker, etc.) | Looks polished. | Ships a lot of JS for one input. Native `<input type="date">` is mobile-perfect. | Native input + presets. |
| **Granularity toggle (day / week / month aggregation)** | Time-series-power-user reflex. | The chart already plots one point per game. There's nothing to aggregate. | Skip. |

---

## Cross-cutting feature dependencies

```
PlayerProfile current ELO
    ├──depends on──> EloChange data on PlayerProfileDTO (backend additive)
    └──enhanced by──> rank, peak, last-delta (cheap backend aggregates)

End-of-game ELO panel
    ├──depends on──> EloChange returned in game-creation response
    ├──merges into──> existing AchievementModal → renamed EndOfGameSummaryModal
    └──reuses──> position styling from PlayerProfile/PlayerScoreSummary

Ranking page chart
    ├──blocks on──> chart library decision (STACK.md)
    ├──depends on──> /api/elo/history endpoint per player (verify exists)
    ├──reuses──> existing MultiSelect component
    └──fed by──> same data that powers the leaderboard above the chart

Multi-player selector
    └──belongs to──> Ranking page (no other consumer)

Date-from filter
    ├──belongs to──> Ranking page
    └──pairs with──> Last-N-games preset (same control region)

URL query state (?players=&from=)
    └──unifies──> multi-select + date filter (implement once)
```

### Sequencing implications for the roadmap

1. **PlayerProfile current ELO ships first** — no new dependencies, smallest surface, validates the DTO shape that other surfaces will reuse.
2. **End-of-game panel ships second** — depends on the modal refactor (rename + always-mount even when no achievements). Reuses ELO-DTO shape.
3. **Ranking page ships last** — blocked on chart-library decision and is the largest surface. Multi-select and date filter ship inside it as one phase, not two.

---

## MVP Definition

### Launch with v1.1

Truly minimal feature set that satisfies the milestone goal "make ELO visible":

- [x] **PlayerProfile**: current ELO + delta-from-last-game as a fourth Stats tile — *essential*
- [x] **End-of-game**: per-player `previous → new (±delta)` rows colored green/red, embedded in the existing post-game modal — *essential, this is the only place users see ELO move*
- [x] **Ranking page (new route)**: multi-line chart with default = all players selected, "from date" preset filter (Todo / 6 meses / 30 días), current-rank leaderboard above the chart, hover/tap tooltip with date + value — *essential, the headline feature*
- [x] **Empty states** for all three surfaces — *essential, cheap*

### Add after validation (v1.2-ish, only if the friend group asks for it)

- [ ] **Peak rating** on PlayerProfile — trigger: someone asks "what's my best ever?"
- [ ] **Rank ("#2 de 6")** on PlayerProfile — trigger: "who's currently leading?" friction
- [ ] **Sparkline** in the PlayerProfile ELO tile — trigger: chart library is in place and proven
- [ ] **Click-line-to-highlight** on Ranking chart — trigger: the chart feels noisy with all 6 lines
- [ ] **Last-N-games preset** alongside date filter — trigger: "30 days" feels arbitrary
- [ ] **URL query state** for shareable views — trigger: someone wants to share a specific comparison
- [ ] **Click data point → game detail** — trigger: "what was that game on April 12?" friction
- [ ] **"New peak!" badge** in end-of-game modal — trigger: peak rating is shipped on profile

### Future / explicitly deferred (v2+ or never)

- [ ] **Glicko / rating deviation** — requires backend rewrite; out of charter
- [ ] **Tier/division names** — chrome without value for closed group
- [ ] **Percentile** — meaningless at small N
- [ ] **Real-time updates / websockets** — irrelevant for manual-entry app
- [ ] **Zoom/pan/brush on chart** — mobile-hostile, covered by filter
- [ ] **Stacked area variant of ELO** — mathematically wrong
- [ ] **Trend projection / forecast lines** — statistically dishonest at this N
- [ ] **Per-player export image** — out of scope for private app
- [ ] **Per-game records-broken markers on chart** — couples to deferred records redesign

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Current ELO tile in PlayerProfile Stats | HIGH | LOW (S) | P1 |
| Delta-from-last-game on PlayerProfile | HIGH | LOW (S) | P1 |
| End-of-game ELO rows (prev → new ±delta, color-coded) | HIGH | LOW (S) | P1 |
| Embed ELO in existing AchievementModal (rename to EndOfGameSummaryModal) | HIGH | MEDIUM (M, refactor) | P1 |
| Ranking page route + multi-line chart | HIGH | MEDIUM-HIGH (M-L, library + glue) | P1 |
| Default-all multi-select | HIGH | LOW (S, MultiSelect exists) | P1 |
| "From date" filter with 3 presets | HIGH | LOW (S) | P1 |
| Tooltip (hover + tap) on chart | HIGH | MEDIUM (M) | P1 |
| Current-rank leaderboard above chart | HIGH | MEDIUM (M) | P1 |
| Empty states (all surfaces) | HIGH | LOW (S) | P1 |
| Peak rating on profile | MEDIUM | LOW (S) | P2 |
| Rank ("#2 de 6") on profile | MEDIUM | LOW-MEDIUM (S-M) | P2 |
| Click-line-to-highlight | MEDIUM | MEDIUM (M) | P2 |
| Click-data-point → game | MEDIUM | LOW (S) | P2 |
| "Last N games" preset | MEDIUM | LOW (S) | P2 |
| URL query state | MEDIUM | LOW-MEDIUM (S-M) | P2 |
| "New peak!" badge in modal | MEDIUM | LOW (S) | P2 |
| Sparkline on profile tile | MEDIUM | MEDIUM (M) | P2 |
| Reset-zoom / show-all button | LOW | LOW (S) | P3 |
| Per-game records markers on chart | LOW | MEDIUM (M) | P3 |
| Tier names / percentile / Glicko deviation | LOW | HIGH | OUT |
| Brush/zoom, real-time, projection lines, share-images | LOW | HIGH | OUT |

**Priority key:** P1 = milestone v1.1 launch; P2 = v1.2 once-validated; P3 = consider only if asked; OUT = explicit anti-feature.

---

## Competitor / reference analysis

| Feature | Lichess | Chess.com | Board Game Arena | Scored / Score Door | Recommended for tm-scorekeeper |
|---------|---------|-----------|------------------|----------------------|--------------------------------|
| Profile current rating | Hero stat, multiple variants | Hero stat per game-mode | Per-game ELO listed | Profile shows ELO + delta | Hero stat, single ELO (no variants — all our games are the same game) |
| Peak rating exposed | Yes (per variant) | Yes | No (only current) | Yes | **Defer to P2** — small group, cheap to add later |
| Rating delta after game | Small text near result | Animated, prominent | Per-position breakdown shown | Prominent, with explanation | **Prominent, color-coded, all participants** |
| Rating evolution chart | Built-in profile chart with date filter | Built-in profile chart with date filter | No native, third-party tools | Yes, per-player history | **Build it, multi-player overlay** |
| Multi-player overlay on chart | No (1v1 sport) | No | No | Limited | **Our differentiator** — fits the social/local-multiplayer setting |
| Date filter | Calendar picker + presets | Presets only | N/A | Date range | **Presets only** for v1.1, custom date later |
| Glicko deviation | Yes, exposed | Yes, internal only | No | No | **Skip** — backend doesn't compute it |

The single most "ours" thing in this matrix is the **multi-player overlay on the evolution chart**. Chess apps don't need this (1v1, anonymous opponents). BGA has it conceptually but only for the same table. For a closed friend group of N players sharing the same dataset, putting all N lines on one chart is the *right* default — and that informs the multi-select and "default: all" decisions above.

---

## Open product questions for /gsd-discuss

These surfaced during research and are intentionally NOT decided here. They block requirements:

1. **End-of-game modal scope** — does the existing `AchievementModal` get renamed/extended into a unified `EndOfGameSummaryModal` (ELO + records broken + achievements), or does ELO get a sibling modal? Strong recommendation in this research: unify. Confirm with user.
2. **X-axis: date vs game-index** — for a low-frequency-play app, calendar-spaced ticks produce a sparse chart. Game-indexed x-axis is more readable but breaks the "from date" filter mental model. Pick one before chart implementation.
3. **Chart legend = multi-select?** — should the legend on the chart be the same control as the player multi-select, or two synced components? Recommendation: one component to avoid double-state, but UX preference matters.
4. **What does the leaderboard show besides current ELO?** — games played? last-game delta? trend arrow? Picking column set affects DTO shape.
5. **Initial ELO value rendering** — for a player who hasn't played yet, do we render the seeded 1500 as their rating, or "—"? Affects empty-state design.
6. **Peak / rank in v1.1 or v1.2?** — research says v1.2; user may want them in v1.1 since they're cheap (~1 day each). Cost-of-delay decision.

---

## Sources

- [Lichess Changelog](https://lichess.org/changelog)
- [Lichess FAQ — rating system](https://lichess.org/faq)
- [Lichess Rating Systems doc](https://lichess.org/page/rating-systems)
- [Lichess GitHub issue: end-of-game rating display in TV menu](https://github.com/lichess-org/lila/issues/13121)
- [Chess.com — checking your ELO](https://support.chess.com/en/articles/9855780-how-can-i-check-my-elo-on-chess-com)
- [Board Game Arena — Rating doc](https://en.doc.boardgamearena.com/Rating)
- [Scored: Board Game Tracker (Google Play)](https://play.google.com/store/apps/details?id=pl.remotion.scored&hl=en_US)
- [Score Door — Go Score Tracker (ELO scorekeeper)](https://www.scoredoor.app/game/go)
- [Board Game Stats](https://www.bgstatsapp.com/)
- [Tom Kerrigan — Multiplayer Elo](https://www.tckerrigan.com/Misc/Multiplayer_Elo/)
- [Building a Multiplayer Elo Rating System — Gautam Narula](https://gautamnarula.com/rating/)
- [UI Patterns — Leaderboard](https://ui-patterns.com/patterns/leaderboard)
- [Mobiscroll — Date filtering with predefined ranges (React)](https://demo.mobiscroll.com/react/range/date-filtering-with-predefined-ranges)
- [Metabase — Visualization mistakes (chart with too many series)](https://www.metabase.com/blog/visualization-mistakes)
- [Metabase docs — charts with multiple series](https://www.metabase.com/docs/latest/dashboards/multiple-series)
- [Recharts — toggle visibility of elements via legend (issue #329)](https://github.com/recharts/recharts/issues/329)
- [Recharts — toggle on legend click (issue #590)](https://github.com/recharts/recharts/issues/590)
- [MUI X — React Sparkline chart](https://mui.com/x/react-charts/sparkline/)
- [Chakra UI — Sparkline](https://chakra-ui.com/docs/charts/sparkline)
- [Filter UX Design Patterns — Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering)

---
*Feature research for: ELO visualization frontend layer (milestone v1.1) over an existing multiplayer scorekeeper app.*
*Researched: 2026-04-27*
