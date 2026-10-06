---
phase: 11
plan: 05
type: execute
wave: 4
depends_on: [11-02, 11-03, 11-04]
files_modified:
  - frontend/src/pages/Ranking/Ranking.tsx
  - frontend/src/pages/Ranking/Ranking.module.css
  - frontend/src/test/components/Ranking.test.tsx
autonomous: true
requirements: [RANK-03, RANK-04, RANK-06]
must_haves:
  truths:
    - "Page mounts → fires getEloHistory() ONCE in useEffect (Promise-style, no React Query)"
    - "Page consumes useRankingFilters(activePlayerIds) and renders <RankingFilters> wired to its setters"
    - "Page applies applyRankingFilters(dataset, players, fromDate) in useMemo to derive filteredPoints"
    - "Loading state → Spinner; Error state → '.errorBox' with 'Reintentar' button (counter-bumped refetch — D-B2)"
    - "Empty state when filteredPoints across all players === 0 OR selectedPlayers.length === 0 → 'Sin partidas en este rango' (or 'Selecciona al menos un jugador') + 'Limpiar filtros' CTA (D-C5/SC#6)"
    - "Otherwise (≥1 point) → chart skeleton block with min-height 280px (D-B5/D-B6)"
    - "Page never wraps any value in new Date() — opaque YYYY-MM-DD throughout"
  artifacts:
    - path: "frontend/src/pages/Ranking/Ranking.tsx"
      provides: "Ranking page (data fetcher + filter pipeline + render gates)"
      exports: ["default Ranking"]
    - path: "frontend/src/pages/Ranking/Ranking.module.css"
      provides: "Page layout + chart skeleton + empty state styling, all tokens"
      contains: "var(--color"
    - path: "frontend/src/test/components/Ranking.test.tsx"
      provides: "Page integration tests covering loading / error / empty / skeleton render gates"
      contains: "describe('Ranking"
  key_links:
    - from: "frontend/src/pages/Ranking/Ranking.tsx"
      to: "frontend/src/api/elo.ts (getEloHistory)"
      via: "useEffect on mount"
      pattern: "getEloHistory\\(\\)"
    - from: "frontend/src/pages/Ranking/Ranking.tsx"
      to: "frontend/src/hooks/useRankingFilters.ts"
      via: "hook call passing activePlayerIds from usePlayers"
      pattern: "useRankingFilters\\("
    - from: "frontend/src/pages/Ranking/Ranking.tsx"
      to: "frontend/src/components/RankingFilters/RankingFilters.tsx"
      via: "rendered child with setters from hook"
      pattern: "&lt;RankingFilters"
    - from: "frontend/src/pages/Ranking/Ranking.tsx"
      to: "frontend/src/utils/rankingFilters.ts (applyRankingFilters)"
      via: "useMemo client-side filter"
      pattern: "applyRankingFilters"
---

<objective>
Build the `Ranking` page — the integration layer that ties together: fetch (Plan 02 `getEloHistory`), URL filter state (Plan 03 `useRankingFilters`), filter UI (Plan 04 `<RankingFilters>`), pure filter pipeline (Plan 02 `applyRankingFilters`), the existing `usePlayers` hook for active-player options, and rendering of the four mutually-exclusive states (loading / error / empty / skeleton).

Why a dedicated plan: the page is the only piece that combines fetch + render gates + skeleton + empty state. Bundling with the routing / Home tile (Plan 06) would mix data-rendering concerns with global app config. This is also the largest single file in the phase — keeping it isolated keeps the executor's context budget under 30%.

Closes RANK-03 (default = all active when URL empty — observable in the rendered UI), RANK-04 (Desde filter affects rendered dataset), and RANK-06 (URL state persistence — page is the integration point where the user verifies share/reload). The chart itself (RANK-02) and leaderboard (RANK-05) ship in Phase 12; this plan delivers ONLY the skeleton placeholder.

Purpose: Render a working `/ranking` page that Plan 06 can wire into routing, with all four render gates testable in vitest.

Output: 3 files (page + CSS + test), all tests green, no `new Date(` anywhere.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-RESEARCH.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-02-types-api-utils-PLAN.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-03-useRankingFilters-hook-PLAN.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-04-RankingFilters-component-PLAN.md
@frontend/src/api/elo.ts
@frontend/src/hooks/usePlayers.ts
@frontend/src/hooks/useRankingFilters.ts
@frontend/src/components/RankingFilters/RankingFilters.tsx
@frontend/src/components/Spinner/Spinner.tsx
@frontend/src/components/Button/Button.tsx
@frontend/src/utils/rankingFilters.ts
@frontend/src/pages/PlayerProfile/PlayerProfile.tsx
@frontend/src/pages/PlayerProfile/PlayerProfile.module.css
@frontend/src/test/components/PlayerProfile.test.tsx
@frontend/src/types/index.ts

<interfaces>
<!-- Locked exports from Plans 02-04 the page consumes. -->

```typescript
// from '@/api/elo'
export function getEloHistory(): Promise<PlayerEloHistoryDTO[]>

// from '@/hooks/useRankingFilters'
export function useRankingFilters(activePlayerIds: string[] | null): {
  players: string[]; fromDate: string | null
  setPlayers: (next: string[]) => void
  setFromDate: (next: string | null) => void
  clearAll: () => void
}

// from '@/utils/rankingFilters'
export function applyRankingFilters(
  dataset: PlayerEloHistoryDTO[],
  selectedPlayerIds: string[],
  fromDate: string | null,
): PlayerEloHistoryDTO[]

// from '@/components/RankingFilters/RankingFilters'
export interface RankingFiltersProps {
  players: string[]; fromDate: string | null
  activePlayersOptions: { value: string; label: string }[]
  onPlayersChange: (next: string[]) => void
  onFromDateChange: (next: string | null) => void
  onClear: () => void
}

// from '@/hooks/usePlayers' (existing)
// usePlayers({ activeOnly: true }) → { players: PlayerResponseDTO[], loading, error, ... }
// PlayerResponseDTO has { player_id: string, name: string, is_active: boolean, ... }
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Write Ranking page test FIRST (RED), then implement Ranking.tsx + .module.css (GREEN)</name>
  <files>
    frontend/src/test/components/Ranking.test.tsx
    frontend/src/pages/Ranking/Ranking.tsx
    frontend/src/pages/Ranking/Ranking.module.css
  </files>
  <read_first>
    - frontend/src/pages/PlayerProfile/PlayerProfile.tsx (lines 1-90 — canonical fetch idiom + render gates)
    - frontend/src/pages/PlayerProfile/PlayerProfile.module.css (.errorBox lines 160-163, .emptyState lines 171-187, .header/.main layout)
    - frontend/src/test/components/PlayerProfile.test.tsx (lines 1-70 — vi.mock pattern, MemoryRouter wrapper, waitFor idiom)
    - frontend/src/utils/rankingFilters.ts (Plan 02 — applyRankingFilters signature)
    - frontend/src/hooks/useRankingFilters.ts (Plan 03 — hook return shape)
    - frontend/src/components/RankingFilters/RankingFilters.tsx (Plan 04 — props contract)
    - frontend/src/components/Spinner/Spinner.tsx (loading visual)
    - frontend/src/hooks/usePlayers.ts (active-player source)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md (§`src/pages/Ranking/Ranking.tsx` lines 384-473, §`.module.css` lines 477-552, §test lines 556-609)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-RESEARCH.md (§"Pattern 1 — Inline useEffect + Promise.all" lines 262-299, §Pitfall E lines 511-518, "retryCount refetch trick")
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md (D-B1, D-B2, D-B3, D-B4, D-B5, D-B6, D-C5)
  </read_first>
  <behavior>
    Test cases (RED first; mock at module top):

    Mocks:
    - `vi.mock('@/api/elo', () => ({ getEloHistory: vi.fn() }))`
    - `vi.mock('@/hooks/usePlayers', () => ({ usePlayers: vi.fn() }))` (or mock `@/api/players` getPlayers — match the existing project convention; PATTERNS.md line 568 shows the precedent)

    Rendered with:
    ```typescript
    function renderAt(initialEntry: string) {
      return render(
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/ranking" element={<Ranking />} />
          </Routes>
        </MemoryRouter>,
      )
    }
    ```

    1. **Loading: Spinner shown until both fetches resolve (Pitfall E).**
       - usePlayers returns `{ players: [], loading: true, error: null }`
       - getEloHistory returns a never-resolving promise
       - renderAt('/ranking') → assert `screen.getByRole('status')` or whatever Spinner exposes (read Spinner.tsx; if it's a div with `role="status"` use that, else fall back to text 'Cargando' or class assertion)

    2. **Skeleton: data loads → ≥1 point in resolved selection → chart skeleton renders.**
       - usePlayers returns 2 active players
       - getEloHistory resolves with 2 PlayerEloHistoryDTO entries each having ≥1 point
       - renderAt('/ranking')
       - `await waitFor(() => expect(screen.queryByText(/sin partidas/i)).not.toBeInTheDocument())`
       - assert the chart skeleton container is rendered: `expect(container.querySelector('[data-testid="chart-skeleton"]') || container.querySelector('.chartSkeleton')).toBeTruthy()` — prefer adding `data-testid="chart-skeleton"` to the skeleton block

    3. **Empty state — filter excludes all data (D-C5/SC#6):**
       - usePlayers returns 2 active players
       - getEloHistory resolves with points all on `2025-01-01`
       - renderAt('/ranking?from=2026-01-01') → after waitFor, assert `screen.getByText('Sin partidas en este rango')` AND `screen.getByRole('button', { name: /limpiar filtros/i })`

    4. **Empty state — explicit `?players=` (zero selected, D-C2):**
       - renderAt('/ranking?players=') → after waitFor, assert `screen.getByText(/selecciona al menos un jugador/i)` AND a 'Limpiar filtros' button is visible

    5. **Error state with Reintentar button:**
       - getEloHistory rejects with `new Error('boom')`
       - renderAt('/ranking') → after waitFor, assert error text `screen.getByText(/no se pudo cargar el ranking/i)` AND `screen.getByRole('button', { name: /reintentar/i })`
       - clicking Reintentar triggers a second `getEloHistory()` call (assert mock call count == 2)

    6. **Default fallback — URL clean → all-active selected → skeleton:**
       - renderAt('/ranking') with usePlayers = 2 active + history with 1 point each
       - assert skeleton block visible (no empty state)

    7. **Limpiar filtros from empty state navigates URL to clean:**
       - Start at `/ranking?from=2026-01-01` with no points after that date
       - After waitFor, click 'Limpiar filtros' button
       - Assert URL changes to `/ranking` (or `/ranking?` — drop both keys); assert skeleton now visible (data is no longer filtered out)

    8. **Source-file regression guards (acceptance criteria):**
       - `! grep "new Date" frontend/src/pages/Ranking/Ranking.tsx`
       - `! grep " style=" frontend/src/pages/Ranking/Ranking.tsx`
  </behavior>
  <action>
    **STEP A — RED:** Create `frontend/src/test/components/Ranking.test.tsx`. Use the PlayerProfile.test.tsx idiom verbatim where possible. Define the 7 test cases above. Run vitest — all RED.

    **STEP B — GREEN (page):** Create `frontend/src/pages/Ranking/Ranking.tsx` matching PATTERNS.md §`src/pages/Ranking/Ranking.tsx` (lines 384-473). Apply the function-size discipline: extract any block exceeding 20 LOC into a private helper or render-fragment.

    Imports:
    ```typescript
    import { useEffect, useMemo, useState } from 'react'
    import { getEloHistory } from '@/api/elo'
    import { usePlayers } from '@/hooks/usePlayers'
    import { useRankingFilters } from '@/hooks/useRankingFilters'
    import { applyRankingFilters } from '@/utils/rankingFilters'
    import RankingFilters from '@/components/RankingFilters/RankingFilters'
    import Button from '@/components/Button/Button'
    import Spinner from '@/components/Spinner/Spinner'
    import type { PlayerEloHistoryDTO } from '@/types'
    import styles from './Ranking.module.css'
    ```

    Page structure:
    ```typescript
    export default function Ranking() {
      const { players: allPlayers, loading: playersLoading, error: playersError } = usePlayers({ activeOnly: true })
      const activePlayerIds = useMemo<string[] | null>(
        () => (playersLoading ? null : allPlayers.filter((p) => p.is_active).map((p) => p.player_id)),
        [allPlayers, playersLoading],
      )
      const activePlayersOptions = useMemo(
        () => allPlayers.filter((p) => p.is_active).map((p) => ({ value: p.player_id, label: p.name })),
        [allPlayers],
      )
      const { players: selectedPlayers, fromDate, setPlayers, setFromDate, clearAll } = useRankingFilters(activePlayerIds)

      const [dataset, setDataset] = useState<PlayerEloHistoryDTO[]>([])
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState<string | null>(null)
      const [retryCount, setRetryCount] = useState(0)

      useEffect(() => {
        setLoading(true); setError(null)
        getEloHistory()
          .then((data) => setDataset(data))
          .catch(() => setError('No se pudo cargar el ranking.'))
          .finally(() => setLoading(false))
      }, [retryCount])

      const filtered = useMemo(
        () => applyRankingFilters(dataset, selectedPlayers, fromDate),
        [dataset, selectedPlayers, fromDate],
      )
      const totalPoints = useMemo(
        () => filtered.reduce((sum, p) => sum + p.points.length, 0),
        [filtered],
      )

      // …render gates (extracted below if exceeding 20 LOC)…
    }
    ```

    Render gates — render in this exact priority:
    1. `playersLoading || loading` → `<Spinner />`
    2. `playersError || error` → error block + Reintentar button (only refetches getEloHistory; usePlayers has its own retry; for Phase 11 a single Reintentar bumps retryCount which only refetches history — this is acceptable per D-B2 because usePlayers errors are rare and existing-page convention)
    3. Otherwise: render `<RankingFilters>` wired to hook setters
    4. Below filters:
       - if `selectedPlayers.length === 0` → empty state with text "Selecciona al menos un jugador" + Limpiar filtros button
       - else if `totalPoints === 0` → empty state with text "Sin partidas en este rango" + Limpiar filtros button
       - else → chart skeleton block with `data-testid="chart-skeleton"` (4-5 `<div className={styles.skeletonLine} />` placeholder lines inside `<div className={styles.chartSkeleton}>`)

    Reintentar button: `<Button onClick={() => setRetryCount((c) => c + 1)}>Reintentar</Button>` — RESEARCH lines 290-298.

    CRITICAL rules:
    - **No `new Date(`** anywhere
    - **No inline styles** (no `style={...}` attributes)
    - **No hardcoded user-facing strings outside the JSX** (Spanish per project convention — error message "No se pudo cargar el ranking." per PATTERNS.md §Error & Empty Patterns line 781)
    - **Mutual exclusion** of loading/error: at start of effect set both to clean state
    - If the rendering body of `Ranking` exceeds 30 LOC after the hooks, extract `renderEmptyState({ kind: 'no-players' | 'no-data', onClear })`, `renderChartSkeleton()`, and `renderError({ onRetry })` as small inner functions or top-level helpers in the same file. Each helper ≤20 LOC (CLAUDE.md §3).

    **STEP C — GREEN (CSS):** Create `frontend/src/pages/Ranking/Ranking.module.css` mirroring PlayerProfile.module.css (PATTERNS.md §`src/pages/Ranking/Ranking.module.css` lines 477-552). Required classes:
    - `.page`, `.header`, `.main` — layout (flex column, max-width 700px, design tokens)
    - `.errorBox` — verbatim from PlayerProfile.module.css:160-163
    - `.emptyState`, `.emptyHeading`, `.emptyBody` — verbatim from PlayerProfile.module.css:171-187
    - `.chartSkeleton` — `min-height: 280px; background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-lg); padding: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-md);`
    - `.skeletonLine` — `height: 8px; background-color: var(--color-border); border-radius: var(--border-radius-sm);`

    No hardcoded colors, no hardcoded spacing pixels except the literal `8px` and `min-height: 280px` (these are layout primitives — research D-B5 explicitly allows the 280px in CSS; the 8px line height is a layout primitive, not a color/space token candidate).

    Run `npx vitest run src/test/components/Ranking.test.tsx` — all 7 tests must pass.

    Implements RANK-03 (default-all-active observable in skeleton render), RANK-04 (Desde filter excludes points lexicographically), RANK-06 (URL state drives the selection — verified via initialEntries in tests), and SC#6 (empty state with "Limpiar filtros" CTA).
  </action>
  <verify>
    <automated>cd frontend &amp;&amp; npx vitest run src/test/components/Ranking.test.tsx --reporter=basic 2>&amp;1 | tail -40</automated>
  </verify>
  <acceptance_criteria>
    - File `frontend/src/pages/Ranking/Ranking.tsx` exists; `grep -c "^export default function Ranking" frontend/src/pages/Ranking/Ranking.tsx` == 1
    - `! grep "new Date" frontend/src/pages/Ranking/Ranking.tsx`
    - `! grep " style=" frontend/src/pages/Ranking/Ranking.tsx`
    - `grep -c "Sin partidas en este rango" frontend/src/pages/Ranking/Ranking.tsx` >= 1 (D-C5)
    - `grep -ci "selecciona al menos un jugador" frontend/src/pages/Ranking/Ranking.tsx` >= 1 (D-C2)
    - `grep -c "No se pudo cargar el ranking" frontend/src/pages/Ranking/Ranking.tsx` >= 1
    - `grep -c "Reintentar" frontend/src/pages/Ranking/Ranking.tsx` >= 1
    - `grep -c "Limpiar filtros" frontend/src/pages/Ranking/Ranking.tsx` >= 1
    - `grep "applyRankingFilters" frontend/src/pages/Ranking/Ranking.tsx`
    - `grep "useRankingFilters" frontend/src/pages/Ranking/Ranking.tsx`
    - `grep -c "data-testid=\"chart-skeleton\"" frontend/src/pages/Ranking/Ranking.tsx` >= 1
    - File `frontend/src/pages/Ranking/Ranking.module.css` exists; `grep -c "var(--" frontend/src/pages/Ranking/Ranking.module.css` >= 12
    - `! grep -E "#[0-9a-fA-F]{3,6}" frontend/src/pages/Ranking/Ranking.module.css`
    - `grep -c "min-height: 280px" frontend/src/pages/Ranking/Ranking.module.css` >= 1 (D-B5)
    - File `frontend/src/test/components/Ranking.test.tsx` exists; `grep -c "^  it(" frontend/src/test/components/Ranking.test.tsx` >= 6
    - `npx vitest run src/test/components/Ranking.test.tsx` exits 0 with all tests green
    - `npx tsc --noEmit` from `frontend/` exits 0
  </acceptance_criteria>
  <done>
    Page renders all 4 gate states (loading / error / empty / skeleton). All 6+ tests green. Filters wired through to the hook. RANK-03 / RANK-04 / RANK-06 / SC#6 demonstrably closed in component tests.
  </done>
</task>

</tasks>

<verification>
- 6+ page integration tests green covering loading / error / two empty states / skeleton / Reintentar
- `npx tsc --noEmit` from `frontend/` exits 0
- Full suite `npx vitest run` from `frontend/` still green (no regressions across earlier plans)
- Source has zero `new Date(`, zero inline styles
- Spanish user-facing strings present and exact ("Sin partidas en este rango", "Selecciona al menos un jugador", "No se pudo cargar el ranking.", "Reintentar", "Limpiar filtros")
</verification>

<success_criteria>
- `<Ranking />` mounts → fetches → renders one of 4 gates correctly given URL + active-player state
- Skeleton block has `data-testid="chart-skeleton"` so Phase 12 has a stable replacement target
- Plan 06 can wire `<Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />` immediately
</success_criteria>

<output>
After completion, create `.planning/phases/11-ranking-page-skeleton-filters-url-state/11-05-SUMMARY.md` documenting:
- Render-gate priority order (paste exact if/else chain in pseudocode)
- Test count + green confirmation per behavior case
- Confirmation: zero `new Date(`, zero ` style=`, zero hex literals in CSS, all 5 Spanish strings present
- LOC of the page component body and any extracted helpers
</output>
