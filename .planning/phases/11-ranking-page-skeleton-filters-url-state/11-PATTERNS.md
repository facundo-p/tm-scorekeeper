# Phase 11: Ranking page skeleton + filters + URL state — Pattern Map

**Mapped:** 2026-04-30
**Files analyzed:** 16 (10 NEW, 6 MODIFIED)
**Analogs found:** 13 / 16 (3 are pure additions to existing files; analogs apply to the surrounding context)

> **Naming overrides confirmed (RESEARCH §"Recommended File Layout" + §A6):**
> - Pure helpers go in **`src/utils/rankingFilters.ts`** (NOT `src/lib/`) to match existing convention (`gameCalculations.ts`, `formatDate.ts`, `validation.ts`).
> - Test layout uses the **co-located-by-type** convention already in the repo: `src/test/unit/`, `src/test/hooks/`, `src/test/components/`. Tests are NOT co-located next to source — they live under `src/test/{type}/`. (Verified: every test file in the codebase lives under `src/test/{unit,hooks,components,e2e}/`; SKILL.md `new-component` line 54 confirms the components subpath.)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/utils/rankingFilters.ts` | utility (pure-fn) | transform | `src/utils/validation.ts` + `src/utils/formatDate.ts` | exact (role + data flow) |
| `src/test/unit/rankingFilters.test.ts` | test (pure-fn) | n/a | `src/test/unit/validation.test.ts` | exact |
| `src/hooks/useRankingFilters.ts` | hook (URL-state) | transform + side-effect | `src/hooks/usePlayers.ts` (closest existing hook; URL-state is novel) | role-match (no precedent for `useSearchParams` in repo) |
| `src/test/hooks/useRankingFilters.test.ts` | test (hook) | n/a | `src/test/hooks/useGames.test.ts` | exact |
| `src/components/RankingFilters/RankingFilters.tsx` | component (presentational, composer) | request-response (props↑↓) | `src/components/MultiSelect/MultiSelect.tsx` (composition target) + `src/components/EloSummaryCard/EloSummaryCard.tsx` (props-only card shape) | exact |
| `src/components/RankingFilters/RankingFilters.module.css` | style | n/a | `src/components/MultiSelect/MultiSelect.module.css` (sibling token usage) | exact |
| `src/test/components/RankingFilters.test.tsx` | test (component) | n/a | `src/test/components/EloSummaryCard.test.tsx` | exact |
| `src/pages/Ranking/Ranking.tsx` | page (data-fetcher + filter + render) | request-response + transform | `src/pages/PlayerProfile/PlayerProfile.tsx` (fetch idiom — D-14 canonical) + `src/pages/GamesList/GamesList.tsx` (filter+date pipeline) | exact |
| `src/pages/Ranking/Ranking.module.css` | style | n/a | `src/pages/PlayerProfile/PlayerProfile.module.css` | exact |
| `src/test/components/Ranking.test.tsx` | test (page integration) | n/a | `src/test/components/PlayerProfile.test.tsx` | exact |
| `src/App.tsx` (MOD) | config (route) | n/a | existing routes inside same file (lines 30–94) | exact (in-file pattern) |
| `src/pages/Home/Home.tsx` (MOD) | page (nav config) | n/a | existing `navItems` array same file (lines 6–12) | exact (in-file pattern) |
| `src/api/elo.ts` (MOD) | api module | request-response | existing `getEloSummary` same file | exact (in-file pattern) |
| `src/types/index.ts` (MOD) | type module | n/a | existing ELO DTO block (lines 215–235) | exact (in-file pattern) |
| `src/test/setup.ts` (MOD) | test config | n/a | existing setup file | exact (in-file pattern) |

---

## Pattern Assignments

### `src/utils/rankingFilters.ts` (utility, pure-fn / transform)

**Analog:** `src/utils/validation.ts` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/utils/validation.ts`) and `src/utils/formatDate.ts` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/utils/formatDate.ts`).

**Imports pattern** (validation.ts:1-3): named-only relative imports via `@/`-alias, no React, no DOM. Pure data utilities. `formatDate.ts` has zero imports.

**Naming/format pattern** (formatDate.ts:1-10):
```typescript
const MONTHS = ['Ene', 'Feb', 'Mar', ...]

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`
}

export function tryFormatDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDate(value) : value
}
```
Key takeaways:
- **String split, never `new Date()`** — exact rule reinforced by RESEARCH Pattern 4 / Pitfall 4.
- The `^\d{4}-\d{2}-\d{2}$` regex is the project's locked validator for `YYYY-MM-DD`. Reuse verbatim in `parseRankingParams`.
- Top-of-file `const`s for tokens (`MONTHS`); apply same shape for `PLAYERS_KEY = 'players'`, `FROM_KEY = 'from'`.

**Exports pattern** (validation.ts:5,13,20,33,52,62): one named `export function` per concern, no default export, no shared mutable state. Apply to `parseRankingParams` and `serializeRankingParams`.

**Function size discipline** (CLAUDE.md §3 — "refactor si función >20 líneas"): each validation function in validation.ts is 4–14 lines. Keep the two pure ranking-filter functions under 20 lines each; split helpers if needed.

---

### `src/test/unit/rankingFilters.test.ts` (test, pure-fn)

**Analog:** `src/test/unit/validation.test.ts` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/test/unit/validation.test.ts`).

**Imports pattern** (validation.test.ts:1-10):
```typescript
import { describe, it, expect } from 'vitest'
import {
  validateStepGameSetup,
  validateStepPlayerSelection,
  ...
} from '@/utils/validation'
```
- Vitest globals are configured (`vite.config.ts:26 globals: true`) — explicit `import { describe, it, expect } from 'vitest'` is still the project's convention. Mimic this.

**Test structure pattern** (validation.test.ts:24-43):
```typescript
describe('validateStepGameSetup', () => {
  it('returns no errors for valid data', () => {
    expect(validateStepGameSetup({ ... })).toHaveLength(0)
  })

  it('requires date', () => {
    const errors = validateStepGameSetup({ date: '', ... })
    expect(errors.some((e) => e.includes('fecha'))).toBe(true)
  })
  ...
})
```
- One `describe` per function under test.
- Multiple `it` blocks covering happy path + each invariant.
- Direct call into pure function — no mocks, no setup beyond local fixtures.

**SC#5 specific test (TZ-pinned round-trip)** — see RESEARCH §"Recommended TZ-pinning approach" (lines 440-462):
```typescript
describe('rankingFilters — TZ-safe YYYY-MM-DD round-trip (SC#5)', () => {
  it('round-trips from=2026-01-01 unchanged regardless of TZ', () => {
    expect(process.env.TZ).toBe('America/Argentina/Buenos_Aires')
    const initial = new URLSearchParams('?from=2026-01-01')
    const parsed = parseRankingParams(initial)
    expect(parsed.from).toBe('2026-01-01')
    const serialized = serializeRankingParams({ players: [], from: parsed.from })
    expect(serialized.toString()).toBe('from=2026-01-01')
  })
})
```

---

### `src/hooks/useRankingFilters.ts` (hook, URL-state transform + side-effect)

**Analog (closest in role):** `src/hooks/usePlayers.ts` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/hooks/usePlayers.ts`).

> **Note:** No existing hook in the repo uses `useSearchParams`. `usePlayers` is the closest in role (custom hook returning `{ data, setters }`). The URL-state mechanics come from RESEARCH §"Pattern 2" + the sketch in RESEARCH lines 615-685, NOT from a codebase analog.

**Imports + signature pattern** (usePlayers.ts:1-9):
```typescript
import { useState, useEffect, useCallback } from 'react'
import { getPlayers, createPlayer, updatePlayer } from '@/api/players'
import type { PlayerResponseDTO, PlayerCreateDTO, PlayerUpdateDTO } from '@/types'

interface UsePlayersOptions {
  activeOnly?: boolean
}

export function usePlayers({ activeOnly }: UsePlayersOptions = {}) {
  const [players, setPlayers] = useState<PlayerResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  ...
}
```
Apply to `useRankingFilters`:
- Single `export function` (no default).
- Named imports from `react` + `react-router-dom`.
- Type-only import for `RankingFilterState` from `@/utils/rankingFilters`.
- Hook accepts `activePlayerIds: string[] | null` (RESEARCH line 629).

**Setter pattern with `useCallback`** (usePlayers.ts:29-37):
```typescript
const addPlayer = useCallback(async (data: PlayerCreateDTO): Promise<void> => {
  await createPlayer(data)
  await fetchPlayers()
}, [fetchPlayers])
```
Apply same `useCallback`-with-dep-array shape to `setPlayers`, `setFromDate`, `clearAll`. Each setter mutates URL state via `setSearchParams(..., { replace: true })`.

**Hook implementation skeleton** (from RESEARCH lines 615-685): use as the structural template. CRITICAL:
- `useMemo` for `parseRankingParams(searchParams)` derivation — keyed `[searchParams]`.
- `useEffect` for the **idempotent rewrite** (Pitfall B — RESEARCH lines 466-481). Must short-circuit if intersection equals URL set.
- Setters use `useCallback` keyed to `[resolved.*, setSearchParams]`.

**Function-size discipline:** the hook body will exceed 20 lines (the requirement is roughly 30–50 LOC). CLAUDE.md §3 says "refactor si función >20 líneas". Strategy: keep the public hook concise, extract two private helpers (`computeResolved(parsed, activePlayerIds)` and `shouldRewriteUrl(parsed, activePlayerIds)`) to keep each function under 20 lines.

---

### `src/test/hooks/useRankingFilters.test.ts` (test, hook)

**Analog:** `src/test/hooks/useGames.test.ts` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/test/hooks/useGames.test.ts`).

**Imports + mocking pattern** (useGames.test.ts:1-11):
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGames } from '@/hooks/useGames'
import { triggerAchievements } from '@/api/achievements'
import type { AchievementsByPlayerDTO } from '@/types'

vi.mock('@/api/achievements', () => ({
  triggerAchievements: vi.fn(),
}))

const mockTriggerAchievements = vi.mocked(triggerAchievements)
```
Apply: `renderHook` from `@testing-library/react`, `act` for async setters. **Difference for our hook**: `useRankingFilters` requires a `MemoryRouter` wrapper because it uses `useSearchParams`. Pattern (composed from `PlayerProfile.test.tsx:33-40`):
```typescript
import { MemoryRouter } from 'react-router-dom'
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/ranking?players=p1,p2&from=2026-01-01']}>
    {children}
  </MemoryRouter>
)
const { result } = renderHook(() => useRankingFilters(['p1', 'p2', 'p3']), { wrapper })
```

**Setup/teardown pattern** (useGames.test.ts:24-31):
```typescript
beforeEach(() => {
  mockTriggerAchievements.mockReset()
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  warnSpy.mockRestore()
})
```
For our hook tests: no fetch mocks needed (it's URL-only). Use `beforeEach` to reset any state if helpers add it.

**Async assertion pattern** (useGames.test.ts:38-46):
```typescript
let value: AchievementsByPlayerDTO | null = null
await act(async () => {
  value = await result.current.fetchAchievements('game-123')
})
expect(value).toEqual(SAMPLE_PAYLOAD)
```
For URL setters use `act(() => { result.current.setPlayers(['p2']) })` then assert on `result.current.players` and on the URL via the wrapper-injected `useLocation`.

**Test cases to cover (RESEARCH §"Phase Requirements → Test Map" lines 706-714):**
- URL clean → default (all active).
- URL with unknown ID → drops + rewrites once (Pitfall B regression: assert exactly one rewrite).
- Empty intersection → fallback in-memory, NO URL write.
- `setPlayers` writes URL with `replace: true`.
- `clearAll` produces URL `/ranking` (no params).

---

### `src/components/RankingFilters/RankingFilters.tsx` (component, presentational composer)

**Analog (composition target):** `src/components/MultiSelect/MultiSelect.tsx` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/components/MultiSelect/MultiSelect.tsx`).
**Analog (props/style shape):** `src/components/EloSummaryCard/EloSummaryCard.tsx` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/components/EloSummaryCard/EloSummaryCard.tsx`).

**Imports + props interface pattern** (MultiSelect.tsx:1-14):
```typescript
import styles from './MultiSelect.module.css'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  label?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}
```
Apply to `RankingFilters`:
- CSS Module import alone (`import styles from './RankingFilters.module.css'`).
- Plus reuse `MultiSelect` (`import MultiSelect from '@/components/MultiSelect/MultiSelect'`).
- Plus `Button` for "Limpiar filtros" (`import Button from '@/components/Button/Button'`).
- Props interface above the component, **separate** named-handlers per CONTEXT D-A1 + RESEARCH Open Question #3 recommendation:
  ```typescript
  interface RankingFiltersProps {
    players: string[]
    fromDate: string | null
    activePlayersOptions: MultiSelectOption[]
    onPlayersChange: (next: string[]) => void
    onFromDateChange: (next: string | null) => void
    onClear: () => void
  }
  ```

**Functional component pattern** (MultiSelect.tsx:16-48):
```typescript
export default function MultiSelect({ label, options, value, onChange, error }: MultiSelectProps) {
  const toggle = (optValue: string) => { ... }
  return (
    <div className={styles.wrapper}>
      ...
    </div>
  )
}
```
- `export default function`.
- Destructured props in signature.
- Internal helpers as inner const functions when small; otherwise extract above (per CLAUDE.md §3).

**Date input handler pattern** (GamesList.tsx:73-75):
```typescript
const setFilter = (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
  setFilters((prev) => ({ ...prev, [key]: e.target.value }))
}
// usage:
<input type="date" className={styles.dateInput} value={filters.dateFrom} onChange={setFilter('dateFrom')} />
```
Apply for `<RankingFilters>`'s date handler:
```typescript
const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // CRITICAL: pass through as opaque string. Empty input → null. Never new Date().
  onFromDateChange(e.target.value === '' ? null : e.target.value)
}
```

**"Limpiar" button pattern** (GamesList.tsx:131-133):
```typescript
{activeFilterCount > 0 && (
  <Button variant="ghost" size="sm" onClick={clearFilters}>Limpiar</Button>
)}
```
Apply: always-visible "Limpiar filtros" button (D-C4 — full reset, not conditional). Use `variant="ghost"`.

---

### `src/components/RankingFilters/RankingFilters.module.css` (style)

**Analog:** `src/components/MultiSelect/MultiSelect.module.css` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/components/MultiSelect/MultiSelect.module.css`) and `src/pages/GamesList/GamesList.module.css:35-50`.

**Token usage pattern** (MultiSelect.module.css:1-33):
```css
.wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
}

.option {
  ...
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  ...
  min-height: 36px;
}
```
Apply to RankingFilters CSS:
- Mobile-first layout (`flex-direction: column; gap: var(--spacing-md)`).
- All colors via tokens (`--color-text-muted`, `--color-border`, `--color-surface`, `--color-error`).
- All spacing via tokens (`--spacing-xs/sm/md/lg`).
- 36px+ touch targets on the date input and Limpiar button.
- No inline styles, no hardcoded colors (CLAUDE.md Frontend Rules).

**Date input style pattern** (GamesList.module.css:43-50):
```css
.dateInput {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  color: var(--color-text);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}
```
Reuse the same shape for the "Desde" date input inside RankingFilters.

---

### `src/test/components/RankingFilters.test.tsx` (test, component)

**Analog:** `src/test/components/EloSummaryCard.test.tsx` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/test/components/EloSummaryCard.test.tsx`).

**Imports + render pattern** (EloSummaryCard.test.tsx:1-12):
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EloSummaryCard from '@/components/EloSummaryCard/EloSummaryCard'
import type { PlayerEloSummaryDTO } from '@/types'

const baseSummary: PlayerEloSummaryDTO = { ... }

describe('EloSummaryCard', () => {
  it('renders current_elo', () => {
    render(<EloSummaryCard summary={baseSummary} />)
    expect(screen.getByText('1523')).toBeInTheDocument()
  })
```
Apply: `render` directly (no router needed for a controlled-props component); use `screen.getByText` / `getByRole` / `getByLabelText` (a11y-first per `new-component` SKILL.md line 60). Local fixtures as `const` blocks.

**Interaction test idiom** (need `fireEvent` or `userEvent` — use `fireEvent` from `@testing-library/react` to keep dep surface unchanged):
```typescript
import { fireEvent } from '@testing-library/react'
const onPlayersChange = vi.fn()
render(<RankingFilters ... onPlayersChange={onPlayersChange} />)
fireEvent.click(screen.getByText('✓ Alice'))
expect(onPlayersChange).toHaveBeenCalledWith([])  // toggles off
```

---

### `src/pages/Ranking/Ranking.tsx` (page, fetch + filter + render)

**Analog (canonical fetch idiom, D-14):** `src/pages/PlayerProfile/PlayerProfile.tsx` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/pages/PlayerProfile/PlayerProfile.tsx`).
**Analog (fetch + filter pipeline + date input):** `src/pages/GamesList/GamesList.tsx` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/pages/GamesList/GamesList.tsx`).

**Imports pattern** (PlayerProfile.tsx:1-13):
```typescript
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPlayerProfile, getPlayers } from '@/api/players'
import { getEloSummary } from '@/api/elo'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
...
import type { PlayerProfileDTO, ... } from '@/types'
import styles from './PlayerProfile.module.css'
```
Apply to `Ranking.tsx`:
```typescript
import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getEloHistory } from '@/api/elo'
import { usePlayers } from '@/hooks/usePlayers'
import { useRankingFilters } from '@/hooks/useRankingFilters'
import RankingFilters from '@/components/RankingFilters/RankingFilters'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import type { PlayerEloHistoryDTO } from '@/types'
import styles from './Ranking.module.css'
```

**Fetch pattern (D-B2 + D-B3 — D-14 idiom)** (PlayerProfile.tsx:28-45):
```typescript
useEffect(() => {
  if (!playerId) return
  const profilePromise = Promise.all([getPlayerProfile(playerId), getPlayers()])
  const summaryPromise = getEloSummary(playerId).catch(() => null)

  Promise.all([profilePromise, summaryPromise])
    .then(([[profileData, playersData], summaryData]) => {
      setProfile(profileData)
      setPlayerName(playersData.find((p) => p.player_id === playerId)?.name ?? playerId)
      setEloSummary(summaryData)
    })
    .catch(() => setError('No se pudo cargar el perfil del jugador.'))
    .finally(() => setLoading(false))
}, [playerId])
```
Apply to Ranking with the **`retryCount` refetch trick** (RESEARCH lines 290-298):
```typescript
const [retryCount, setRetryCount] = useState(0)
useEffect(() => {
  setLoading(true); setError(null)
  getEloHistory()
    .then((data) => setDataset(data))
    .catch(() => setError('No se pudo cargar el ranking.'))
    .finally(() => setLoading(false))
}, [retryCount])
// "Reintentar" button: onClick={() => setRetryCount((c) => c + 1)}
```

**Client-side filter pattern (D-A4)** — copy `useMemo` shape from GamesList.tsx:63-71:
```typescript
const filtered = useMemo(
  () => applyFilters(games, players, filters),
  [games, players, filters]
)
```
And the lexicographic date compare from GamesList.tsx:33-34 (RESEARCH Pattern 4 / Pitfall 4):
```typescript
if (filters.dateFrom && game.date < filters.dateFrom) return false
if (filters.dateTo && game.date > filters.dateTo) return false
```
Note: **string compare on `'YYYY-MM-DD'` is the locked project rule.** Reuse for `points.recorded_at >= fromDate`.

**Render gates (loading / error / empty / skeleton)** (PlayerProfile.tsx:81-83):
```tsx
{loading && <Spinner />}
{error && <p className={styles.errorBox}>{error}</p>}
```
Plus add **empty state block** matching PlayerProfile.tsx:162-167:
```tsx
<div className={styles.emptyState}>
  <h2 className={styles.emptyHeading}>Sin partidas en este rango</h2>
  <p className={styles.emptyBody}>...</p>
  <Button variant="ghost" onClick={clearAll}>Limpiar filtros</Button>
</div>
```

**Function-size discipline:** the page render body will be long; extract the filter pipeline to `applyRankingFilters(dataset, players, fromDate)` in `src/utils/rankingFilters.ts` (same file as parse/serialize) to avoid duplicating logic and keep render pure. Mirror GamesList's `applyFilters` (lines 28-37).

---

### `src/pages/Ranking/Ranking.module.css` (style)

**Analog:** `src/pages/PlayerProfile/PlayerProfile.module.css` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/pages/PlayerProfile/PlayerProfile.module.css`).

**Layout pattern** (PlayerProfile.module.css:1-36):
```css
.page { min-height: 100vh; display: flex; flex-direction: column; }

.header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-md);
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
}
```
Apply identically to `Ranking.module.css`.

**Empty state pattern** (PlayerProfile.module.css:171-187):
```css
.emptyState {
  text-align: center;
  padding: var(--spacing-xl) 0;
}
.emptyHeading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs);
}
.emptyBody {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}
```
Apply verbatim.

**Error box pattern** (PlayerProfile.module.css:160-163):
```css
.errorBox {
  color: var(--color-error);
  text-align: center;
}
```

**Skeleton block** (NEW — no analog in repo, D-B5/D-B6 inline-only): use design tokens for background/lines:
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
  background-color: var(--color-border); /* muted gray, no hardcoded colors */
  border-radius: var(--border-radius-sm);
}
```

---

### `src/test/components/Ranking.test.tsx` (test, page integration)

**Analog:** `src/test/components/PlayerProfile.test.tsx` (`/Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend/src/test/components/PlayerProfile.test.tsx`).

**Imports + mock pattern** (PlayerProfile.test.tsx:1-19):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('@/api/players', () => ({
  getPlayerProfile: vi.fn(),
  getPlayers: vi.fn(),
}))
vi.mock('@/api/elo', () => ({
  getEloSummary: vi.fn(),
}))

import PlayerProfile from '@/pages/PlayerProfile/PlayerProfile'
import { getPlayerProfile, getPlayers } from '@/api/players'
```
Apply: `vi.mock('@/api/elo', () => ({ getEloHistory: vi.fn() }))` and `vi.mock('@/hooks/usePlayers', ...)` (or mock `getPlayers` on `@/api/players` — the existing convention).

**Render-with-router pattern** (PlayerProfile.test.tsx:33-41):
```typescript
function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/players/p1']}>
      <Routes>
        <Route path="/players/:playerId" element={<PlayerProfile />} />
      </Routes>
    </MemoryRouter>,
  )
}
```
Apply to Ranking with custom `initialEntries` per test (e.g., `['/ranking']`, `['/ranking?players=p1,p2&from=2026-01-01']`).

**Beforeach + assertion pattern** (PlayerProfile.test.tsx:44-70):
```typescript
beforeEach(() => {
  vi.mocked(getPlayerProfile).mockResolvedValue(fixtureProfile)
  vi.mocked(getPlayers).mockResolvedValue(fixturePlayers)
})

it('summary failure does not block profile', async () => {
  vi.mocked(getEloSummary).mockRejectedValue(new Error('elo summary 500'))
  renderRoute()
  await waitFor(() => {
    expect(screen.getByText('Estadísticas')).toBeInTheDocument()
  })
  ...
})
```
Apply: assert empty state appears when `getEloHistory` returns `[]`, error box appears when it rejects, skeleton appears when data has points.

---

### `src/App.tsx` (MOD — add `<Route path="/ranking">`)

**In-file pattern** (App.tsx:30-94 — every existing protected route uses identical shape):
```tsx
<Route
  path="/players"
  element={
    <ProtectedRoute>
      <Players />
    </ProtectedRoute>
  }
/>
```
Apply: add new `Ranking` import after line 13 and a new `<Route>` block before line 94 (`</Routes>`):
```tsx
import Ranking from '@/pages/Ranking/Ranking'
...
<Route
  path="/ranking"
  element={
    <ProtectedRoute>
      <Ranking />
    </ProtectedRoute>
  }
/>
```

---

### `src/pages/Home/Home.tsx` (MOD — append tile)

**In-file pattern** (Home.tsx:6-12):
```typescript
const navItems = [
  { to: '/players', icon: '👥', title: 'Jugadores', description: 'Gestión de jugadores', disabled: false },
  { to: '/games/new', icon: '🎯', title: 'Cargar Partida', description: 'Registrar nueva partida', disabled: false },
  { to: '/games', icon: '📋', title: 'Partidas', description: 'Historial de partidas', disabled: false },
  { to: '/records', icon: '🏆', title: 'Records', description: 'Records globales', disabled: false },
  { to: '/achievements', icon: '🏅', title: 'Logros', description: 'Catalogo de logros', disabled: false },
]
```
Apply: append a 6th object literal (D-D1, D-D2). Position **after Logros** (last). YAGNI on extracting to a typed constant (RESEARCH Open Question #4 recommendation).

```typescript
{ to: '/ranking', icon: '📈', title: 'Ranking', description: 'Evolución de ELO', disabled: false },
```

No CSS change required — `Home.module.css:46-58` grid already wraps:
```css
.nav { display: grid; grid-template-columns: 1fr; gap: var(--spacing-md); ... }
@media (min-width: 640px) { .nav { grid-template-columns: repeat(3, 1fr); ... } }
```

---

### `src/api/elo.ts` (MOD — add `getEloHistory`)

**In-file pattern** (elo.ts:1-14 — sole existing function):
```typescript
import { api } from './client'
import type { PlayerEloSummaryDTO } from '@/types'

/**
 * Fetch the ELO summary for a single player ...
 * No caching. No retries. ...
 */
export function getEloSummary(playerId: string): Promise<PlayerEloSummaryDTO> {
  return api.get<PlayerEloSummaryDTO>(`/players/${playerId}/elo-summary`)
}
```
Apply: add second `import type { PlayerEloHistoryDTO }`, append second exported function with same docstring shape (RESEARCH §"Code Examples — getEloHistory()" lines 527-547):
```typescript
export function getEloHistory(): Promise<PlayerEloHistoryDTO[]> {
  return api.get<PlayerEloHistoryDTO[]>('/elo/history')
}
```
**CRITICAL** (RESEARCH §"Critical Correction" lines 142-156): `api.get<T>` takes only `(path: string)`. Do NOT add a second argument. CONTEXT line 184 was wrong; this phase consumes no params per D-A4.

**Manual query-string convention if ever needed** (players.ts pattern via RESEARCH line 153):
```typescript
const query = active == true ? `?active=${active}` : ''
```
Not needed for Phase 11.

---

### `src/types/index.ts` (MOD — add 2 DTOs)

**In-file pattern** (types/index.ts:215-235 — existing ELO block):
```typescript
// ---- ELO DTOs ----

export interface EloChangeDTO {
  player_id: string
  player_name: string
  elo_before: number
  elo_after: number
  delta: number
}

export interface EloRankDTO {
  position: number
  total: number
}

export interface PlayerEloSummaryDTO {
  current_elo: number
  peak_elo: number | null
  last_delta: number | null
  rank: EloRankDTO | null
}
```
Apply: append `EloHistoryPointDTO` and `PlayerEloHistoryDTO` after `PlayerEloSummaryDTO` (RESEARCH lines 553-578). Mirror Phase 8 backend Pydantic schemas exactly (no drift):
```typescript
export interface EloHistoryPointDTO {
  recorded_at: string  // YYYY-MM-DD opaque string — DO NOT wrap in new Date()
  game_id: string
  elo_after: number
  delta: number
}

export interface PlayerEloHistoryDTO {
  player_id: string
  player_name: string
  points: EloHistoryPointDTO[]
}
```
**Style notes** (matching surrounding lines):
- Single-line block comment header `// ---- ELO DTOs ----` already exists; insert new interfaces inside.
- Inline `//` comment on string fields when semantics matter (precedent: no existing examples; keep comments minimal — only on `recorded_at` to flag the opaque-string rule).

---

### `src/test/setup.ts` (MOD — pin TZ)

**Existing content** (setup.ts:1-17): only `@testing-library/jest-dom` + a `localStorage` polyfill.

**Apply (RESEARCH Pitfall A — lines 419-431):**
```typescript
process.env.TZ = 'America/Argentina/Buenos_Aires'
import '@testing-library/jest-dom'
// ...rest unchanged
```
The `process.env.TZ` assignment **must precede the `@testing-library/jest-dom` import** so V8 picks it up before any module reads `Intl.DateTimeFormat` or `Date` semantics.

Optional belt-and-suspenders (RESEARCH lines 426-430): add a CLI-prefixed `test` script in `package.json`. Discretion of planner — not strictly required because production code is TZ-immune by string-only handling.

---

## Shared Patterns

### Naming & Convention

**Source:** `.planning/codebase/CONVENTIONS.md` (referenced) + observed across all read files.
**Apply to:** All new files.
- **Components & Pages:** PascalCase folders + `.tsx` files. CSS Modules co-located: `Component/Component.module.css`.
- **Hooks:** `use{Resources}.ts` (camelCase, plural noun, `use` prefix). Single hook per file.
- **Utils:** camelCase file + named function exports, no default export, no React imports.
- **DTOs:** PascalCase + `DTO` suffix, mirror backend Pydantic exactly (RESEARCH §3 line 194 / Phase 9 D-13 / Phase 8 plan).
- **Tests:** `*.test.ts` for utils/hooks, `*.test.tsx` for components/pages. **Live under `src/test/{unit,hooks,components}/`** — NOT co-located. (Verified by directory listings.)
- **Spanish for user-facing text** (SKILL.md `new-component` line 75; verified across `usePlayers.ts:22`, `PlayerProfile.tsx:43`, `GamesList.tsx:59`, `MultiSelect.tsx:29`).

### Error & Empty Patterns

**Source:** `src/pages/PlayerProfile/PlayerProfile.tsx:43`, `src/pages/PlayerProfile/PlayerProfile.module.css:160-187`, `src/hooks/usePlayers.ts:21`.
**Apply to:** `Ranking.tsx`, `RankingFilters.tsx`.
- Error message style: `'No se pudo cargar el {recurso}.'` (single-sentence Spanish, period).
- Catch idiom in hook (usePlayers.ts:21): `setError(err instanceof Error ? err.message : 'Error al cargar X')`.
- Catch idiom in page (PlayerProfile.tsx:43): `.catch(() => setError('No se pudo cargar el perfil del jugador.'))` — fixed message, no error-detail leak.
- Mutual exclusion of `loading` and `error`: at start of effect set `loading=true; error=null`.
- `.errorBox` CSS class: `color: var(--color-error); text-align: center;` (PlayerProfile.module.css:160-163).
- `.empty` (inline tone): `color: var(--color-text-muted); font-size: var(--font-size-sm);` (PlayerProfile.module.css:155-158).
- `.emptyState` (full-block, with heading + body): pattern at PlayerProfile.module.css:171-187.

### CSS Tokens

**Source:** `frontend/src/index.css` (referenced via every `*.module.css` file read).
**Apply to:** `RankingFilters.module.css`, `Ranking.module.css`.

Mandatory tokens (verified in use across MultiSelect, EloSummaryCard, PlayerProfile, GamesList, Home):
- Colors: `--color-surface`, `--color-surface-hover`, `--color-background`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-error`, `--color-success`, `--color-primary`.
- Spacing: `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`, `--spacing-2xl`.
- Typography: `--font-size-sm`, `--font-size-base`, `--font-size-lg`, `--font-size-xl`, `--font-size-2xl`, `--font-size-3xl`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`, `--font-weight-normal`.
- Border-radius: `--border-radius-sm`, `--border-radius`, `--border-radius-lg`.
- Animation: `--transition`.

**Rule** (CLAUDE.md Frontend Rules — restated): NO inline styles. NO hardcoded colors. NO hardcoded spacing pixels. Mobile-first.

### React Functional + Hooks Discipline

**Source:** every component file read.
**Apply to:** All new `.tsx` and hook files.
- `export default function ComponentName(...)` for components.
- Named exports for hooks/utils (no default).
- `useState`, `useEffect`, `useMemo`, `useCallback` — never class components.
- Strict mode-safe: effects must be idempotent (RESEARCH Pitfall B).

### Test Idioms

**Source:** `src/test/setup.ts`, `src/test/unit/validation.test.ts`, `src/test/hooks/useGames.test.ts`, `src/test/components/PlayerProfile.test.tsx`, `src/test/components/EloSummaryCard.test.tsx`.
**Apply to:** All new test files.
- Always `import { describe, it, expect, vi, ... } from 'vitest'` even though `globals: true` is on (project convention).
- `vi.mock` at module top, before importing the SUT.
- `vi.mocked(fn)` to retrieve typed mock.
- `await waitFor(() => expect(...).toBeInTheDocument())` for async render assertions.
- `MemoryRouter` + `Routes/Route` wrapper for any test of a hook or page that uses react-router APIs.
- A11y-first queries: `getByText`, `getByLabelText`, `getByRole` (NOT `getByTestId`).
- `screen.queryByX` for negative assertions.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/hooks/useRankingFilters.ts` (URL-state mechanics only) | hook | URL transform | No existing hook in the repo uses `useSearchParams`. Closest role analog is `usePlayers.ts` (custom hook shape, return-object convention). The URL parse/serialize/intersect mechanics come from RESEARCH §"Pattern 2" + §"Pitfall B" + the sketch on RESEARCH lines 615-685. |
| `src/components/RankingFilters/` (composer-of-MultiSelect+date+button) | component | request-response | No existing component in the repo composes MultiSelect together with a date input and a clear button. Closest is `GamesList.tsx:96-134` which inlines all filters into the page itself. The new component extracts that idiom into a reusable shell (D-A1). |
| Chart skeleton CSS block | style | n/a | No skeleton component exists in the codebase (D-B5 confirms YAGNI — inline-only). New CSS block, tokens-only. |

---

## Metadata

**Analog search scope:** `frontend/src/{api,components,hooks,pages,utils,types,test}` — full read of every file referenced by CONTEXT/RESEARCH plus directory listings of all sibling files in each scope.
**Files read in full:** 17 source files + 5 test files + 1 config file + 1 skill file.
**Pattern extraction date:** 2026-04-30
**Open dependency:** Phase 8 endpoint `GET /elo/history` must be live before this phase's tasks can run integration tests against the real backend (RESEARCH §"Open Questions" #1). Plan-level smoke check recommended before kickoff.

---

## PATTERN MAPPING COMPLETE
