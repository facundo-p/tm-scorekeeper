# Stack Research — v1.1 ELO Visualization Frontend

**Domain:** React 18 + TypeScript + Vite, mobile-first SPA with CSS Modules + CSS custom-property design tokens
**Researched:** 2026-04-27
**Confidence:** HIGH for charting and date pickers (Context7 + npm registry verified). HIGH for "no new date utility needed" (codebase grep confirmed). HIGH for multi-select chips (existing component covers it).

---

## TL;DR — What to Add

| Need | Recommendation | Add to package.json |
|------|----------------|--------------------|
| Line chart of ELO history | **Recharts 3.8.1** | `recharts` |
| Multi-player chip selector | **Reuse existing `MultiSelect` component** — no dependency | (none) |
| "From date" filter on chart | **Native `<input type="date">`** via existing `Input` component | (none) |
| Date formatting | **Reuse existing `frontend/src/utils/formatDate.ts`** (no library) | (none) |

**Net dependency cost: 1 new package (recharts).**

---

## Core Technologies (additions only)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| recharts | 3.8.1 | SVG line chart for ELO evolution over time | (1) SVG-based, so chart elements accept `stroke="var(--color-accent)"` and `fill="var(--color-primary)"` directly — integrates natively with the project's CSS-variable design tokens defined in `src/index.css`. (2) Tooltip and Legend components accept `className` props, so CSS Modules apply cleanly. (3) Declarative React component API (LineChart / Line / XAxis / Tooltip / Legend / ResponsiveContainer) — no imperative drawing surface to manage in a useEffect. (4) `ResponsiveContainer` handles mobile-first sizing automatically. (5) Built-in keyboard navigation in v3 (accessibilityLayer enabled by default). (6) Peer-deps support React 16-19 → safe with React 18.3.1. (7) Established choice (~1.8M weekly downloads on npm) with active 2026 releases. |

### Why NOT the obvious alternatives (full reasoning below)

- **Chart.js + react-chartjs-2** — smallest gzip footprint of the field, but renders to `<canvas>`. CSS Modules cannot style canvas children, theme tokens have to be re-read via `getComputedStyle` and re-fed as JS strings, and accessibility requires manual `role="img"` + `aria-label` because screen readers can't read canvas content. Wrong fit for our CSS-variable workflow.
- **Visx** — smallest bundle (~12-15KB) and most flexible, but it's a "build your chart from primitives" toolkit. Writing axis + line + tooltip + crosshair + responsive container by hand for a single chart is overkill for one screen and adds maintenance debt.
- **Nivo** — beautiful and accessible, but `@nivo/line` alone is ~370KB and the package set drags in `react-spring`. Larger payload than Recharts for a comparable React+SVG result.
- **Victory** — ~1.16MB. Cross-platform (Native) is irrelevant here. Not justified.
- **ECharts (echarts-for-react)** — full-featured but Canvas-based, opinionated theming via JS objects, large core. Same canvas-styling issue as Chart.js.
- **lightweight-charts** — TradingView's library, optimized for financial OHLC/candlestick data with built-in price-scale + time-axis assumptions. ELO history fits awkwardly and the API is very specific to finance.

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | Multi-select | The existing `frontend/src/components/MultiSelect/` chip component already covers "select which players to plot." It uses CSS Modules with the project tokens (`--color-surface`, `--color-accent`, `--spacing-*`), supports mobile-first 36px touch targets, and exposes `(value: string[], onChange)`. Just feed it the player list. |
| (none) | — | Date picker | The existing `frontend/src/components/Input/Input.tsx` already accepts `type="date"` (already used in `pages/GameForm/steps/StepGameSetup.tsx:33` and `pages/GamesList/GamesList.tsx:119`). Native `<input type="date">` triggers the OS-native picker on iOS Safari and Android Chrome — best mobile UX, zero bundle cost. |
| (none) | — | Date utility | Grep of `frontend/src/` shows zero usage of date-fns, dayjs, moment, or `Intl.DateTimeFormat`. The custom `utils/formatDate.ts` (1 file, 10 lines, Spanish month abbreviations) handles the project's display needs. ELO history endpoints already return ISO date strings; sorting/filtering by date is a string compare on `YYYY-MM-DD`. No library needed. |

---

## Development Tools

No additions. The existing toolchain (Vite 6, vitest 3, Testing Library 16, Playwright 1.49, TypeScript 5.6) is sufficient.

**Vitest + Recharts note:** Recharts uses `ResizeObserver` inside `ResponsiveContainer`. jsdom does not implement it. For unit tests, mock it once in `src/test/setup.ts`:

```ts
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any
```

Or pass explicit `width`/`height` props to the chart in tests instead of relying on `ResponsiveContainer`.

---

## Installation

```bash
# Inside frontend/
npm install recharts@^3.8.1
```

That is the entire dependency addition for this milestone.

No `-D` additions. No transitive lock issues — Recharts 3.x peer-depends on `react ^16.8 || ^17 || ^18 || ^19` and `react-dom` matching, which fits the project's `react ^18.3.1`.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Recharts | Chart.js + react-chartjs-2 | If a future requirement forces canvas-rendering performance with **>5,000 data points per series** on low-end mobile — at that scale SVG starts struggling and canvas wins. Not applicable to ELO history (one row per player per game; realistic dataset is <2,000 rows). |
| Recharts | Visx | If the design ever needs a chart shape Recharts doesn't ship (custom radial layouts, hex grids, sankey-style flows). For a standard time-series line chart, Visx is unnecessary work. |
| Recharts | Nivo | If "out-of-the-box WCAG 2.1 AA compliance with zero accessibility code from us" becomes a hard requirement. Nivo wins on accessibility defaults but at ~3-4× the bundle. |
| Existing `MultiSelect` | Radix Primitives Checkbox | Only if we needed indeterminate state, controlled-vs-uncontrolled subtleties, or shared focus management with a popover. The chip pattern in the existing component is already the right UX for "filter this chart by these players." |
| Native `<input type="date">` | react-day-picker 9.14.0 | Only if product asks for: range-with-preview, multi-month view, locale month names overridden in component (Safari uses OS locale), or styled day cells. Adds ~10-15KB gzip + a `react-day-picker/style.css` global stylesheet that conflicts with our CSS-variable theme unless we rewrite it. |
| `formatDate.ts` helper | date-fns 4.1.0 | If the milestone grows to need `differenceInDays`, `addMonths`, timezone-aware parsing, or relative time ("hace 3 días"). For ISO date strings + Spanish month labels, the existing helper is enough. date-fns is ESM and tree-shakable, so it's the right pick **if** that day comes — but don't add it preemptively. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Chart.js / react-chartjs-2 / ECharts | Canvas rendering breaks the project's CSS-variable + CSS-Modules theming model. Tokens have to be read via `getComputedStyle(document.documentElement).getPropertyValue('--color-accent')` and re-passed as JS strings — fragile and out of step with every other component in this repo. Accessibility requires manually authored `role="img"` + `aria-label`. | **Recharts** — SVG accepts `stroke="var(--color-accent)"` directly. |
| Victory | ~1.16MB, dual-targets React Native. Mobile-first matters here, dead React-Native code does not. | **Recharts** for SVG; **Visx** if you ever need "DIY primitives." |
| @nivo/line | ~370KB just for the line module; pulls react-spring transitively. Animation budget that this app doesn't need. | **Recharts** — comparable React+SVG result, lighter payload. |
| lightweight-charts (TradingView) | Domain-specific to finance. ELO is conceptually similar (a number over time) but the API assumes OHLC, price scales, crosshair semantics for trading. Forcing it on ELO data is a fight you don't need. | **Recharts** — generic time-series line chart. |
| moment.js | Legacy, not tree-shakable, ~70KB gzipped, project is in maintenance mode. | If a date library ever becomes necessary: **date-fns 4.1.0** or **dayjs 1.11.20**. |
| Inline `style={{ ... }}` on chart components | Violates project rule: "Sin inline styling. CSS separado y reutilizable." | Pass `var(--color-accent)` strings directly as the `stroke`/`fill` **prop value** (not as `style`). For Tooltip and Legend, use the `className` prop with a CSS Module class. |
| react-day-picker / react-datepicker | Both ship a global stylesheet with their own design tokens; integrating into our CSS-variable theme means rewriting their CSS or accepting a visual-mismatch debt. ~10-30KB gzipped on top. The native picker on iOS and Android is already excellent. | **Native `<input type="date">`** — already proven in `GameForm` and `GamesList`. |
| react-aria / Radix multi-select for "which players to show" | Existing `MultiSelect.tsx` component already does this with our tokens, our chip aesthetic, and our 36px touch targets. Adding a primitive lib means owning two parallel multi-select patterns. | **Reuse `frontend/src/components/MultiSelect/`** — pass `players.map(p => ({ value: p.id, label: p.name }))`. |

---

## Stack Patterns by Variant

**If the chart needs to plot >2,000 points per series (unlikely for ELO):**
- Switch to Recharts' `<Line dot={false} isAnimationActive={false} />` to skip per-point dot SVG nodes and the entry animation. Keeps SVG performance acceptable up to ~10K points.

**If the design requires custom tooltip layout (e.g. show player avatar + delta):**
- Implement a `<CustomTooltip />` component, pass it via `<Tooltip content={<CustomTooltip />} />`. Tooltip wraps it in a div that accepts our `className` and CSS Module styles — no inline-style escape needed.

**If "from date" filtering needs to highlight a selected range on the chart:**
- Use Recharts' `<ReferenceArea x1={fromDate} x2={lastDate} />`. Pure SVG, takes `stroke`/`fill` like any other element, themable with `var(--color-accent)`.

**If the player chip selector needs "select all / clear all" affordances:**
- Add two buttons next to the existing `MultiSelect` (using the existing `Button` component in `components/Button/`). Don't extend `MultiSelect.tsx` — keep it a generic primitive.

---

## Integration Points (for the downstream consumer)

1. **API layer.** Add `frontend/src/api/elo.ts` next to existing `players.ts`/`games.ts`. Endpoints exposed by backend PR #42 (player ELO read + ELO history) are reachable via the existing `api` client (`api.get<T>(path)` from `src/api/client.ts`). No new HTTP plumbing.

2. **Data hook.** Add `frontend/src/hooks/useElo.ts` mirroring the pattern in `useGames.ts` and `usePlayers.ts` (functional `useState` + `useCallback` returning `{ data, loading, error, refetch }`). Recharts is purely a presentation layer — feed it whatever shape the hook returns.

3. **Chart component.** New `frontend/src/components/EloLineChart/EloLineChart.tsx` + `.module.css`. Mounts inside the new Ranking page (`pages/Ranking/`). Accepts `{ history: EloHistoryRow[], selectedPlayerIds: string[], fromDate?: string }` — all derivation lives in the component, no chart-specific logic in the page.

4. **Filters.** The Ranking page composes the existing `MultiSelect` (player picker) + existing `Input type="date"` (from-date) above the chart. Selection state lives in the page; the chart is a pure render of `(history, filters) => <LineChart>`.

5. **PlayerProfile + GameRecords (current ELO + before/after).** No chart needed — these are number displays. New small `<EloBadge value={...} delta={...} />` component using existing tokens. Lucide icon (already a dep) for the trend arrow.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| recharts@3.8.1 | react@^18.3.1, react-dom@^18.3.1 | Peer range is `^16.8 || ^17 || ^18 || ^19`. React 18.3.1 is in range. |
| recharts@3.8.1 | vite@^6.0.5 | Recharts ships ESM + CJS with proper `exports` field. Vite 6 tree-shakes the unused chart types via Rollup. |
| recharts@3.8.1 | typescript@^5.6.3 | Ships own `.d.ts`. v3.8 added generics on `data` and `dataKey` props — improves type safety on `<Line dataKey="elo_after" />`. |
| recharts@3.8.1 | vitest@^3.2.4 + jsdom@^25 | Requires `ResizeObserver` mock in `setup.ts` (jsdom doesn't ship one). Trivial 3-line stub. |

---

## Sources

- `/recharts/recharts` (Context7) — line chart, ResponsiveContainer, accessibility, customize/styling sections — HIGH confidence
- npm registry (`npm view`) — confirmed current versions: recharts 3.8.1 (modified 2026-03-25), react-chartjs-2 5.3.1, chart.js 4.5.1, victory 37.3.6, @nivo/line 0.99.0, @visx/* 3.12.0, echarts 6.0.0, echarts-for-react 3.0.6, lightweight-charts 5.2.0, react-day-picker 9.14.0, date-fns 4.1.0, dayjs 1.11.20 — HIGH confidence
- npm `peerDependencies` for recharts — `react ^16.8 || ^17 || ^18 || ^19` — HIGH confidence
- [Reshaped — Recharts integration guide](https://www.reshaped.so/docs/getting-started/guidelines/recharts) — confirmed `stroke="var(--token-name)"` works directly on Recharts Line/Area/Bar — HIGH confidence
- [Recharts Customization Guide](https://recharts.github.io/en-US/guide/customize/) — Tooltip/Legend accept `className` and `style` props — MEDIUM (page truncation)
- [PkgPulse — Recharts vs Chart.js vs Nivo vs Visx 2026](https://www.pkgpulse.com/blog/recharts-vs-chartjs-vs-nivo-vs-visx-react-charting-2026) — bundle-size relativities, Canvas-vs-SVG accessibility tradeoffs — MEDIUM
- [Querio — Top React Chart Libraries 2026](https://querio.ai/articles/top-react-chart-libraries-data-visualization) — corroborated bundle ranges and tree-shaking behaviour — MEDIUM
- Project codebase grep — verified zero current usage of date-fns / dayjs / moment / Intl.DateTimeFormat in `frontend/src/`; verified `<input type="date">` already used in `GameForm` and `GamesList`; verified existing `MultiSelect` chip component matches the new requirement — HIGH confidence
- `frontend/src/index.css` — verified design tokens that the chart must consume (`--color-accent`, `--color-primary`, `--color-surface`, `--color-text-muted`, etc.) — HIGH confidence

---
*Stack research for: ELO visualization (line chart + filters) on existing React 18 + Vite + CSS Modules SPA*
*Researched: 2026-04-27*
