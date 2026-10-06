---
phase: 11
plan: 02
type: execute
wave: 1
depends_on: [11-01]
files_modified:
  - frontend/src/types/index.ts
  - frontend/src/api/elo.ts
  - frontend/src/utils/rankingFilters.ts
  - frontend/src/test/unit/rankingFilters.test.ts
autonomous: true
requirements: [RANK-04, RANK-06]
must_haves:
  truths:
    - "Frontend has typed contracts EloHistoryPointDTO and PlayerEloHistoryDTO mirroring Phase 8 backend exactly"
    - "Frontend api/elo.ts exports getEloHistory(): Promise<PlayerEloHistoryDTO[]> calling api.get('/elo/history') with NO second argument"
    - "Pure functions parseRankingParams + serializeRankingParams + applyRankingFilters live in src/utils/rankingFilters.ts and are TZ-immune (string-compare only)"
    - "URL params round-trip: parsed YYYY-MM-DD string === serialized YYYY-MM-DD string in TZ America/Argentina/Buenos_Aires (SC#5)"
    - "Unknown player_id values can be filtered against an active list using a pure function (groundwork for SC#4 in Plan 03)"
  artifacts:
    - path: "frontend/src/types/index.ts"
      provides: "EloHistoryPointDTO + PlayerEloHistoryDTO interfaces appended after PlayerEloSummaryDTO"
      contains: "interface EloHistoryPointDTO"
    - path: "frontend/src/api/elo.ts"
      provides: "getEloHistory() second export, single-arg api.get call"
      exports: ["getEloSummary", "getEloHistory"]
    - path: "frontend/src/utils/rankingFilters.ts"
      provides: "parseRankingParams, serializeRankingParams, applyRankingFilters — three pure functions, no React, no DOM"
      exports: ["parseRankingParams", "serializeRankingParams", "applyRankingFilters", "RankingFilterState", "RankingParseResult"]
    - path: "frontend/src/test/unit/rankingFilters.test.ts"
      provides: "Vitest unit tests covering round-trip, encoding stability, ordering determinism, TZ-pinned date round-trip (SC#5)"
      contains: "describe('rankingFilters"
  key_links:
    - from: "frontend/src/api/elo.ts"
      to: "frontend/src/types/index.ts"
      via: "import type { PlayerEloHistoryDTO }"
      pattern: "import type.*PlayerEloHistoryDTO"
    - from: "frontend/src/test/unit/rankingFilters.test.ts"
      to: "frontend/src/utils/rankingFilters.ts"
      via: "import { parseRankingParams, serializeRankingParams, applyRankingFilters } from '@/utils/rankingFilters'"
      pattern: "from '@/utils/rankingFilters'"
    - from: "SC#5 round-trip test"
      to: "process.env.TZ pin in setup.ts (Plan 01)"
      via: "vitest setupFiles in vite.config.ts"
      pattern: "process.env.TZ.*Buenos_Aires"
---

<objective>
Land the typed contracts, the API wrapper, and the pure-fn filter helpers — the three independent foundation pieces that Plans 03–05 consume. All three are small, testable, and have no React/DOM dependencies (utils + types + a 2-line API wrapper). The unit test file co-located here exercises SC#5 (TZ-safe `YYYY-MM-DD` round-trip) directly against the pure functions.

Cohesion rationale: types + api + utils + their unit test form a single semantic unit (the data layer for Phase 11). Splitting would force three separate plans of 1–2 tiny tasks each, all touching independent files. Combining keeps the wave footprint at 4 files / 1 plan and stays under 30% context.

Closes the data-layer prerequisites for RANK-04 (date filter — string comparison logic in `applyRankingFilters`) and RANK-06 (URL persistence — `parseRankingParams`/`serializeRankingParams`). Hook + UI consumption lands in Plans 03–05.

Purpose: Establish the contract + pure-logic substrate so Plans 03–05 build against locked exports rather than scavenger-hunting the codebase.

Output: 4 files (1 modified, 3 new), all under unit-test green.
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
@frontend/src/types/index.ts
@frontend/src/api/elo.ts
@frontend/src/api/client.ts
@frontend/src/utils/formatDate.ts
@frontend/src/utils/validation.ts
@frontend/src/test/unit/validation.test.ts

<interfaces>
<!-- Locked contracts the executor must produce verbatim. -->

`api.get<T>` signature (RESEARCH §"Critical Correction" — VERIFIED at `src/api/client.ts:37`):
```typescript
get: <T>(path: string) => request<T>(path)
```
Single argument only. Do NOT call `api.get('/elo/history', { from, player_ids })` — that signature does not exist. Phase 11 D-A4 locks no params anyway.

Existing `api/elo.ts` content (Phase 9, full file):
```typescript
import { api } from './client'
import type { PlayerEloSummaryDTO } from '@/types'

export function getEloSummary(playerId: string): Promise<PlayerEloSummaryDTO> {
  return api.get<PlayerEloSummaryDTO>(`/players/${playerId}/elo-summary`)
}
```

Existing ELO DTO block in `frontend/src/types/index.ts` (lines ~215-235 — see PATTERNS.md):
```typescript
// ---- ELO DTOs ----

export interface EloChangeDTO { ... }
export interface EloRankDTO { ... }
export interface PlayerEloSummaryDTO { ... }
```

Phase 8 backend DTO (locked by `08-01-PLAN.md`, mirrored exactly per RESEARCH lines 553-578):
```typescript
EloHistoryPointDTO {
  recorded_at: string  // YYYY-MM-DD
  game_id: string
  elo_after: number
  delta: number
}
PlayerEloHistoryDTO {
  player_id: string
  player_name: string
  points: EloHistoryPointDTO[]
}
```

Pure-fn signatures Plan 03 (hook) and Plan 05 (page) WILL import from `src/utils/rankingFilters.ts`:
```typescript
export interface RankingFilterState {
  players: string[]
  from: string | null
}

export interface RankingParseResult extends RankingFilterState {
  hasPlayersKey: boolean   // distinguishes ?players= from key absence (D-C3)
}

export function parseRankingParams(search: URLSearchParams): RankingParseResult
export function serializeRankingParams(state: RankingFilterState, opts?: { explicitEmptyPlayers?: boolean }): URLSearchParams
export function applyRankingFilters(
  dataset: PlayerEloHistoryDTO[],
  selectedPlayerIds: string[],
  fromDate: string | null,
): PlayerEloHistoryDTO[]
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add EloHistoryPointDTO + PlayerEloHistoryDTO to types/index.ts</name>
  <files>frontend/src/types/index.ts</files>
  <read_first>
    - frontend/src/types/index.ts (find existing `// ---- ELO DTOs ----` block)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-RESEARCH.md (§"Code Examples — Frontend types" lines 549-578)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md (§`src/types/index.ts` (MOD — add 2 DTOs) — lines 699-743)
    - .planning/phases/08-backend-get-elo-history-endpoint/08-01-PLAN.md (backend DTO source-of-truth)
  </read_first>
  <behavior>
    - Test 1: `import type { EloHistoryPointDTO, PlayerEloHistoryDTO } from '@/types'` resolves (compile-time) — verified by `npx tsc --noEmit`
    - Test 2: `EloHistoryPointDTO` has exactly 4 fields: `recorded_at: string`, `game_id: string`, `elo_after: number`, `delta: number`
    - Test 3: `PlayerEloHistoryDTO` has exactly 3 fields: `player_id: string`, `player_name: string`, `points: EloHistoryPointDTO[]`
    - Test 4: existing exports (`EloChangeDTO`, `EloRankDTO`, `PlayerEloSummaryDTO`) are unaffected
  </behavior>
  <action>
    Append two interfaces inside the existing `// ---- ELO DTOs ----` block in `frontend/src/types/index.ts`, immediately after `PlayerEloSummaryDTO` (around line 235 — locate by grep).

    Exact text to insert:

    ```typescript

    /**
     * One point in a player's ELO evolution.
     * IMPORTANT: chart Y-axis = elo_after (the rating after this game).
     * Use `delta` only for end-of-game "+12 / -8" labels. Never for chart lines.
     *
     * Mirrors backend EloHistoryPointDTO (backend/schemas/elo.py).
     */
    export interface EloHistoryPointDTO {
      recorded_at: string  // YYYY-MM-DD opaque string — DO NOT wrap in new Date()
      game_id: string
      elo_after: number
      delta: number
    }

    /**
     * Full ELO history for one player. Mirrors backend PlayerEloHistoryDTO.
     */
    export interface PlayerEloHistoryDTO {
      player_id: string
      player_name: string
      points: EloHistoryPointDTO[]
    }
    ```

    Do NOT alter the surrounding file. Do NOT introduce any other DTOs (RANK-02/05 stay in Phase 12).

    Mirror Phase 8 schema exactly (CONTEXT D-13 of Phase 9 was: drift = bug). If Plan 01 Task 2 surfaced any field-name drift, escalate before editing — do not "adapt" the frontend.

    Implements per RANK-06 data contract groundwork.
  </action>
  <verify>
    <automated>cd frontend &amp;&amp; grep -E "^export interface EloHistoryPointDTO" src/types/index.ts &amp;&amp; grep -E "^export interface PlayerEloHistoryDTO" src/types/index.ts &amp;&amp; npx tsc --noEmit 2>&amp;1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "^export interface EloHistoryPointDTO" frontend/src/types/index.ts` == 1
    - `grep -c "^export interface PlayerEloHistoryDTO" frontend/src/types/index.ts` == 1
    - `grep -A1 "^export interface EloHistoryPointDTO" frontend/src/types/index.ts | grep "recorded_at: string"` matches
    - `npx tsc --noEmit` (run from `frontend/`) returns exit code 0 with no new errors
    - Existing exports `EloChangeDTO`, `EloRankDTO`, `PlayerEloSummaryDTO` still grep-present (regression guard)
  </acceptance_criteria>
  <done>2 new interfaces compile, no tsc errors, existing DTOs untouched.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add getEloHistory() to api/elo.ts</name>
  <files>frontend/src/api/elo.ts</files>
  <read_first>
    - frontend/src/api/elo.ts (currently 1 export — getEloSummary)
    - frontend/src/api/client.ts (lines 30-45 — confirm api.get takes ONE arg)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-RESEARCH.md (§"Critical Correction: api.get signature" lines 142-156, §"Code Examples — getEloHistory()" lines 525-547)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md (§`src/api/elo.ts` (MOD) — lines 668-696)
  </read_first>
  <behavior>
    - Test 1: `getEloHistory()` is exported and callable with zero arguments
    - Test 2: It returns a `Promise<PlayerEloHistoryDTO[]>` (TS type verified by `tsc --noEmit`)
    - Test 3: Internally calls `api.get<PlayerEloHistoryDTO[]>('/elo/history')` — single argument, NO `?from=...&player_ids=...` query string (D-A4)
    - Test 4: Existing `getEloSummary` export is unchanged
  </behavior>
  <action>
    Edit `frontend/src/api/elo.ts`. Two changes only:

    1. Extend the `import type` line so it includes `PlayerEloHistoryDTO`:
       ```typescript
       import type { PlayerEloSummaryDTO, PlayerEloHistoryDTO } from '@/types'
       ```

    2. Append at end-of-file (after the closing `}` of `getEloSummary`):
       ```typescript

       /**
        * Fetch the full ELO history for all active players. No filter params:
        * Phase 11 D-A4 locks 100% client-side filtering. Backend `from` and
        * `player_ids` query params remain available but are not consumed.
        *
        * No caching. No retries. Per CONTEXT D-19 (load-bearing for cascade
        * correctness): a fresh fetch on every page mount.
        */
       export function getEloHistory(): Promise<PlayerEloHistoryDTO[]> {
         return api.get<PlayerEloHistoryDTO[]>('/elo/history')
       }
       ```

    CRITICAL: do NOT pass a second argument to `api.get`. RESEARCH §Critical Correction (lines 142-156) — the signature is `api.get<T>(path: string)`, single arg.

    Do NOT introduce a `useEloHistory` hook (D-B2 forbids; idiom is inline `useEffect` per Plan 04 page).
    Do NOT add manual query-string construction (Phase 11 calls with no params).

    Implements per RANK-04 + RANK-06 (the wrapper is the single touchpoint between front-end and the dataset that filters operate on).
  </action>
  <verify>
    <automated>cd frontend &amp;&amp; grep -E "^export function getEloHistory" src/api/elo.ts &amp;&amp; ! grep -E "api\.get&lt;[^&gt;]+&gt;\([^)]+,[^)]+\)" src/api/elo.ts &amp;&amp; npx tsc --noEmit 2>&amp;1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "^export function getEloHistory" frontend/src/api/elo.ts` == 1
    - `grep "api.get<PlayerEloHistoryDTO\[\]>('/elo/history')" frontend/src/api/elo.ts` matches (single-arg form)
    - `grep -E "api\.get&lt;[^&gt;]+&gt;\([^)]+,[^)]+\)" frontend/src/api/elo.ts` matches NOTHING (no 2-arg call site introduced)
    - `grep -c "^export function getEloSummary" frontend/src/api/elo.ts` == 1 (regression guard)
    - `npx tsc --noEmit` returns exit code 0
  </acceptance_criteria>
  <done>2 exports, both single-arg, tsc green.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Write SC#5 round-trip test FIRST, then create rankingFilters.ts pure functions</name>
  <files>
    frontend/src/test/unit/rankingFilters.test.ts
    frontend/src/utils/rankingFilters.ts
  </files>
  <read_first>
    - frontend/src/utils/validation.ts (export style, function-size discipline ≤20 lines)
    - frontend/src/utils/formatDate.ts (string-only YYYY-MM-DD pattern; never `new Date()`)
    - frontend/src/test/unit/validation.test.ts (vitest unit-test idiom)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-RESEARCH.md (§"Pattern 3 — Pure parse/serialize" lines 322-365, §"Pitfall A — TZ pin" lines 411-462, §"Pitfall D — URLSearchParams ordering" lines 496-508)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md (§`src/utils/rankingFilters.ts` lines 37-65 + §`src/test/unit/rankingFilters.test.ts` lines 67-113)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md (D-A2, D-A7, D-C1, D-C2, D-C3)
  </read_first>
  <behavior>
    Test cases (write all in RED state first, then implement until GREEN):

    Module: `parseRankingParams`
    - Empty `URLSearchParams()` → `{ players: [], from: null, hasPlayersKey: false }` (D-C1 / D-C3 default)
    - `?players=` (empty value, key present) → `{ players: [], from: null, hasPlayersKey: true }` (D-C2 / D-C3 explicit empty)
    - `?players=p1,p2,p3` → `{ players: ['p1','p2','p3'], from: null, hasPlayersKey: true }`
    - `?from=2026-01-01` → `{ players: [], from: '2026-01-01', hasPlayersKey: false }`
    - `?from=invalid-format` → `{ ..., from: null, ... }` (regex `^\d{4}-\d{2}-\d{2}$` rejects non-conforming)
    - `?players=p1,,p2` → `{ players: ['p1','p2'], ... }` (filter Boolean drops empty segments)

    Module: `serializeRankingParams`
    - `{ players: [], from: null }` → `''` (no params, URL clean — D-C1)
    - `{ players: [], from: null }, { explicitEmptyPlayers: true }` → `'players='` (D-C2)
    - `{ players: ['b','a'], from: null }` → `'players=a%2Cb'` (sort by string compare — D-A7; comma encodes as %2C — RESEARCH Pitfall D)
    - `{ players: ['p1'], from: '2026-01-01' }` → `'players=p1&from=2026-01-01'` (deterministic key order: players first, then from — RESEARCH Pitfall D)

    Module: `applyRankingFilters` (sync filter pipeline used by Plan 05 page)
    - Empty selectedPlayerIds → `[]` (no players → no series)
    - fromDate `null` → returns all points for selected players unchanged
    - fromDate `'2026-02-01'` → filters each player's `points[]` so only `p.recorded_at >= '2026-02-01'` survives (lexicographic compare, NEVER `new Date()` — RESEARCH Pattern 4 / Pitfall 4)
    - Players not in selectedPlayerIds are dropped from the output array

    SC#5 test (THE LOAD-BEARING ONE): assert `process.env.TZ === 'America/Argentina/Buenos_Aires'` AND that `parseRankingParams(new URLSearchParams('?from=2026-01-01')).from === '2026-01-01'` AND that round-tripping back via `serializeRankingParams` yields literally `'from=2026-01-01'`.

    Encoding stability test: `serializeRankingParams({ players: ['a', 'b'], from: '2026-01-01' }).toString()` MUST be exactly `'players=a%2Cb&from=2026-01-01'` (Pitfall D — players key set FIRST, then from).
  </behavior>
  <action>
    **STEP A — RED:** Create `frontend/src/test/unit/rankingFilters.test.ts` first. Use the test idiom from `validation.test.ts` (PATTERNS.md §`src/test/unit/rankingFilters.test.ts`). Do NOT yet create the source file. Run `npx vitest run src/test/unit/rankingFilters.test.ts` — every test MUST fail with "module not found" or assertion failures.

    The test file must import from `'@/utils/rankingFilters'` and must include exactly four `describe` blocks:
    1. `describe('parseRankingParams', ...)` — covers all 6 parse cases above
    2. `describe('serializeRankingParams', ...)` — covers all 4 serialize cases above (assert literal `.toString()` strings)
    3. `describe('applyRankingFilters', ...)` — covers all 4 filter cases above
    4. `describe('rankingFilters — TZ-safe YYYY-MM-DD round-trip (SC#5)', ...)` — the dedicated SC#5 test (RESEARCH lines 442-462). The first assertion in the SC#5 test must be `expect(process.env.TZ).toBe('America/Argentina/Buenos_Aires')` — defensive guard that Plan 01 Task 1 actually shipped.

    Use local fixture constants for `applyRankingFilters` tests; mirror `validation.test.ts` style (no shared module-level mutable state).

    **STEP B — GREEN:** Create `frontend/src/utils/rankingFilters.ts`. Match the sketch in RESEARCH lines 327-365 with these final-shape rules:

    ```typescript
    import type { PlayerEloHistoryDTO } from '@/types'

    const PLAYERS_KEY = 'players'
    const FROM_KEY = 'from'
    const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

    export interface RankingFilterState {
      players: string[]
      from: string | null
    }

    export interface RankingParseResult extends RankingFilterState {
      hasPlayersKey: boolean
    }

    export function parseRankingParams(search: URLSearchParams): RankingParseResult { /* ≤15 LOC */ }

    export function serializeRankingParams(
      state: RankingFilterState,
      opts?: { explicitEmptyPlayers?: boolean },
    ): URLSearchParams { /* ≤15 LOC, set PLAYERS_KEY before FROM_KEY */ }

    export function applyRankingFilters(
      dataset: PlayerEloHistoryDTO[],
      selectedPlayerIds: string[],
      fromDate: string | null,
    ): PlayerEloHistoryDTO[] { /* ≤15 LOC, lexicographic date compare only */ }
    ```

    CRITICAL rules (CLAUDE.md §3 + RESEARCH):
    - Each function ≤20 LOC body. If a function would exceed, extract a private helper at module top (no React, no DOM imports).
    - **Never `new Date()`** anywhere in this file. Comparison is `pointDate >= fromDate` on raw `YYYY-MM-DD` strings (lexicographic == chronological for ISO 8601).
    - `serializeRankingParams` MUST set `players` key BEFORE `from` key — fixed order, deterministic URL string (Pitfall D).
    - `parseRankingParams` MUST validate `from` against `ISO_DATE_RE`. Invalid format → return `from: null` (degrade silently; the URL might be hand-edited).
    - Player CSV serialization: `[...state.players].sort()` (default string compare — D-A7), then `.join(',')`.
    - `applyRankingFilters`: filter dataset to `selectedPlayerIds.includes(p.player_id)`, then map each player's `points` through `points.filter(pt => fromDate === null || pt.recorded_at >= fromDate)`. Do NOT mutate input arrays.

    Run `npx vitest run src/test/unit/rankingFilters.test.ts` — all tests MUST pass GREEN.

    Implements RANK-04 (date filter logic, lexicographic compare) and RANK-06 (URL parse/serialize, hasPlayersKey flag for D-C3).
  </action>
  <verify>
    <automated>cd frontend &amp;&amp; npx vitest run src/test/unit/rankingFilters.test.ts --reporter=basic 2>&amp;1 | tail -30</automated>
  </verify>
  <acceptance_criteria>
    - File `frontend/src/utils/rankingFilters.ts` exists; `grep -c "^export function" frontend/src/utils/rankingFilters.ts` == 3
    - File `frontend/src/test/unit/rankingFilters.test.ts` exists; `grep -c "describe(" frontend/src/test/unit/rankingFilters.test.ts` >= 4
    - SC#5 test text grep matches: `grep -c "America/Argentina/Buenos_Aires" frontend/src/test/unit/rankingFilters.test.ts` >= 1
    - `! grep "new Date" frontend/src/utils/rankingFilters.ts` (zero `new Date(` occurrences in source)
    - `npx vitest run src/test/unit/rankingFilters.test.ts` exits 0 with all tests green
    - `awk '/^export function /{flag=1; n=0; next} flag && /^}/{print n; flag=0} flag{n++}' frontend/src/utils/rankingFilters.ts` shows every function body ≤20 lines (CLAUDE.md §3)
    - Encoding test asserts the literal string `'players=a%2Cb&from=2026-01-01'` (Pitfall D regression guard)
  </acceptance_criteria>
  <done>
    All 4 `describe` blocks pass. Source file exports exactly the 3 named functions plus 2 interfaces. No `new Date(` anywhere. SC#5 closed. RANK-04 + RANK-06 logic-layer complete.
  </done>
</task>

</tasks>

<verification>
- `npx vitest run src/test/unit/rankingFilters.test.ts` green (all describes including SC#5)
- `npx tsc --noEmit` from `frontend/` exits 0
- Full suite `npx vitest run` from `frontend/` still green (no regressions)
- Source file has zero `new Date(` calls (TZ-immune by construction)
- `getEloHistory` is single-arg `api.get` call (Critical Correction respected)
</verification>

<success_criteria>
- 2 new DTOs compile and export from `@/types`
- `getEloHistory()` exported from `@/api/elo`
- 3 pure functions exported from `@/utils/rankingFilters`
- SC#5 round-trip test passes in TZ Buenos Aires
- Plans 03–05 can build against these locked exports without further investigation
</success_criteria>

<output>
After completion, create `.planning/phases/11-ranking-page-skeleton-filters-url-state/11-02-SUMMARY.md` documenting:
- DTO field list (paste exact interface text)
- `getEloHistory` signature (paste the function)
- Public exports of `rankingFilters.ts` (3 functions + 2 interfaces)
- Test count green per describe block
- Confirmation of zero `new Date(` calls in source
</output>
