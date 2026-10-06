---
phase: 11
plan: 03
type: execute
wave: 2
depends_on: [11-02]
files_modified:
  - frontend/src/hooks/useRankingFilters.ts
  - frontend/src/test/hooks/useRankingFilters.test.ts
autonomous: true
requirements: [RANK-03, RANK-06]
must_haves:
  truths:
    - "Hook reads URL via useSearchParams and exposes resolved { players, fromDate } plus setters"
    - "URL clean (`/ranking`) → resolved.players === activePlayerIds (default to all active, in-memory only — D-C1)"
    - "URL `?players=ghost,real` against active=['real'] → resolved.players === ['real'] AND URL is rewritten ONCE to `?players=real` (D-A3 step 3, idempotent — Pitfall B)"
    - "URL `?players=ghost` against active=['real'] (empty intersection) → resolved.players === ['real'] (in-memory fallback, D-A3 step 4) AND URL is rewritten to drop the players key (URL ends clean)"
    - "URL `?players=` (explicit empty) against any active → resolved.players === [] (respect explicit empty, no auto-default — D-C2/D-C3) AND no URL rewrite"
    - "setPlayers([]) writes URL `?players=` (explicit empty, D-C2)"
    - "setPlayers(['p1','p2']) sorts before serializing (D-A7) AND uses { replace: true } (D-A6)"
    - "setFromDate('2026-01-01') writes URL `?from=2026-01-01` opaquely; never wraps in new Date()"
    - "clearAll() writes URL with NO params (clean — D-C4)"
    - "activePlayerIds === null (loading) → hook returns players: [], fromDate: parsed.from, no URL rewrite (Pitfall E)"
  artifacts:
    - path: "frontend/src/hooks/useRankingFilters.ts"
      provides: "useRankingFilters(activePlayerIds: string[] | null) hook"
      exports: ["useRankingFilters"]
    - path: "frontend/src/test/hooks/useRankingFilters.test.ts"
      provides: "Vitest hook tests using renderHook + MemoryRouter wrapper"
      contains: "describe('useRankingFilters"
  key_links:
    - from: "frontend/src/hooks/useRankingFilters.ts"
      to: "frontend/src/utils/rankingFilters.ts"
      via: "import { parseRankingParams, serializeRankingParams }"
      pattern: "from '@/utils/rankingFilters'"
    - from: "frontend/src/hooks/useRankingFilters.ts"
      to: "react-router-dom useSearchParams"
      via: "URL state read/write with replace: true"
      pattern: "setSearchParams\\([^)]*replace.*true"
    - from: "Empty intersection rewrite"
      to: "URL clean (drop players key)"
      via: "useEffect idempotent guard (Pitfall B)"
      pattern: "useEffect.*activePlayerIds"
---

<objective>
Build `useRankingFilters(activePlayerIds: string[] | null)` — the hook that owns URL state for the Ranking page. It is the single React-y wrapper around the pure functions delivered in Plan 02.

Why a dedicated plan: the hook concentrates the four trickiest behaviors of Phase 11 (intersection, idempotent rewrite, default fallback, explicit-empty distinction). Bundling with the page (Plan 05) would push that plan over budget AND mix a load-bearing pitfall (Pitfall B infinite loop) with rendering concerns. Dedicated plan = focused tests, clean review surface.

Closes the hook layer for RANK-03 (default = all active when URL empty) and RANK-06 (URL persistence + invalid-id filtering).

Purpose: Provide Plan 04 (`<RankingFilters>`) and Plan 05 (`Ranking.tsx`) a stable hook signature that already encodes every D-A1..D-A7 + D-C1..D-C4 decision.

Output: 2 files (1 source + 1 test), all hook tests green, no infinite-rewrite regression.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-RESEARCH.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-02-types-api-utils-PLAN.md
@frontend/src/utils/rankingFilters.ts
@frontend/src/hooks/usePlayers.ts
@frontend/src/test/hooks/useGames.test.ts
@frontend/src/pages/PlayerProfile/PlayerProfile.tsx

<interfaces>
<!-- Locked exports from Plan 02 the hook consumes. -->

```typescript
// from '@/utils/rankingFilters'
export interface RankingFilterState { players: string[]; from: string | null }
export interface RankingParseResult extends RankingFilterState { hasPlayersKey: boolean }
export function parseRankingParams(search: URLSearchParams): RankingParseResult
export function serializeRankingParams(
  state: RankingFilterState,
  opts?: { explicitEmptyPlayers?: boolean },
): URLSearchParams
```

```typescript
// from 'react-router-dom' (already a project dep)
import { useSearchParams } from 'react-router-dom'
const [searchParams, setSearchParams] = useSearchParams()
// setSearchParams accepts URLSearchParams + { replace: true } options
```

Hook public signature this plan ships:
```typescript
export interface UseRankingFiltersResult {
  players: string[]              // resolved (intersected with active OR default-all-active)
  fromDate: string | null
  setPlayers: (next: string[]) => void
  setFromDate: (next: string | null) => void
  clearAll: () => void
}

export function useRankingFilters(activePlayerIds: string[] | null): UseRankingFiltersResult
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Write hook test FIRST (RED), then implement useRankingFilters (GREEN)</name>
  <files>
    frontend/src/test/hooks/useRankingFilters.test.ts
    frontend/src/hooks/useRankingFilters.ts
  </files>
  <read_first>
    - frontend/src/utils/rankingFilters.ts (delivered by Plan 02 — locked imports)
    - frontend/src/hooks/usePlayers.ts (closest hook idiom — useState + useCallback shape)
    - frontend/src/test/hooks/useGames.test.ts (vitest renderHook + act idiom)
    - frontend/src/test/components/PlayerProfile.test.tsx (MemoryRouter wrapper pattern, lines 33-41)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-RESEARCH.md (§"useRankingFilters skeleton" lines 615-685, §"Pitfall B — infinite loop" lines 466-481, §"Pitfall E — 0-active-players race" lines 511-518)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md (§`src/hooks/useRankingFilters.ts` lines 116-160, §`src/test/hooks/useRankingFilters.test.ts` lines 163-220)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md (D-A3 entirety, D-A6, D-A7, D-C1, D-C2, D-C3, D-C4)
  </read_first>
  <behavior>
    All test cases use `renderHook` from `@testing-library/react` with a `MemoryRouter` wrapper. Read the URL after each setter call by exposing it via a custom probe component INSIDE the wrapper, OR via `act` + a separate `useLocation` consumer rendered alongside.

    Test cases (write all RED first, then implement until GREEN):

    A — **Default branch (URL clean → all active):**
    - Initial URL `/ranking`, `activePlayerIds = ['p1','p2','p3']` → `result.current.players === ['p1','p2','p3']`, `result.current.fromDate === null`
    - URL must NOT be rewritten on mount (assert search string remains `''` — D-C1 silence)

    B — **Intersection drop + idempotent rewrite (D-A3 step 3, Pitfall B):**
    - Initial URL `/ranking?players=p1,ghost,p2`, `activePlayerIds = ['p1','p2','p3']` → after one tick `result.current.players === ['p1','p2']` (sorted)
    - URL is rewritten ONCE to `?players=p1%2Cp2` (or equivalent canonical form)
    - Re-render the hook (e.g. `rerender(...)` from `renderHook`); URL is NOT rewritten a second time (Pitfall B regression guard)

    C — **Empty intersection → in-memory fallback + URL clean (D-A3 step 4):**
    - Initial URL `/ranking?players=ghost1,ghost2`, `activePlayerIds = ['p1','p2']` → `result.current.players === ['p1','p2']` (in-memory fallback to all active)
    - URL IS rewritten ONCE to drop the `players` key (URL becomes `/ranking`, clean)
    - Re-render; no second rewrite

    D — **Explicit empty `?players=` → respect, no rewrite (D-C2/D-C3):**
    - Initial URL `/ranking?players=` (key present, value empty), `activePlayerIds = ['p1','p2']` → `result.current.players === []` (respect explicit empty)
    - URL is NOT rewritten (it's already in canonical form)

    E — **`activePlayerIds === null` (loading state, Pitfall E):**
    - Initial URL `/ranking?players=p1`, `activePlayerIds = null` → `result.current.players === []`, `result.current.fromDate` mirrors parsed.from
    - URL is NOT rewritten while loading (cannot compute intersection without active list)

    F — **`setPlayers` setter:**
    - Call `setPlayers(['p2','p1'])` → URL becomes `?players=p1%2Cp2` (sorted, D-A7); writes use `{ replace: true }` (no history entry)
    - Call `setPlayers([])` → URL becomes `?players=` (explicit empty, D-C2); from-date preserved if any
    - Call `setPlayers(['p2','p1'])` while `fromDate === '2026-01-01'` → URL has both keys with players first: `?players=p1%2Cp2&from=2026-01-01` (Pitfall D)

    G — **`setFromDate` setter (RANK-04 + Pitfall F):**
    - Call `setFromDate('2026-02-15')` → URL contains `from=2026-02-15` opaquely; selected players preserved
    - Call `setFromDate(null)` → URL drops the `from` key
    - Hook code MUST NOT call `new Date(...)` — verified by grep on source file (acceptance criteria)

    H — **`clearAll` (D-C4):**
    - Initial URL `/ranking?players=p1,p2&from=2026-01-01` → `result.current.clearAll()` → URL becomes `/ranking` (no params, clean)
    - All setters use `{ replace: true }` — verify by grep on source

    I — **`replace: true` regression guard:**
    - Source file `useRankingFilters.ts` MUST contain `replace: true` (case-sensitive grep) — RANK-06 / D-A6
  </behavior>
  <action>
    **STEP A — RED:** Create `frontend/src/test/hooks/useRankingFilters.test.ts` first.

    Test file shape (mirror `useGames.test.ts` + `PlayerProfile.test.tsx` MemoryRouter wrapper):

    ```typescript
    import { describe, it, expect } from 'vitest'
    import { renderHook, act } from '@testing-library/react'
    import { MemoryRouter, useLocation } from 'react-router-dom'
    import { useRankingFilters } from '@/hooks/useRankingFilters'

    function makeWrapper(initialEntry: string) {
      return ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
      )
    }
    // …describe blocks A–H per <behavior> above…
    ```

    To assert URL state after a setter call, render an additional probe via the wrapper that reads `useLocation().search` and exposes it on a ref, OR call `renderHook` so the hook returns both `result.current` and a captured location object via a tuple wrapper hook (recommended: simple probe that records the latest `useLocation().search` into a ref).

    Run `npx vitest run src/test/hooks/useRankingFilters.test.ts` — module-not-found / assertion failures expected.

    **STEP B — GREEN:** Create `frontend/src/hooks/useRankingFilters.ts`.

    Use the RESEARCH skeleton (lines 615-685) as the structural template, but apply the function-size discipline (PATTERNS.md line 159, CLAUDE.md §3): the public hook will exceed 20 lines. Split into two private helpers at module top-level (NOT inside the hook body — they are pure):

    ```typescript
    function computeResolved(
      parsed: RankingParseResult,
      activePlayerIds: string[] | null,
    ): RankingFilterState { /* ≤15 LOC, returns the resolved state per D-C1/D-C3/D-A3 */ }

    function shouldRewriteUrl(
      parsed: RankingParseResult,
      activePlayerIds: string[] | null,
    ): { rewrite: boolean; nextState: RankingFilterState | null } { /* ≤15 LOC, idempotent guard for Pitfall B */ }
    ```

    Body of `useRankingFilters` (≤20 LOC after extraction):
    1. `const [searchParams, setSearchParams] = useSearchParams()`
    2. `const parsed = useMemo(() => parseRankingParams(searchParams), [searchParams])`
    3. `const resolved = useMemo(() => computeResolved(parsed, activePlayerIds), [parsed, activePlayerIds])`
    4. `useEffect(() => { const { rewrite, nextState } = shouldRewriteUrl(parsed, activePlayerIds); if (!rewrite || !nextState) return; setSearchParams(serializeRankingParams(nextState), { replace: true }) }, [parsed, activePlayerIds, setSearchParams])`
    5. Three `useCallback` setters (`setPlayers`, `setFromDate`, `clearAll`) — every one uses `{ replace: true }`
    6. Return the public `UseRankingFiltersResult` object

    CRITICAL rules:
    - **No `new Date(`** anywhere in the file (Pitfall F regression — `setFromDate(value)` passes the string straight through)
    - **Idempotent rewrite** in the effect: only call `setSearchParams` when `shouldRewriteUrl` returns `rewrite: true`. The helper compares the URL's current `players` against `activePlayerIds.includes`-filtered list using `.sort().join(',')` value equality — never object identity (Pitfall B)
    - **`setPlayers([])`** must pass `{ explicitEmptyPlayers: true }` to `serializeRankingParams` (D-C2 — produces `?players=`)
    - **All setters** use `setSearchParams(..., { replace: true })`
    - **Loading guard:** if `activePlayerIds === null`, `shouldRewriteUrl` returns `{ rewrite: false, nextState: null }` AND `computeResolved` returns `{ players: [], from: parsed.from }` (Pitfall E)
    - **`computeResolved`** logic per D-C1/D-C3/D-A3:
      - `activePlayerIds === null` → `{ players: [], from: parsed.from }`
      - `!parsed.hasPlayersKey` → `{ players: activePlayerIds, from: parsed.from }` (default — D-C1)
      - `parsed.hasPlayersKey && parsed.players.length === 0` → `{ players: [], from: parsed.from }` (explicit empty — D-C2/D-C3)
      - `parsed.hasPlayersKey && parsed.players.length > 0` → intersect with active; if intersection empty → fallback to active (D-A3 step 4); else use intersection (sorted)
    - **`shouldRewriteUrl`** logic per D-A3 step 3:
      - `activePlayerIds === null` → no rewrite
      - `!parsed.hasPlayersKey` → no rewrite (URL is already in canonical default form)
      - URL `players` matches the post-intersection canonical sorted list → no rewrite (idempotent)
      - URL `players` differs:
        - if intersection non-empty → rewrite to canonical sorted intersection
        - if intersection empty → rewrite to drop the players key (returns `{ players: [], from: parsed.from }` with `explicitEmptyPlayers: false` so the key is omitted)

    Run `npx vitest run src/test/hooks/useRankingFilters.test.ts` — every test in describes A–H must be GREEN. Run again immediately to assert determinism (no flakes).

    Implements RANK-03 (default to active), RANK-06 (URL persistence + invalid-id filtering), and respects every CONTEXT decision in Área A and Área C.
  </action>
  <verify>
    <automated>cd frontend &amp;&amp; npx vitest run src/test/hooks/useRankingFilters.test.ts --reporter=basic 2>&amp;1 | tail -40</automated>
  </verify>
  <acceptance_criteria>
    - File `frontend/src/hooks/useRankingFilters.ts` exists; `grep -c "^export function useRankingFilters" frontend/src/hooks/useRankingFilters.ts` == 1
    - `! grep "new Date" frontend/src/hooks/useRankingFilters.ts` (zero `new Date(` occurrences — Pitfall F)
    - `grep -c "replace: true" frontend/src/hooks/useRankingFilters.ts` >= 3 (every setter writes with replace mode — D-A6)
    - `grep -c "explicitEmptyPlayers" frontend/src/hooks/useRankingFilters.ts` >= 1 (D-C2 path exists)
    - File `frontend/src/test/hooks/useRankingFilters.test.ts` exists; `grep -c "^  it(" frontend/src/test/hooks/useRankingFilters.test.ts` >= 8 (one per describe A–H minimum)
    - `npx vitest run src/test/hooks/useRankingFilters.test.ts` exits 0 with all tests green
    - Re-run the same command immediately — still green (determinism, no Pitfall B flake)
    - `awk '/^(export )?function /{flag=1; n=0; next} flag && /^}/{print n; flag=0} flag{n++}' frontend/src/hooks/useRankingFilters.ts` shows every function body ≤20 lines (CLAUDE.md §3 — public hook + 2 private helpers)
    - `npx tsc --noEmit` from `frontend/` exits 0
  </acceptance_criteria>
  <done>
    Hook ships with full RANK-03/RANK-06 coverage. Test suite green twice in a row. Zero `new Date(` in source. Public hook + 2 private helpers, all ≤20 LOC. Plan 04 + Plan 05 can import `useRankingFilters` against a stable contract.
  </done>
</task>

</tasks>

<verification>
- All 8+ hook tests green (twice in a row — determinism vs Pitfall B)
- `npx tsc --noEmit` from `frontend/` exits 0
- Full suite `npx vitest run` from `frontend/` still green
- Source file has zero `new Date(` calls
- Source file has `replace: true` on every setter
</verification>

<success_criteria>
- `useRankingFilters` exported with the exact `UseRankingFiltersResult` signature documented in the plan's `<interfaces>` block
- All D-A3 / D-C1 / D-C2 / D-C3 / D-C4 / D-A6 / D-A7 paths covered by tests
- Pitfall B (infinite rewrite) and Pitfall E (loading race) explicitly tested
- Plans 04–05 unblocked
</success_criteria>

<output>
After completion, create `.planning/phases/11-ranking-page-skeleton-filters-url-state/11-03-SUMMARY.md` documenting:
- Public hook signature and return shape (paste verbatim)
- Names of the two private helpers extracted (`computeResolved`, `shouldRewriteUrl`)
- Test count per describe block (A through H)
- Confirmation: zero `new Date(`, ≥3 `replace: true`, all functions ≤20 LOC
</output>
