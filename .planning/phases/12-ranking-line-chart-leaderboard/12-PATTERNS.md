# Phase 12: Ranking line chart + leaderboard - Pattern Map

**Mapped:** 2026-05-01
**Files analyzed:** 7 (5 new, 2 modified)
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `frontend/src/components/EloLineChart/EloLineChart.tsx` | component | transform | `frontend/src/components/EloSummaryCard/EloSummaryCard.tsx` | role-match |
| `frontend/src/components/EloLineChart/EloLineChart.module.css` | config (styles) | — | `frontend/src/components/EloSummaryCard/EloSummaryCard.module.css` | exact |
| `frontend/src/components/EloLeaderboard/EloLeaderboard.tsx` | component | transform | `frontend/src/components/PlayerScoreSummary/PlayerScoreSummary.tsx` | role-match |
| `frontend/src/components/EloLeaderboard/EloLeaderboard.module.css` | config (styles) | — | `frontend/src/pages/PlayerProfile/PlayerProfile.module.css` (`.gameRow` / `.statsGrid` patterns) | role-match |
| `frontend/src/pages/Ranking/Ranking.tsx` | component (page) | request-response | `frontend/src/pages/Ranking/Ranking.tsx` itself | exact (modify) |
| `frontend/src/pages/Ranking/Ranking.module.css` | config (styles) | — | `frontend/src/pages/Ranking/Ranking.module.css` itself | exact (modify) |
| `frontend/src/test/setup.ts` | config (test) | — | `frontend/src/test/setup.ts` itself | exact (modify) |

---

## Pattern Assignments

### `frontend/src/components/EloLineChart/EloLineChart.tsx` (component, transform)

**Analog:** `frontend/src/components/EloSummaryCard/EloSummaryCard.tsx`

**Imports pattern** (lines 1–2):
```typescript
import type { PlayerEloSummaryDTO } from '@/types'
import styles from './EloSummaryCard.module.css'
```
Apply as:
```typescript
import type { PlayerEloHistoryDTO } from '@/types'
import styles from './EloLineChart.module.css'
// plus Recharts named imports:
// import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
```

**Props interface pattern** (lines 3–6):
```typescript
interface EloSummaryCardProps {
  summary: PlayerEloSummaryDTO
}
```
Apply as a typed props interface at the top of the file before the function declaration. New interface:
```typescript
interface EloLineChartProps {
  data: PlayerEloHistoryDTO[]
}
```

**A11y wrapper pattern** — `EloSummaryCard` uses `aria-label` on the root `<section>` (line 25):
```tsx
<section className={styles.card} aria-label="Resumen de ELO">
```
Apply as: `<div role="img" aria-label="Gráfico de evolución de ELO por jugador" className={styles.wrapper}>`. Required by D-10.

**Helper function pattern** (lines 8–18) — pure functions defined above the component, no hooks:
```typescript
function formatDelta(d: number): string { ... }
function deltaClass(d: number): string { ... }
```
Apply: define `playerColor(playerId: string): string` and `formatXAxisTick(date: string): string` as module-level pure functions above `EloLineChart`.

**No inline styles rule** — `EloSummaryCard` passes zero `style` attributes; all visual variants use CSS Module class conditionals. For chart lines, Recharts `<Line stroke={...}>` must receive colors from the deterministic palette function, not from CSS variables (Recharts SVG cannot read CSS variables for `stroke`). This is the one deliberate exception; all other DOM elements use CSS Module classes only.

**Accessible data table pattern** (D-10 requirement — no existing codebase analog, use CONTEXT.md):
```tsx
<details>
  <summary className={styles.a11yToggle}>Ver datos como tabla</summary>
  <table className={styles.a11yTable}>
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</details>
```
The `<details>`/`<summary>` pattern is native HTML — no library needed.

---

### `frontend/src/components/EloLineChart/EloLineChart.module.css` (styles)

**Analog:** `frontend/src/components/EloSummaryCard/EloSummaryCard.module.css`

**Card/wrapper container pattern** (lines 1–9):
```css
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
```
Apply as `.wrapper` — same token set, no hardcoded values. The chart container `div` inside `.wrapper` sets the responsive height (280px mobile, 400px desktop) — see Ranking.module.css section below for the media query pattern, since D-07 says height lives in `Ranking.module.css` on the container div, not inside the component itself.

**Muted text pattern** (line 30, `heroLabel`):
```css
.heroLabel {
  color: var(--color-text-muted);
}
```
Apply as `.a11yToggle`, `.a11yTable` — use `var(--color-text-muted)` and `var(--font-size-sm)` for the visually recessive accessible table toggle.

**Token-only rule** — zero hardcoded hex colors or pixel values for spacing; only design tokens from `index.css`. Exception: Recharts `stroke` colors on `<Line>` are passed as JS string hex values from the palette function (SVG attribute, not CSS property).

---

### `frontend/src/components/EloLeaderboard/EloLeaderboard.tsx` (component, transform)

**Analog:** `frontend/src/components/PlayerScoreSummary/PlayerScoreSummary.tsx`

**Imports pattern** (lines 1–2):
```typescript
import { calcRunningTotal, type PartialScores } from '@/utils/gameCalculations'
import styles from './PlayerScoreSummary.module.css'
```
Apply as:
```typescript
import type { PlayerEloHistoryDTO } from '@/types'
import styles from './EloLeaderboard.module.css'
```

**Null/empty guard pattern** (line 16):
```tsx
if (players.length === 0) return null
```
Apply: `if (data.length === 0) return null` — consistent early return for empty input.

**List rendering pattern** (lines 18–29):
```tsx
return (
  <div className={styles.container}>
    <p className={styles.title}>Puntos acumulados</p>
    <div className={styles.players}>
      {players.map((p) => (
        <div key={p.player_id} className={styles.player}>
          <span className={styles.playerName}>{p.name}</span>
          <span className={styles.playerScore}>{calcRunningTotal(p.scores)}</span>
        </div>
      ))}
    </div>
  </div>
)
```
Apply as a `<table>` (semantic HTML for tabular ranked data) instead of `<div>` list, keeping the same CSS Module class discipline. Rows keyed by `player_id`. Columns: Pos, Jugador, ELO actual, Última delta (sign-formatted).

**Derived data computation pattern** — `PlayerScoreSummary` calls `calcRunningTotal(p.scores)` inline inside JSX. For `EloLeaderboard`, pre-compute leaderboard rows in a `useMemo` or derive as a pure function at the top of the component (following CLAUDE.md "separar lógica y presentación"). Sort by `elo_after` descending, tiebreaker by `player_name` alphabetical (D-09).

**Delta formatting** — reuse `EloSummaryCard`'s `formatDelta` pattern (lines 8–11 of `EloSummaryCard.tsx`):
```typescript
function formatDelta(d: number): string {
  if (d > 0) return `+${d}`
  if (d < 0) return `${d}`
  return '±0'
}
```
Copy this function verbatim (or import from a shared util if one is created).

---

### `frontend/src/components/EloLeaderboard/EloLeaderboard.module.css` (styles)

**Analog:** `frontend/src/pages/PlayerProfile/PlayerProfile.module.css` (`.gameRow`, `.gameDate`, `.gamePoints`, `.statsGrid` patterns)

**Row layout pattern** (PlayerProfile lines 89–101):
```css
.gameRow {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--color-text);
  transition: border-color var(--transition), background-color var(--transition);
}
```
Apply as table `<tr>` rows with equivalent spacing and border tokens. Since `<table>` is used, adapt to `border-collapse: collapse` and `padding` on `<td>`.

**Section title pattern** (RecordsSection.module.css lines 13–19):
```css
.sectionTitle {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}
```
Apply as `.tableCaption` or a `<caption>` element for the "Ranking" label above the table.

**Muted column pattern** (PlayerProfile lines 107–112):
```css
.gameDate {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
```
Apply for "Pos" and "Última delta" columns that are secondary to "ELO actual".

---

### `frontend/src/pages/Ranking/Ranking.tsx` (modify — replace `renderChartSkeleton`)

**Analog:** `frontend/src/pages/Ranking/Ranking.tsx` itself (lines 40–134)

**Import addition pattern** — existing imports at lines 1–11. Add after line 7 (`RankingFilters` import):
```typescript
import EloLineChart from '@/components/EloLineChart/EloLineChart'
import EloLeaderboard from '@/components/EloLeaderboard/EloLeaderboard'
```

**Replacement target** — `renderChartSkeleton()` call at line 134:
```tsx
: renderChartSkeleton()}
```
Replace with:
```tsx
: (
  <>
    <div className={styles.chartContainer}>
      <EloLineChart data={filtered} />
    </div>
    {totalPoints === 1 && (
      <p className={styles.singlePointHint}>Solo hay una partida en este rango</p>
    )}
    <EloLeaderboard data={dataset} />
  </>
)}
```
Note: `dataset` (unfiltered) goes to `EloLeaderboard`, `filtered` goes to `EloLineChart` — D-08 requirement.

**Remove `renderChartSkeleton` function** — lines 40–49 are deleted entirely since the skeleton is replaced by the real chart.

**`cancelled` guard pattern** — fetch effect at lines 77–90 is unchanged. No new data fetching in Phase 12.

---

### `frontend/src/pages/Ranking/Ranking.module.css` (modify — chart container styles)

**Analog:** `frontend/src/pages/Ranking/Ranking.module.css` itself (existing `.chartSkeleton` pattern, lines 59–68)

**Existing skeleton pattern to replace/extend** (lines 59–74):
```css
.chartSkeleton {
  min-height: 280px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.skeletonLine {
  height: 8px;
  background-color: var(--color-border);
  border-radius: var(--border-radius-sm);
}
```
Delete `.chartSkeleton` and `.skeletonLine`. Add:
```css
.chartContainer {
  height: 280px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
}

@media (min-width: 768px) {
  .chartContainer {
    height: 400px;
  }
}

.singlePointHint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;
}
```
`ResponsiveContainer` in `EloLineChart` handles `width: 100%`; height is driven by the parent `.chartContainer` div — D-07.

**Media query pattern** — this codebase has not used `@media` queries yet inside CSS Modules. The pattern is standard CSS inside `.module.css` files (Vite/CSS Modules pass through `@media` transparently). Use `min-width: 768px` per D-07 decision.

---

### `frontend/src/test/setup.ts` (modify — add ResizeObserver mock)

**Analog:** `frontend/src/test/setup.ts` itself (lines 1–17)

**Existing mock pattern** (lines 5–17):
```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })
```
Follow the same `Object.defineProperty(window, ...)` pattern. Add after line 17:
```typescript
// Mock ResizeObserver so Recharts ResponsiveContainer doesn't crash in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
```
D-01 requires this 3-line stub. Place it after the `localStorage` mock to keep all jsdom polyfills grouped.

---

## Shared Patterns

### CSS Modules — no inline styles
**Source:** `frontend/src/components/RankingFilters/RankingFilters.tsx` line 87 test assertion and CLAUDE.md
**Apply to:** `EloLineChart.tsx`, `EloLeaderboard.tsx`
```typescript
// RankingFilters.test.tsx line 87-89 enforces this contract:
it('rendered DOM has zero elements with a style attribute', () => {
  const { container } = render(<RankingFilters {...defaultProps} />)
  expect(container.querySelectorAll('[style]').length).toBe(0)
})
```
Exception: Recharts `<Line stroke={color}>` uses the `stroke` prop (SVG attribute) — this is unavoidable and should be called out in a comment.

### Design token usage
**Source:** `frontend/src/index.css` (lines 1–53)
**Apply to:** Both new CSS Modules
Key tokens for new files:
- `--color-surface: #2c1810` — chart and table background (palette must pass 3:1 WCAG contrast against this)
- `--color-text-muted: #a89080` — secondary text (axis labels, muted columns, single-point hint)
- `--color-border: #4a2c1a` — borders on chart wrapper and table rows
- `--color-text: #f5e6d3` — primary text (player names, ELO values)
- `--color-success: #27ae60` — positive delta in leaderboard
- `--color-error: #e74c3c` — negative delta in leaderboard

### Component test structure
**Source:** `frontend/src/test/components/EloSummaryCard.test.tsx` (lines 1–107)
**Apply to:** `frontend/src/test/components/EloLineChart.test.tsx`, `frontend/src/test/components/EloLeaderboard.test.tsx`
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EloSummaryCard from '@/components/EloSummaryCard/EloSummaryCard'
import type { PlayerEloSummaryDTO } from '@/types'

const baseSummary: PlayerEloSummaryDTO = { ... }  // fixture at top

describe('EloSummaryCard', () => {
  it('renders ...', () => {
    render(<EloSummaryCard summary={baseSummary} />)
    expect(screen.getByText('...')).toBeInTheDocument()
  })
})
```
Note: `EloLineChart` tests that involve `ResponsiveContainer` require the `ResizeObserver` mock already added to `setup.ts`. No additional per-test setup needed.

### `vi.mock` pattern for API/hook dependencies
**Source:** `frontend/src/test/components/Ranking.test.tsx` (lines 5–12)
```typescript
vi.mock('@/api/elo', () => ({
  getEloHistory: vi.fn(),
  getEloSummary: vi.fn(),
}))
vi.mock('@/hooks/usePlayers', () => ({
  usePlayers: vi.fn(),
}))
```
Apply in `Ranking.test.tsx` modifications: `chart-skeleton` assertions will be replaced by assertions that verify `EloLineChart` renders (e.g. `role="img"` wrapper, `aria-label`).

### `@/` path alias
**Source:** Every existing import in the codebase (e.g. `@/types`, `@/components/...`, `@/utils/...`)
**Apply to:** All new files — never use relative paths that cross directory boundaries.

---

## No Analog Found

All files have sufficient analogs in the codebase. The only novel element is the Recharts library itself — use CONTEXT.md decisions (D-01 through D-10) and the research files as the authoritative reference for Recharts-specific API usage (`ResponsiveContainer`, `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `accessibilityLayer`).

---

## Metadata

**Analog search scope:** `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/test/`
**Files scanned:** 18 source files read in full
**Pattern extraction date:** 2026-05-01
