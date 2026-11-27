# Phase 11: Ranking page skeleton + filters + URL state — Research

**Researched:** 2026-04-30
**Domain:** React 18 + react-router-dom v6 + Vite + Vitest + CSS Modules SPA — URL-state filters for a client-side-filtered chart page
**Confidence:** HIGH

## Summary

Phase 11 lands the `/ranking` route shell. It is an integration phase, not a green-field design. Every control has a precedent in the codebase (route in `App.tsx`, tile in Home `navItems`, MultiSelect, native `<input type="date">`, `Promise.all` + inline `useEffect` fetch in `PlayerProfile.tsx`, design tokens in `index.css`), and CONTEXT.md has already locked the architecture: 100% client-side filtering after a single fetch on mount, URL as source of truth via `useSearchParams`, `setSearchParams(..., { replace: true })` to avoid history pollution, and a hard distinction between "URL clean = default to all active" and "?players= explicit empty = empty state."

There are three load-bearing technical risks — none of them about visual design:

1. **TZ-pinned vitest test for SC#5**: The project's vitest config does NOT pin TZ. Setting `process.env.TZ` in `setupFiles` is the common idiom and works for `pool: 'forks'` (the default for vitest 3 with jsdom), but is unreliable on `pool: 'threads'` because `Intl.DateTimeFormat` is locked at thread creation. The mitigation is two-fold: (a) keep the project's date handling string-only (no `new Date()` in the filter pipeline — Pitfall 4 from milestone research), so most tests are TZ-immune; (b) pin `process.env.TZ = 'America/Argentina/Buenos_Aires'` in `src/test/setup.ts` before any test runs, AND add a CLI override `TZ=America/Argentina/Buenos_Aires vitest run` script for the SC#5 test to be belt-and-suspenders correct. **Because Phase 11's date handling is opaque-string-only end-to-end (D-A2, D-A4, D-A7), the actual TZ exposure is small** — the test verifies that no future regression sneaks in a `new Date()` wrapper.

2. **`URLSearchParams` "key absent" vs "key empty" distinction (D-C3)**: Confirmed by web standard. `URLSearchParams.has('players')` returns `true` for `?players=` and `false` for `/ranking` (no params). Round-trip via `setSearchParams` is stable: serializing an object that includes `players: ''` produces `?players=` literally. Encoding the `hasPlayersKey` flag at the parse boundary is correct and safe.

3. **`api.get<T>` does NOT take a params arg**: The CONTEXT mention "`api.get<T>(path, params?)` ya tipado con genéricos" is **wrong**. The actual signature in `src/api/client.ts:37` is `get: <T>(path: string) => request<T>(path)` — no second argument. Phase 9's `getEloSummary` likewise just passes a path. `getEloHistory()` in Phase 11 takes no params (D-A4 says "single fetch on mount, no params consumed") so this isn't a blocker, but the planner must NOT prescribe `api.get('/elo/history', { from, player_ids })` — that signature does not exist.

**Primary recommendation:** Treat Phase 11 as five small additions on top of an already-laid foundation. The novelty is concentrated in `src/lib/rankingFilters.ts` (pure functions, easily testable) and `useRankingFilters` (hook with `useSearchParams` + intersection). Everything else is wiring.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Área A — Arquitectura de filtros + URL sync:**
- **D-A1:** Single component `<RankingFilters>` in `src/components/RankingFilters/` encapsulating MultiSelect + date input + "Limpiar filtros" button. Props: `{ players, fromDate, activePlayersOptions, onPlayersChange, onFromDateChange, onClear }`.
- **D-A2:** Lib `src/lib/rankingFilters.ts` with two pure functions: `parseRankingParams(search: URLSearchParams)` and `serializeRankingParams(state)`. Testable without React/DOM.
- **D-A3:** Hook `useRankingFilters(activePlayerIds: string[])` in `src/hooks/useRankingFilters.ts`. Uses `useSearchParams` as source of truth; intersects URL `players` with `activePlayerIds`; rewrites URL silently on drop; falls back to default in-memory when intersection empty (no URL write); exposes `{ players, fromDate, setPlayers, setFromDate, clearAll }`. Setters use `setSearchParams(..., { replace: true })`.
- **D-A4:** **100% client-side filtering.** Single fetch of `getEloHistory()` on mount, no params. MultiSelect + "Desde" filter the in-memory dataset. Zero refetch on filter change. Backend params (`from`/`player_ids`) remain available but unused this milestone.
- **D-A5:** **URL = source of truth.** Mount reads URL → hydrates state → renders filters and dataset. Filter change writes URL first; state re-derives next render.
- **D-A6:** `setSearchParams(..., { replace: true })` on every filter change. No history entries from toggles.
- **D-A7:** Players serialized as `?players=id1,id2,id3` with **stable string-compare sort by player_id** before joining.

**Área B — Scope visual + fetch:**
- **D-B1:** Fetch ya in Phase 11. `Ranking.tsx` invokes `getEloHistory()` (no params) in `useEffect` on mount.
- **D-B2:** Inline `useEffect` fetch with **separate try/catch** (PlayerProfile post-Phase 9 D-14 idiom). No `useEloHistory` hook. Catch dedicated: failure shows error block with "Reintentar" (counter-in-deps refetch trick). **No React Query / SWR / cache** — Pitfall 1 load-bearing.
- **D-B3:** Parallel fetch in `Promise.all` analogous to PlayerProfile. `usePlayers` manages its own fetch; `Ranking.tsx`'s `Promise.all` only needs `getEloHistory()`. Coordinate before computing intersections.
- **D-B4:** **`usePlayers` existing hook** is the source of active players for MultiSelect. Filter `is_active === true` in the page. Do NOT derive from `/elo/history` (active players with 0 games would be invisible).
- **D-B5:** Below filters: chart skeleton — fixed-height box (e.g., `min-height: 280px`), placeholder visual (gray lines, optional `pulse`). Lives in `Ranking.module.css`. **No generic `Skeleton` component** (YAGNI).
- **D-B6:** Skeleton shown when `filteredPoints.length >= 1`. Empty filtered → empty state (D-C5). Loading → existing `Spinner`. Error → error block with "Reintentar".

**Área C — Defaults, "Limpiar filtros" y empty state:**
- **D-C1:** **URL clean when default.** `/ranking` with no params does NOT trigger a URL rewrite. Hook computes default in-memory (`players = all active`, `fromDate = null`).
- **D-C2:** **0 players allowed.** Deselecting all → `?players=` (empty key) to distinguish from "URL clean." Skeleton replaced by empty state ("Selecciona al menos un jugador") with "Limpiar filtros" CTA.
- **D-C3:** **Distinction URL clean vs `?players=` empty:**
  - `/ranking` → `parseRankingParams` returns `{ players: [], from: null, hasPlayersKey: false }` → default in-memory (all active).
  - `/ranking?players=` → `{ players: [], from: null, hasPlayersKey: true }` → respect explicit empty → empty state.
- **D-C4:** **"Limpiar filtros" = total reset.** Clears both params, URL becomes `/ranking` (clean, returns to default in-memory).
- **D-C5:** **Empty state implemented in Phase 11** (fetch+filter happens here). Detection in page: if `filteredPoints.length === 0` OR `selectedPlayers.length === 0` → empty state; else → skeleton. Reuses existing `--color-text-muted` + spacing tokens.

**Área D — Tile de Ranking en Home:**
- **D-D1:** Position **after "Logros"** in `navItems`. Final order: Jugadores → Cargar Partida → Partidas → Records → Logros → Ranking.
- **D-D2:** Tile config: `{ to: '/ranking', icon: '📈', title: 'Ranking', description: 'Evolución de ELO', disabled: false }`.
- **D-D3:** Enabled in Phase 11. SC#1 requires the tile to navigate to `/ranking`.

### Claude's Discretion

- Visual style of the chart skeleton (gray line color, optional `pulse` animation vs. static). Mobile-first, no inline styling.
- Exact internal naming of hook functions (`useRankingFilters` vs. `useUrlRankingFilters`) and final signatures.
- Whether `<RankingFilters>` exposes one combined `onChange({ players, from })` or separate handlers (whichever keeps `Ranking.tsx` cleanest).
- Internal HTML structure of the page header (`<h1>`, `<header>`, etc.) provided basic a11y holds.
- Whether the "Reintentar" button lives inline in the page or as an extracted helper.
- Specific tests to write: minimum coverage of `parseRankingParams`/`serializeRankingParams` round-trip (with TZ-pinned Buenos Aires test for SC#5), unknown-id drop, default-fallback on empty intersection, "Limpiar filtros" total reset.
- Whether the Home tile change is a 1-line Edit or warrants extracting `navItems` to a typed constant.

### Deferred Ideas (OUT OF SCOPE)

- Refactor cleanup of unused backend params (`from`, `player_ids` of `/elo/history`) — defer to v1.2 phase if no consumer emerges.
- Generic `Skeleton` component — YAGNI.
- `useEloHistory` hook — descartado (D-B2 idiom).
- Time-range presets (Todo / 6m / 30d) — RANK-FUT-01, v1.2.
- a11y data-table fallback — RANK-FUT-02, v1.2.
- Click-on-line highlight / focus mode — RANK-FUT-03, v1.2.
- X-axis toggle (date vs. game-index) — RANK-FUT-04, v1.2.
- Filter-change debounce — discarded (D-A6 immediate with `replace`).
- `?players=` with repeated key (`getAll`) — discarded (D-A7).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RANK-01 | User accesses "Ranking" section from main navigation (`/ranking`) | App.tsx route + Home tile patterns confirmed via direct read of `App.tsx` and `Home.tsx`; `<ProtectedRoute>` exists at `src/components/ProtectedRoute/ProtectedRoute.tsx` |
| RANK-03 | Multi-player selector with default = all active players | `MultiSelect` component verified at `src/components/MultiSelect/MultiSelect.tsx`; `usePlayers({ activeOnly: true })` already supported via `is_active` filter on `PlayerResponseDTO` (`src/types/index.ts` line 7) |
| RANK-04 | Date "Desde" filter via native `<input type="date">` | `<input type="date">` is precedent in `GameForm` and `GamesList`; safe `event.target.value` returns `'YYYY-MM-DD'` or `''` — no Date object needed |
| RANK-06 | Filter state persisted in URL search params; invalid IDs filtered against active players | `useSearchParams` is part of `react-router-dom@^6.28.0` (verified in `package.json`); `URLSearchParams.has(key)` distinguishes empty value from absent key (web standard) |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route registration (`/ranking`) | Frontend Server (App.tsx) | — | All routes are wired in `App.tsx` `<Routes>` block |
| Auth gating | Frontend Server (`<ProtectedRoute>`) | — | All authenticated routes wrap their element in `<ProtectedRoute>` |
| URL state read/write | Browser / Client (`useSearchParams`) | — | URL is per-tab browser state; react-router-dom owns the abstraction |
| Filter logic (intersection, drop, default) | Browser / Client (`useRankingFilters`) | — | D-A4 locks 100% client-side; no backend filtering this phase |
| ELO history fetch | API / Backend (Phase 8 endpoint) | Browser / Client (single GET on mount) | Backend owns the data; frontend reads once and caches in state for the page lifetime |
| Player list fetch | API / Backend | Browser / Client (`usePlayers`) | Existing hook owns the player domain |
| Filter persistence (across reload / share) | Browser URL | — | No backend persistence; URL is the only durable filter state |
| Empty-state detection | Browser / Client | — | Computed from filtered in-memory dataset, never from a backend response shape |

## Standard Stack

### Core (already in project — verified)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^18.3.1 | UI framework | [VERIFIED: package.json line 16] |
| react-router-dom | ^6.28.0 | Routing + `useSearchParams` | [VERIFIED: package.json line 17] — v6 has `useSearchParams` API used since 2022 |
| typescript | ^5.6.3 | Type safety | [VERIFIED: package.json line 28] |
| vitest | ^3.2.4 | Test runner | [VERIFIED: package.json line 30] |
| @testing-library/react | ^16.1.0 | Component test idiom | [VERIFIED: package.json line 23] — used by EloSummaryCard.test.tsx |
| jsdom | ^25.0.1 | Test DOM | [VERIFIED: package.json line 26] |
| vite | ^6.0.5 | Build tooling | [VERIFIED: package.json line 29] |

### Supporting (existing project assets)

| Asset | Path | Purpose |
|-------|------|---------|
| `MultiSelect` | `src/components/MultiSelect/MultiSelect.tsx` | Player picker — `{ label, options: { value, label }[], value: string[], onChange }` [VERIFIED via direct read] |
| `ProtectedRoute` | `src/components/ProtectedRoute/ProtectedRoute.tsx` | Auth wrapper |
| `Spinner` | `src/components/Spinner/Spinner.tsx` | Loading state |
| `usePlayers` | `src/hooks/usePlayers.ts` | Active player list — supports `{ activeOnly: true }` via `getPlayers(active?)` query string [VERIFIED] |
| `formatDate` / `tryFormatDate` | `src/utils/formatDate.ts` | TZ-safe `YYYY-MM-DD` handling — pattern is `isoDate.split('-').map(Number)`, no `new Date()` [VERIFIED] |
| `getEloSummary` | `src/api/elo.ts` | Existing in `elo.ts` from Phase 9; `getEloHistory()` adds as second export |
| `api.get<T>(path)` | `src/api/client.ts:37` | HTTP wrapper — **single argument only** [VERIFIED — see Critical Correction below] |
| Design tokens | `src/index.css` | `--color-text-muted`, `--color-error`, `--color-surface`, spacing/radius/font tokens |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `useEffect` fetch | React Query / SWR | Locked out by Pitfall 1 (cache stale after game-edit cascade). Existing project rule. |
| Custom `useEloHistory` hook | (the choice) | D-B2 explicitly forbids — single-page consumer, idiom matches PlayerProfile |
| URL `?players=alice,bob` (CSV) | `?players=alice&players=bob` (repeated keys) | D-A7 locks CSV; repeated-key would need `URLSearchParams.getAll`, less SC#3 literal match |
| `vi.setSystemTime` for TZ | `process.env.TZ` in setup | `vi.setSystemTime` only mocks `Date.now()` — does NOT change TZ semantics. `process.env.TZ` set before V8 starts is the only correct lever. See Pitfalls below. |
| Net-new dependency | (none) | Phase 11 adds **zero** new packages. Phase 12 will add `recharts`. |

**Installation:** No new packages required for Phase 11.

**Version verification:** All library versions read directly from `frontend/package.json` (commit-tracked).

## Critical Correction: `api.get` signature

CONTEXT line 184 says: *"`api.get<T>(path, params?)` ya tipado con genéricos; `getEloHistory()` lo invoca con `T = PlayerEloHistoryDTO[]`."*

**This is wrong.** The actual signature in `src/api/client.ts:37` is:

```typescript
get: <T>(path: string) => request<T>(path),
```

There is no `params` argument. Existing call sites confirm:
- `getPlayers(active?)` builds the query string manually: `const query = active == true ? \`?active=\${active}\` : ''`
- `getEloSummary(playerId)` passes only the path
- No call site passes a second argument to `api.get`

**Implication for the plan:** D-A4 already locks "single fetch with no params" so `getEloHistory()` is just `return api.get<PlayerEloHistoryDTO[]>('/elo/history')`. No issue for this phase. **The planner must not prescribe a 2-argument `api.get` call.** If a future phase needs query params, it builds the string by hand (existing convention) or extends `client.ts` first (out of scope).

[VERIFIED via direct read of `src/api/client.ts` and `src/api/players.ts` and `src/api/elo.ts`]

## Architecture Patterns

### System Architecture Diagram

```
                          ┌──────────────────────┐
                          │   /ranking URL       │
                          │ ?players=…&from=…    │  ← source of truth
                          └──────────┬───────────┘
                                     │ useSearchParams()
                                     ▼
            ┌────────────────────────────────────────┐
            │         useRankingFilters               │
            │  parseRankingParams(URLSearchParams)    │
            │  intersect(URL.players, activePlayers)  │
            │  → rewrite URL (silent) if drop         │
            │  → fallback to default if empty         │
            │  exposes setPlayers / setFromDate / clearAll │
            │  setters → serializeRankingParams       │
            │            → setSearchParams(..., { replace: true }) │
            └────┬────────────────────────────┬──────┘
                 │                            │
                 │                            │
                 ▼                            ▼
   ┌──────────────────────┐        ┌──────────────────────────┐
   │  <RankingFilters>     │        │   Ranking.tsx state       │
   │  - MultiSelect        │        │   { fullDataset,          │
   │  - <input type=date>  │        │     loading, error }      │
   │  - "Limpiar filtros"  │        │                            │
   └──────────────────────┘        └────────────┬─────────────┘
                                                │
                                                ▼
                              ┌────────────────────────────────┐
                              │   useEffect on mount           │
                              │   Promise.all([                │
                              │     getEloHistory()            │
                              │   ])                           │
                              │   → try/catch separate (D-B2)  │
                              └──────────────┬─────────────────┘
                                             │ GET /elo/history (Phase 8)
                                             ▼
                              ┌────────────────────────────────┐
                              │   Backend                       │
                              │   PlayerEloHistoryDTO[]        │
                              └────────────────────────────────┘

                    ──── client-side filter pipeline ────

   fullDataset (state)  +  selectedPlayers (URL)  +  fromDate (URL)
                                │
                                ▼
                  filterByPlayer(dataset, selected)
                                │
                                ▼
                  filterByFrom(filtered, from)   // string compare YYYY-MM-DD
                                │
                                ▼
                       filteredPoints
                                │
                ┌───────────────┴───────────────┐
                │                               │
       length === 0 || selected===0     length >= 1
                │                               │
                ▼                               ▼
         Empty state                    Chart skeleton
       (CTA: "Limpiar filtros")    (Phase 12 will replace this)
```

### Recommended File Layout

```
frontend/src/
├── api/
│   └── elo.ts                                      # MODIFIED: add getEloHistory()
├── components/
│   └── RankingFilters/                             # NEW
│       ├── RankingFilters.tsx
│       └── RankingFilters.module.css
├── hooks/
│   └── useRankingFilters.ts                        # NEW
├── lib/                                            # NEW directory (does not yet exist)
│   └── rankingFilters.ts                           # NEW (pure functions)
├── pages/
│   ├── Home/Home.tsx                               # MODIFIED: 1 navItems entry
│   └── Ranking/                                    # NEW
│       ├── Ranking.tsx
│       └── Ranking.module.css
├── types/
│   └── index.ts                                    # MODIFIED: add 2 DTOs
├── App.tsx                                         # MODIFIED: 1 <Route>
└── test/
    ├── setup.ts                                    # MODIFIED: pin process.env.TZ
    ├── unit/
    │   └── rankingFilters.test.ts                  # NEW (pure-fn tests, includes SC#5)
    ├── hooks/
    │   └── useRankingFilters.test.ts               # NEW (hook tests via renderHook + MemoryRouter)
    └── components/
        └── RankingFilters.test.tsx                 # NEW (component integration)
```

**Note:** `src/lib/` does not yet exist in the codebase (verified via `ls`). Creating it for `rankingFilters.ts` is the first new top-level directory in `src/` since the project's structure was set. This is consistent with STRUCTURE.md's "Where to Add New Code" — utilities can go to `src/utils/`, but a `lib/` for non-React, non-domain pure functions is a reasonable extension. **Alternative:** put the pure functions in `src/utils/rankingFilters.ts` to match existing convention (`gameCalculations.ts`, `validation.ts`, `formatDate.ts` all live in `utils/`). **Recommendation: use `src/utils/rankingFilters.ts`** to match existing convention rather than creating a new `lib/` directory. CONTEXT names `src/lib/` but does not lock the path — this is a Claude's Discretion area where matching the existing utility convention reduces cognitive overhead.

### Pattern 1: Inline `useEffect` + `Promise.all` + separated try/catch

**What:** Fetch on mount; coordinate parallel calls; isolate optional fetches behind their own catch so a failure of one doesn't fail the whole page.

**When to use:** Page-scoped data load with one or more concurrent fetches.

**Example (canonical, copied from `PlayerProfile.tsx:28-45`):**
```typescript
// Source: frontend/src/pages/PlayerProfile/PlayerProfile.tsx:28-45 (Phase 9 D-14)
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

**Phase 11 application:** `Ranking.tsx` follows the same shape but with one critical fetch (`getEloHistory()`). To support D-B2's "Reintentar" button:

```typescript
const [retryCount, setRetryCount] = useState(0)
useEffect(() => {
  setLoading(true); setError(null)
  getEloHistory()
    .then((data) => setDataset(data))
    .catch(() => setError('No se pudo cargar el ranking.'))
    .finally(() => setLoading(false))
}, [retryCount])  // bump to refetch
// "Reintentar" button → onClick={() => setRetryCount((c) => c + 1)}
```

### Pattern 2: URL-as-source-of-truth filter state

**What:** Filter state is read from `URLSearchParams` and written back via `setSearchParams`; React state is derived, not authoritative.

**When to use:** Shareable, reload-surviving views where the user is expected to copy the URL.

**Example:**
```typescript
// Source: react-router-dom v6 docs (https://reactrouter.com/api/hooks/useSearchParams)
const [searchParams, setSearchParams] = useSearchParams()
const { players, fromDate, hasPlayersKey } = parseRankingParams(searchParams)

// Setter — writes URL with replace mode (D-A6)
const setPlayers = useCallback((next: string[]) => {
  setSearchParams(serializeRankingParams({ players: next, from: fromDate }), { replace: true })
}, [fromDate, setSearchParams])
```

**[CITED: https://reactrouter.com/api/hooks/useSearchParams]** — `useSearchParams` returns a tuple; the second element accepts a `URLSearchParams` (or initializer-like value) and an optional `{ replace, state }` options object. `searchParams` is a stable reference safe to use as a `useEffect` dependency.

### Pattern 3: Pure parse/serialize, deterministic ordering

**What:** Two pure functions that exchange `URLSearchParams` ⇄ a state object, with stable ordering on the way out.

**When to use:** Whenever URL is the source of truth — keeps round-trip determinism so two equivalent states produce the same URL string (cacheable, comparable, testable).

**Example (sketch — implementer must finalize):**
```typescript
// src/utils/rankingFilters.ts (or src/lib/, per Claude's Discretion)

export interface RankingFilterState {
  players: string[]
  from: string | null
}

export interface RankingParseResult extends RankingFilterState {
  hasPlayersKey: boolean  // distinguishes ?players= from key absence (D-C3)
}

const PLAYERS_KEY = 'players'
const FROM_KEY = 'from'

export function parseRankingParams(search: URLSearchParams): RankingParseResult {
  const hasPlayersKey = search.has(PLAYERS_KEY)
  const playersRaw = search.get(PLAYERS_KEY) ?? ''
  const players = playersRaw === '' ? [] : playersRaw.split(',').filter(Boolean)
  const from = search.get(FROM_KEY)
  // Validate from format — opaque YYYY-MM-DD only (Pitfall 4)
  const fromValidated = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : null
  return { players, from: fromValidated, hasPlayersKey }
}

export function serializeRankingParams(state: RankingFilterState, opts?: { explicitEmptyPlayers?: boolean }): URLSearchParams {
  const out = new URLSearchParams()
  if (state.players.length > 0) {
    const sorted = [...state.players].sort()  // stable string compare (D-A7)
    out.set(PLAYERS_KEY, sorted.join(','))
  } else if (opts?.explicitEmptyPlayers) {
    out.set(PLAYERS_KEY, '')  // ?players= empty (D-C2)
  }
  // Else: omit the key entirely — URL clean (D-C1)
  if (state.from) out.set(FROM_KEY, state.from)
  return out
}
```

**Verification round-trip property:** for any URL produced by `serializeRankingParams`, calling `parseRankingParams` on its constructor-built `URLSearchParams` returns a state that, when re-serialized, produces the same string. The `hasPlayersKey` flag is the bit that lets the hook distinguish "user explicitly cleared all players" from "user is on the default view."

### Pattern 4: TZ-safe date string handling (Pitfall 4 reinforcement)

**What:** Treat `'YYYY-MM-DD'` as opaque string end-to-end. Never wrap in `new Date()` for comparison or filtering.

**Why:** `new Date('2026-01-01')` parses as UTC midnight; `.toISOString()` of that in UTC-3 yields `'2025-12-31T03:00:00.000Z'` — silently shifts day. Comparison via lexicographic string compare is correct and immune.

**Example:**
```typescript
// CORRECT — string compare on YYYY-MM-DD (lexicographic == chronological for ISO 8601)
const filtered = points.filter((p) => p.recorded_at >= fromDate)

// WRONG — never do this in the filter pipeline
const filtered = points.filter((p) => new Date(p.recorded_at) >= new Date(fromDate))
```

`<input type="date">.value` returns `''` or `'YYYY-MM-DD'` directly. Passes through unmodified to the URL and to the filter compare.

### Anti-Patterns to Avoid

- **Wrapping filter values in `new Date()`** → Pitfall 4. Lexicographic compare on `'YYYY-MM-DD'` is correct and TZ-immune.
- **Using array index for stable IDs in `MultiSelect`** → MultiSelect already keys by `value` (`player_id`); fine.
- **Storing `loading=true` and `error='msg'` simultaneously** → mutual exclusion. Pattern in PlayerProfile: `setLoading(true); setError(null)` at start of effect.
- **Caching dataset in `localStorage` or context** → Pitfall 1. Stay with on-mount-refetch.
- **Calling `setSearchParams` inside the hook's parse-and-derive render path** → infinite loop (Pitfall in Common Pitfalls). Only setters trigger writes.
- **Conditional `useSearchParams` calls** → React rules of hooks; always call at top of hook.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL parsing/serialization | Custom `?players=…` regex | `URLSearchParams` (native) | Edge cases: encoding, repeated keys, empty values, fragment handling all handled by spec |
| Multi-select toggle UI | New picker component | Existing `MultiSelect` | Already token-themed, 36px touch targets, `(value: string[], onChange)` signature is a drop-in fit |
| Date picker | Custom calendar widget | Native `<input type="date">` | Triggers OS picker on iOS/Android, zero bundle cost, value is already `'YYYY-MM-DD'` string |
| Auth gating | Custom redirect logic | Existing `<ProtectedRoute>` | Used by every authenticated route in `App.tsx` |
| Loading spinner | New visual | Existing `Spinner` | Already in use in PlayerProfile |
| Date string formatting / validation | New helper | `formatDate.ts` + `/^\d{4}-\d{2}-\d{2}$/` regex | Pattern locked; project rule: no `Date` object touches filter values |
| Stable hash for ordering | Custom hash | `String.prototype.localeCompare` or `<` (string compare) | D-A7 says "sort by player_id string compare" — `[...arr].sort()` does it |

**Key insight:** Phase 11 is well within the project's existing toolset. The single load-bearing piece of "library research" is verifying `URLSearchParams.has()` distinguishes empty-value from absent-key (it does — web standard).

## Common Pitfalls

### Pitfall A: TZ-pinned vitest test on `pool: 'threads'` is unreliable

**What goes wrong:** A test running under `pool: 'threads'` (vitest's default depending on environment) cannot have its TZ changed by `process.env.TZ` after thread creation — `Intl.DateTimeFormat` is locked. The test for SC#5 ("date round-trip in `America/Argentina/Buenos_Aires`") may pass on local dev (likely in BA TZ already) but fail on CI (UTC) or vice versa.

**Why it happens:** `process.env.TZ` is read by V8 at process / thread start. `pool: 'forks'` forks a new process per test file — `process.env.TZ` set in `setupFiles` reaches the worker. `pool: 'threads'` shares an Intl cache that's frozen.

**How to avoid:**
1. **Make the production code TZ-immune (primary defense):** D-A4 + D-A7 + Pattern 4 above lock string-only handling. The lib code does not depend on TZ at all.
2. **Set `process.env.TZ` in `src/test/setup.ts` BEFORE any test imports run:**
   ```typescript
   // src/test/setup.ts (top of file, before testing-library imports)
   process.env.TZ = 'America/Argentina/Buenos_Aires'
   import '@testing-library/jest-dom'
   ```
3. **Belt-and-suspenders: add a CLI override for the SC#5 test only:**
   ```json
   // package.json scripts
   "test": "TZ=America/Argentina/Buenos_Aires vitest"
   ```
   This guarantees the env is set at process start regardless of vitest pool config.
4. **Verify the project uses `pool: 'forks'`** (vitest 3 default with jsdom is `forks`). [VERIFIED: `vite.config.ts` does not override `pool`; vitest 3's default for jsdom is `forks` per [vitest docs](https://vitest.dev/config/#pool)].
5. **The actual SC#5 test asserts behavior that is TZ-invariant by construction** — round-tripping an opaque string. The TZ pin is defensive against future regressions where someone adds `new Date()` wrapping.

**Warning signs:**
- Test fails on CI but passes locally (or vice versa).
- Test depends on `Intl.DateTimeFormat().resolvedOptions().timeZone` being a specific value.
- A `new Date(value)` call appears in `rankingFilters.ts`.

**Recommended TZ-pinning approach for SC#5 test:**
```typescript
// src/test/unit/rankingFilters.test.ts
import { describe, it, expect } from 'vitest'
import { parseRankingParams, serializeRankingParams } from '@/utils/rankingFilters'

describe('rankingFilters — TZ-safe YYYY-MM-DD round-trip (SC#5)', () => {
  it('round-trips from=2026-01-01 unchanged regardless of TZ', () => {
    // setup.ts pins process.env.TZ = 'America/Argentina/Buenos_Aires'
    // verify defensively in this test:
    expect(process.env.TZ).toBe('America/Argentina/Buenos_Aires')

    const initial = new URLSearchParams('?from=2026-01-01')
    const parsed = parseRankingParams(initial)
    expect(parsed.from).toBe('2026-01-01')

    const serialized = serializeRankingParams({ players: [], from: parsed.from })
    expect(serialized.toString()).toBe('from=2026-01-01')

    // Re-parse to confirm symmetry
    const reparsed = parseRankingParams(serialized)
    expect(reparsed.from).toBe('2026-01-01')
  })
})
```

### Pitfall B: `setSearchParams` infinite loop via intersection rewrite

**What goes wrong:** The hook reads URL → computes intersection → if drop happened, calls `setSearchParams` to rewrite cleaned URL → URL change triggers re-render → hook re-reads URL → re-computes intersection → if comparison is naive, calls `setSearchParams` again → loop.

**Why it happens:** The cleaned URL after rewrite still contains the same set of valid players, but if the comparison logic checks "are URL.players equal to my computed set?" with object identity instead of value equality, every render looks like a new mismatch.

**How to avoid:**
1. The intersection rewrite must be **idempotent**: only call `setSearchParams` if the post-intersection list is **strictly different** from the pre-intersection list (`urlPlayers.length !== validPlayers.length || ...sorted.join(',') !== sortedValid.join(',')`).
2. Wrap the rewrite in a `useEffect` keyed to `[searchParams, activePlayerIds]`, NOT in the hook's render body.
3. **Test:** mount the hook with `?players=ghost,real` against `activePlayerIds=['real']` → assert one `setSearchParams` call (not two, not infinite).

**Warning signs:**
- `setSearchParams` called every render in DevTools.
- Page re-renders on a tight loop.
- Address bar URL flickers visibly on entry to `/ranking`.

**Phase to address:** D-A3 (hook implementation). Test in `useRankingFilters.test.ts`.

### Pitfall C: Stale closure over `searchParams` inside `useEffect`

**What goes wrong:** A `useEffect` that uses `searchParams` to compute a fetch but lists only `[]` or only `[searchParams]` may capture a stale reference if the closure is rebuilt at a different cadence than expected.

**Why it happens:** `useSearchParams` returns a new `URLSearchParams` reference when the URL changes, BUT in v6.4+ that reference is stable for the same URL (per docs).

**How to avoid:**
- Read `searchParams` directly at the top of the hook body (not inside an `useEffect`'s closure).
- Derive parsed state synchronously per render: `const parsed = useMemo(() => parseRankingParams(searchParams), [searchParams])`.
- Setters use `useCallback` keyed to `[setSearchParams, currentParsedState]`.

**[CITED: https://reactrouter.com/api/hooks/useSearchParams]** — "The searchParams is a stable reference, so you can reliably use it as a dependency in React's useEffect hooks."

### Pitfall D: `URLSearchParams` ordering instability across browsers

**What goes wrong:** If the URL is built by `set('players', ...)` then `set('from', ...)` vs. `set('from', ...)` then `set('players', ...)`, `toString()` produces `players=…&from=…` vs `from=…&players=…`. URLs that are semantically identical look different to humans and to `===` comparisons.

**How to avoid:** `serializeRankingParams` must always set keys in **fixed order**: `players` first, then `from` (or any deterministic order, just consistent). Add a test that asserts URL string for a given state.

**Verification:**
```typescript
expect(serializeRankingParams({ players: ['a', 'b'], from: '2026-01-01' }).toString())
  .toBe('players=a%2Cb&from=2026-01-01')  // NB: comma encodes as %2C
```

**Note on encoding:** `URLSearchParams` percent-encodes commas (`,` → `%2C`) in values. The display in the address bar may show the encoded form. SC#3 in ROADMAP says "`?players=id1,id2&from=YYYY-MM-DD`" — the **literal** URL the user sees may be `?players=id1%2Cid2&from=…`. This is correct and equivalent. The plan should not try to bypass encoding. If unencoded display is required, that's a deferred UX nicety.

### Pitfall E: 0-active-players race

**What goes wrong:** `usePlayers({ activeOnly: true })` is async; on first render, `players === []`. If `useRankingFilters([])` is called with an empty `activePlayerIds`, the intersection is empty → fallback to default → default is also empty (= no players selected) → page renders empty state on the loading flicker before player list arrives.

**How to avoid:**
- Wait for `usePlayers.loading === false` AND `getEloHistory()` resolved before computing intersection. Show `Spinner` until both ready.
- The hook can accept `activePlayerIds: string[] | null` where `null` means "not yet loaded" — and skip intersection until non-null.
- Or: keep the hook stateless and let `Ranking.tsx` orchestrate the render gates. Recommended: render `<Spinner />` until `!playersLoading && !historyLoading && !error`.

### Pitfall F (CONTEXT-locked, restate for the planner): Hardcoded Date wrapping in MultiSelect onChange

The native `<input type="date">` returns `event.target.value` as `'YYYY-MM-DD'` (or `''` when cleared). Pass it directly to the setter. **Do not** call `new Date(value).toISOString()` on it — that introduces TZ shift (Pitfall 4 in milestone PITFALLS).

## Code Examples

### `getEloHistory()` (extending `src/api/elo.ts`)

```typescript
// Source: extends src/api/elo.ts (which currently has only getEloSummary)
import { api } from './client'
import type { PlayerEloSummaryDTO, PlayerEloHistoryDTO } from '@/types'

export function getEloSummary(playerId: string): Promise<PlayerEloSummaryDTO> {
  return api.get<PlayerEloSummaryDTO>(`/players/${playerId}/elo-summary`)
}

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

### Frontend types to add to `src/types/index.ts`

DTOs locked by Phase 8 plan 01 (verified via `08-01-PLAN.md`). Frontend mirrors exactly:

```typescript
// Append to src/types/index.ts after the existing PlayerEloSummaryDTO

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

### Tile addition in `Home.tsx`

```typescript
// Source: pattern from existing Home.tsx navItems (line 6-12)
const navItems = [
  { to: '/players', icon: '👥', title: 'Jugadores', description: 'Gestión de jugadores', disabled: false },
  { to: '/games/new', icon: '🎯', title: 'Cargar Partida', description: 'Registrar nueva partida', disabled: false },
  { to: '/games', icon: '📋', title: 'Partidas', description: 'Historial de partidas', disabled: false },
  { to: '/records', icon: '🏆', title: 'Records', description: 'Records globales', disabled: false },
  { to: '/achievements', icon: '🏅', title: 'Logros', description: 'Catalogo de logros', disabled: false },
  { to: '/ranking', icon: '📈', title: 'Ranking', description: 'Evolución de ELO', disabled: false },  // NEW
]
```

The existing CSS grid in `Home.module.css` already wraps; adding a 6th tile produces 2 columns × 3 rows on a 360px viewport. **No CSS change required** (verified by reading `Home.module.css` — 64px touch targets, flex-wrap layout).

### Route addition in `App.tsx`

```typescript
// Source: pattern from existing routes in App.tsx (line 30-94)
import Ranking from '@/pages/Ranking/Ranking'  // add to import block

// add inside <Routes>:
<Route
  path="/ranking"
  element={
    <ProtectedRoute>
      <Ranking />
    </ProtectedRoute>
  }
/>
```

### `useRankingFilters` skeleton (final shape — implementer fills bodies)

```typescript
// src/hooks/useRankingFilters.ts
import { useCallback, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseRankingParams, serializeRankingParams } from '@/utils/rankingFilters'

interface UseRankingFiltersResult {
  players: string[]              // resolved (intersected with active)
  fromDate: string | null
  setPlayers: (next: string[]) => void
  setFromDate: (next: string | null) => void
  clearAll: () => void
}

export function useRankingFilters(activePlayerIds: string[] | null): UseRankingFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsed = useMemo(() => parseRankingParams(searchParams), [searchParams])

  // Compute resolved players: intersection or default
  const resolved = useMemo(() => {
    if (activePlayerIds === null) return { players: [], from: parsed.from }  // not yet loaded
    if (!parsed.hasPlayersKey) {
      // URL clean → default to all active (D-C1)
      return { players: activePlayerIds, from: parsed.from }
    }
    // URL has ?players= or ?players=… → intersect
    const valid = parsed.players.filter((id) => activePlayerIds.includes(id))
    if (valid.length === 0) {
      // Empty intersection → in-memory fallback to all active, no URL write (D-A3 step 4)
      return { players: activePlayerIds, from: parsed.from }
    }
    return { players: valid, from: parsed.from }
  }, [parsed, activePlayerIds])

  // Idempotent URL rewrite when intersection dropped invalid IDs (D-A3 step 3)
  useEffect(() => {
    if (activePlayerIds === null) return
    if (!parsed.hasPlayersKey) return  // URL is already clean
    const valid = parsed.players.filter((id) => activePlayerIds.includes(id))
    const sorted = [...valid].sort()
    const urlSorted = [...parsed.players].sort()
    if (sorted.join(',') === urlSorted.join(',')) return  // no change → no rewrite
    if (valid.length === 0) {
      // Drop ?players= entirely (fallback to default, URL clean)
      setSearchParams(serializeRankingParams({ players: [], from: parsed.from }), { replace: true })
    } else {
      setSearchParams(serializeRankingParams({ players: valid, from: parsed.from }), { replace: true })
    }
  }, [parsed, activePlayerIds, setSearchParams])

  const setPlayers = useCallback((next: string[]) => {
    setSearchParams(
      serializeRankingParams({ players: next, from: resolved.from }, { explicitEmptyPlayers: next.length === 0 }),
      { replace: true },
    )
  }, [resolved.from, setSearchParams])

  const setFromDate = useCallback((next: string | null) => {
    // CRITICAL: never wrap in new Date() — pass through as opaque string
    setSearchParams(
      serializeRankingParams({ players: resolved.players, from: next }),
      { replace: true },
    )
  }, [resolved.players, setSearchParams])

  const clearAll = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })  // D-C4
  }, [setSearchParams])

  return { players: resolved.players, fromDate: resolved.from, setPlayers, setFromDate, clearAll }
}
```

This is a **sketch for the planner**, not finished code. It illustrates the wiring; the implementer should refine signatures, memoization, and test it against all four area-A decisions.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 + @testing-library/react 16.1.0 + jsdom 25.0.1 |
| Config file | `frontend/vite.config.ts` (test block, line ~22-27) |
| Quick run command | `npm run test -- --run rankingFilters` (single file) |
| Full suite command | `npm test` |
| TZ-pinning | Add `process.env.TZ = 'America/Argentina/Buenos_Aires'` to `src/test/setup.ts`; optionally also `TZ=America/Argentina/Buenos_Aires npm test` script |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RANK-01 | `/ranking` renders + tile navigates from Home | component (smoke via MemoryRouter) | `npm test -- --run Ranking.test` | ❌ Wave 0 (new file) |
| RANK-03 | Default = all active players when URL empty | hook test (renderHook + MemoryRouter) | `npm test -- --run useRankingFilters.test` | ❌ Wave 0 |
| RANK-03 | MultiSelect deselect → empty state, not auto-default | component | `npm test -- --run RankingFilters.test` | ❌ Wave 0 |
| RANK-04 | "Desde" filter restricts dataset client-side | unit (filter pipeline) + component | `npm test -- --run rankingFilters.test` (lib) + RankingFilters.test (component) | ❌ Wave 0 |
| RANK-06 | URL → state hydration on mount | hook | `npm test -- --run useRankingFilters.test` | ❌ Wave 0 |
| RANK-06 | Filter change → URL write (replace mode) | hook | `npm test -- --run useRankingFilters.test` | ❌ Wave 0 |
| RANK-06 | Unknown ID drop + silent rewrite | hook | `npm test -- --run useRankingFilters.test` | ❌ Wave 0 |
| RANK-06 | Empty intersection → fallback to default, no URL write | hook | `npm test -- --run useRankingFilters.test` | ❌ Wave 0 |
| SC#5 (RANK-04) | YYYY-MM-DD round-trip in BA TZ | unit (pure fn) | `npm test -- --run rankingFilters.test` | ❌ Wave 0 |
| SC#3 | Reload reproduces selection | manual (smoke) — load `/ranking?players=…&from=…`, hard reload | manual checklist in PLAN | n/a |
| SC#6 | Empty state with "Limpiar filtros" CTA | component | `npm test -- --run Ranking.test` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run typecheck && npm test -- --run rankingFilters` (the slice the task touches)
- **Per wave merge:** `npm test` (full vitest suite)
- **Phase gate:** Full suite green + manual smoke (SC#1, SC#3) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/test/setup.ts` — pin `process.env.TZ = 'America/Argentina/Buenos_Aires'` at top of file
- [ ] `src/test/unit/rankingFilters.test.ts` — covers pure-fn parse/serialize round-trip (SC#5 lives here)
- [ ] `src/test/hooks/useRankingFilters.test.ts` — covers hook behavior (intersection, drop+rewrite, default fallback, replace mode, clearAll)
- [ ] `src/test/components/RankingFilters.test.tsx` — covers component composition (MultiSelect interaction, date input, clear button)
- [ ] `src/test/components/Ranking.test.tsx` — covers page-level integration (mount fetch, error state, empty state, skeleton render)

**Test idiom precedents (verified):**
- `frontend/src/test/components/EloSummaryCard.test.tsx` — `render` + `screen` + `expect(...).toBeInTheDocument()` style
- `frontend/src/test/hooks/useGames.test.ts` — `renderHook` + `act` + `vi.mock(...)` style for hook tests
- `frontend/src/test/unit/validation.test.ts` — pure-fn unit test idiom

## Project Constraints (from CLAUDE.md)

| Constraint | Source | Phase 11 Compliance |
|------------|--------|---------------------|
| Planning obligatorio antes de código | CLAUDE.md §1 | Followed via `/gsd-plan-phase` |
| Detectar ambigüedades, consultar decisiones importantes | CLAUDE.md §1 | Done in `/gsd-discuss-phase` (CONTEXT.md exists) |
| Cada funcionalidad: comportamiento + criterios + casos borde + tests | CLAUDE.md §2 | Empty state, intersection fallback, replace mode, TZ test all covered |
| No duplicar código | CLAUDE.md §3 | Reuse `MultiSelect`, `Spinner`, `Promise.all` idiom; no Skeleton component (D-B5) |
| Refactor si función >20 líneas | CLAUDE.md §3 | Hook may approach 20 lines; split into helpers if needed (Claude's Discretion) |
| Separar lógica y presentación | CLAUDE.md §3 | `rankingFilters.ts` (pure logic) ↔ `RankingFilters.tsx` (presentation) |
| Actualizar archivos `.md` desactualizados | CLAUDE.md §3 | STATE.md will need update post-execution |
| React funcional con hooks | CLAUDE.md Frontend Rules | All new code uses hooks |
| Mobile-first | CLAUDE.md Frontend Rules | Skeleton `min-height: 280px`, MultiSelect/date input native, native ranges |
| Componentes pequeños y reutilizables | CLAUDE.md Frontend Rules | `RankingFilters` composes existing primitives |
| Sin inline styling | CLAUDE.md Frontend Rules | All styles via `Ranking.module.css` and `RankingFilters.module.css` |
| CSS separado y reutilizable | CLAUDE.md Frontend Rules | CSS Modules + design tokens |
| Parametrizar colores y variables comunes | CLAUDE.md Frontend Rules | `var(--color-text-muted)`, `var(--color-error)`, `var(--spacing-*)` from `index.css` |

**Memory rule:** `feedback_never_run_pytest_locally` — Phase 11 is 100% frontend, vitest only. Pytest does NOT apply. **Memory rule:** `feedback_review_before_commit` — never `git commit` until user approves diff (applies to plan-checker / executor, not researcher).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `URLSearchParams` constructor mutation | `setSearchParams(updater, { replace: true })` | react-router v6 (2022) | Replace option officially supported per [PR resolution](https://github.com/remix-run/react-router/issues/8062) |
| Per-tab state via `localStorage` | URL search params via `useSearchParams` | RR v6 | Shareable, reload-survives, history-aware |
| `Date` object math for filter | Opaque `'YYYY-MM-DD'` string compare | Project decision (formatDate.ts) | TZ-immune, lexicographic ordering matches chronology |

**Deprecated/outdated:**
- React Query / SWR — explicitly NOT used in this project (Pitfall 1 in milestone research). Stay on inline `useEffect`.
- Class components — project uses functional only.

## Assumptions Log

> Each `[ASSUMED]` claim flags a decision the planner / discuss-phase should confirm if execution risk emerges. Most claims in this research are `[VERIFIED]` via direct codebase reads.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | vitest 3 with jsdom defaults to `pool: 'forks'` (so `process.env.TZ` in setupFiles is reliable) | Pitfall A | LOW — even if pool is `threads`, the production code is TZ-immune by string-only handling. Fallback: CLI `TZ=…` script. |
| A2 | `URLSearchParams` `set(key, '')` produces `?key=` exactly (not stripped, not omitted) | Pattern 3, D-C2/D-C3 | LOW — confirmed by web standard search ([WHATWG URL](https://github.com/whatwg/url/issues/427), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/toString)) but not retested on the user's exact browser/Node combo. Mitigation: include a serialize-then-parse round-trip test. |
| A3 | `usePlayers({ activeOnly: true })` returns players whose `is_active === true` | D-B4 | LOW — verified via direct read of `src/hooks/usePlayers.ts:14-25` and `src/api/players.ts:9-12` showing `getPlayers(active?)` query string passthrough. The backend `/players/?active=true` filter is mature and used elsewhere. |
| A4 | Phase 8 ships `EloHistoryPointDTO { recorded_at: date, game_id, elo_after, delta }` and `PlayerEloHistoryDTO { player_id, player_name, points }` exactly | Code Examples (types) | MEDIUM — Phase 8 plans 01/02/04 exist but `08-03-PLAN.md` is missing from disk and `backend/routes/elo_routes.py` source is NOT committed yet (only `.pyc` cache). The DTO contract is locked by 08-01-PLAN.md but the route shipping date is unknown. **Phase 11 must NOT execute until Phase 8 ships and `/elo/history` is live.** |
| A5 | `pool: 'forks'` is vitest 3 default — `process.env.TZ` set in setupFiles propagates to all test workers | Validation Architecture | LOW — verified via vitest docs but project hasn't pinned. Fallback: CLI script. |
| A6 | Putting pure-fn helpers in `src/utils/rankingFilters.ts` matches project convention better than `src/lib/` (CONTEXT prefers `lib/`) | File Layout | LOW — both work. CONTEXT names `lib/`; STRUCTURE.md uses `utils/`. Recommend `utils/` for convention; planner can override per Claude's Discretion. |

**Empty assumption table would mean** all claims were [VERIFIED] / [CITED]. The 6 above are the genuine unknowns.

## Open Questions

1. **Is Phase 8 done before Phase 11 starts executing?** — `backend/routes/elo_routes.py` is not committed yet (only `.pyc` cache visible). Phase 11 plan execution is blocked until Phase 8 ships `GET /elo/history` live. The planner should verify the live endpoint exists before any task starts; Wave 0 Plan 1 could include a smoke-curl against the backend.
2. **`src/lib/` vs. `src/utils/` for `rankingFilters.ts`?** — Convention says `utils/`; CONTEXT says `lib/`. Recommend `utils/`. Planner decides.
3. **One combined `onChange({ players, from })` vs. separate handlers in `<RankingFilters>`?** — Claude's Discretion (CONTEXT line 107). Recommend separate handlers (cleaner pattern: `onPlayersChange`, `onFromDateChange`, `onClear`) — already in CONTEXT D-A1 prop list.
4. **Should the Home `navItems` array be extracted to a typed constant?** — Claude's Discretion (CONTEXT line 111). Recommend NOT — the array is short, only Home reads it, no other phases plan to reuse. YAGNI.
5. **Do we need a manual smoke test as part of Phase 11 closure?** — SC#1 and SC#3 ("tile navigates", "URL share/reload reproduces state") are most reliably tested in a real browser. Planner should include a manual smoke checklist in the final plan.

## Environment Availability

> This is a frontend-only phase consuming an existing backend endpoint. No external CLI tools, no new runtimes, no new services.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `npm test`, `npm run dev` | (project standard) | 18+ | — |
| npm | install | (project standard) | bundled | — |
| vitest | test execution | ✓ | 3.2.4 | — |
| react-router-dom | `useSearchParams` | ✓ | ^6.28.0 | — |
| Backend `/elo/history` endpoint | Page-level fetch on mount | **PARTIAL** (Phase 8 plans 01/02/04 exist, 03 not on disk; live route source not committed) | — | **BLOCKING** — Phase 11 cannot ship without Phase 8 live |

**Missing dependencies with no fallback:**
- `GET /elo/history` live endpoint. Phase 11 execution depends on Phase 8 shipping. **Planner MUST verify endpoint exists before kicking off execution.**

**Missing dependencies with fallback:**
- None.

## Sources

### Primary (HIGH confidence — direct codebase reads)

- `frontend/src/api/client.ts` — `api.get<T>(path)` signature; **single argument only**
- `frontend/src/api/elo.ts` — `getEloSummary` precedent; place to add `getEloHistory`
- `frontend/src/api/players.ts` — `getPlayers(active?)` query-string-by-hand idiom
- `frontend/src/components/MultiSelect/MultiSelect.tsx` — exact prop shape `{ label, options: { value, label }[], value: string[], onChange, error? }`
- `frontend/src/hooks/usePlayers.ts` — `{ activeOnly: true }` filter, returns `{ players, loading, error, refetch, addPlayer, editPlayer }`
- `frontend/src/pages/PlayerProfile/PlayerProfile.tsx:28-45` — canonical `Promise.all` + separated try/catch + `.finally()` idiom (Phase 9 D-14)
- `frontend/src/pages/Home/Home.tsx:6-12` — `navItems` array shape with `disabled` flag
- `frontend/src/App.tsx:30-94` — `<Route><ProtectedRoute>…</ProtectedRoute></Route>` wrapping pattern
- `frontend/src/test/setup.ts` — minimal setup, no TZ pin currently
- `frontend/src/test/components/EloSummaryCard.test.tsx` — vitest component idiom
- `frontend/src/test/hooks/useGames.test.ts` — `renderHook` + `vi.mock` idiom
- `frontend/src/utils/formatDate.ts` — TZ-safe string-only `YYYY-MM-DD` pattern
- `frontend/src/types/index.ts` — placement for new DTOs (after `PlayerEloSummaryDTO` line ~205)
- `frontend/vite.config.ts` — vitest 3 + jsdom; no TZ pin; no pool override
- `frontend/package.json` — verified versions
- `backend/schemas/elo.py` — current `EloChangeDTO` shape
- `.planning/phases/08-backend-get-elo-history-endpoint/08-01-PLAN.md` — locks `EloHistoryPointDTO` and `PlayerEloHistoryDTO` shape
- `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`, `.planning/research/SUMMARY.md` — milestone-level research (HIGH confidence per SUMMARY metadata)
- `.planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence — official docs / web standards)

- [React Router v6 — `useSearchParams` API reference](https://reactrouter.com/api/hooks/useSearchParams) — confirmed `setSearchParams(values, { replace: true })` shape, stable searchParams reference
- [WHATWG URL Issue #427 — searchParams.set behavior](https://github.com/whatwg/url/issues/427) — confirmed empty-string serialization
- [MDN — URLSearchParams.toString()](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/toString) — confirmed `?key=` form for empty values
- [vitest discussion #1718 — Setting TZ env variables](https://github.com/vitest-dev/vitest/discussions/1718) — confirmed `process.env.TZ` in `globalSetup` / `setupFiles` works
- [Stryker JS Issue #5982 — vitest pool: 'threads' ignores env.TZ](https://github.com/stryker-mutator/stryker-js/issues/5982) — confirmed thread-pool TZ limitation
- [vitest config docs](https://vitest.dev/config/) — pool defaults

### Tertiary (LOW confidence — informed but not load-bearing)

- [LogRocket — URL state with useSearchParams](https://blog.logrocket.com/url-state-usesearchparams/) — corroborates URL-as-source-of-truth pattern
- [Robin Wieruch — React Router 7 Search Params](https://www.robinwieruch.de/react-router-search-params/) — corroborates batching note (multiple `setSearchParams` in one tick don't queue like setState)
- [Peerlist — Avoiding TZ test failures in CI](https://peerlist.io/mehul/articles/avoiding-test-failures-in-ci-due-to-timezone-mismatch) — pattern confirmation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package read directly from `package.json`
- Architecture patterns: HIGH — every pattern grounded in a verified file path with line ranges
- Pitfalls: HIGH — Pitfall A (TZ + thread pool) verified via vitest docs + GitHub issues; Pitfall D (URLSearchParams ordering) is a property of the spec, not opinion
- Phase 8 dependency: MEDIUM — DTO contract is locked by an existing plan file, but live deployment status uncertain (assumption A4)
- File layout (`utils/` vs `lib/`): LOW (Claude's Discretion, both work)

**Research date:** 2026-04-30
**Valid until:** 2026-05-30 (30-day window — react-router-dom and vitest both stable; Phase 8 will likely ship in this window)

## RESEARCH COMPLETE

**Phase:** 11 - Ranking page skeleton + filters + URL state
**Confidence:** HIGH

### Key Findings

- **Stack is locked**: zero new dependencies. All controls (`MultiSelect`, native date input, `useSearchParams`, `Spinner`, design tokens) verified by direct codebase read.
- **CRITICAL CORRECTION**: CONTEXT line 184 incorrectly states `api.get<T>(path, params?)`. Real signature is `api.get<T>(path)` only. D-A4 makes this irrelevant for Phase 11 (no params consumed), but the planner must not prescribe a 2-arg call.
- **Pure functions go in `src/utils/`**, not `src/lib/` — matches project convention (`gameCalculations.ts`, `formatDate.ts`, `validation.ts`). CONTEXT names `lib/` but it's Claude's Discretion.
- **TZ-pin strategy for SC#5**: pin `process.env.TZ = 'America/Argentina/Buenos_Aires'` in `src/test/setup.ts` AND optionally in npm test script (CLI override). Production code is TZ-immune by string-only handling, so the test is a regression guard, not a load-bearing correctness check.
- **`URLSearchParams.has(key)` distinguishes empty vs absent** — confirmed by web standard. D-C3's `hasPlayersKey` flag is robust and round-trip stable.
- **Phase 8 endpoint deployment status is the blocking unknown**: plans for backend `/elo/history` exist but route source is not committed. Phase 11 cannot execute against a missing endpoint. Planner must verify before starting execution.

### File Created

`/Users/facu/Desarrollos/Personales/tm-scorekeeper/.planning/phases/11-ranking-page-skeleton-filters-url-state/11-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All versions read from `package.json`; all paths verified via `ls` and direct read |
| Architecture | HIGH | Every pattern grounded in a specific file + line range from existing codebase |
| Pitfalls | HIGH | TZ+threads risk + URLSearchParams encoding both verified via official docs and web standards |
| Phase 8 deployment | MEDIUM | DTO contract locked, route delivery uncertain — flagged as blocking pre-execution check |

### Open Questions (carried forward to PLAN)

1. Is `GET /elo/history` live before Phase 11 execution starts? (Blocking; planner must verify.)
2. `src/lib/` vs `src/utils/` for pure-fn helpers? (Recommendation: `src/utils/`.)
3. Combined vs separate `<RankingFilters>` handlers? (Recommendation: separate, per CONTEXT D-A1.)
4. Extract `navItems` to typed constant? (Recommendation: NO — YAGNI.)
5. Manual smoke test in plan closure? (Recommendation: YES — for SC#1/SC#3.)

### Ready for Planning

Research complete. Planner can now create PLAN.md files for Phase 11.
