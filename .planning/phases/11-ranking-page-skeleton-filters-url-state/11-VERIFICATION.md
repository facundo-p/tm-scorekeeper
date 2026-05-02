---
phase: 11-ranking-page-skeleton-filters-url-state
verified: 2026-04-30T02:11:30Z
status: human_needed
score: 5/6
overrides_applied: 0
re_verification: false
human_verification:
  - test: "Manual browser smoke: tile click navigates to /ranking; URL filter state persists on reload and across new tabs; ghost IDs are silently dropped from the address bar; empty state + Limpiar filtros CTA resets URL; back-button uses replace mode (no history entries for each filter change); mobile DevTools 375px shows vertical stacking with no horizontal scroll"
    expected: "All 7 smoke groups from Plan 06 Task 3 steps 4-27 pass without drift"
    why_human: "React Router client-side rendering, auth redirect, URL param persistence across hard reloads and new tabs, mobile touch targets, and back-button history discipline cannot be verified programmatically without a running browser and authenticated session. Curl smoke confirmed HTTP 200 from dev server but cannot execute JS or verify filter state round-trips."
---

# Phase 11: Ranking Page Skeleton + Filters + URL State — Verification Report

**Phase Goal:** Users reach a `/ranking` page from Home, pick which players and which date window they want, and the URL captures the filter state for reload and sharing
**Verified:** 2026-04-30T02:11:30Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC#1 | A "Ranking — Evolución de ELO" tile on Home navigates to `/ranking`; the route is wrapped in `<ProtectedRoute>` | VERIFIED | `Home.tsx` line 12: `{ to: '/ranking', icon: '📈', title: 'Ranking', description: 'Evolución de ELO', disabled: false }`. `App.tsx` lines 95-102: `path="/ranking"` wrapped in `<ProtectedRoute><Ranking /></ProtectedRoute>`. Tile positioned after `/achievements` (awk ordering check passes). |
| SC#2 | The page composes `MultiSelect` for players (default = all active when URL empty) and a `DateFromFilter` ("Desde") with a native `<input type="date">` | VERIFIED | `RankingFilters.tsx` composes `<MultiSelect label="Jugadores">` and `<input type="date" className={styles.dateInput}>` with label "Desde". `Ranking.tsx` renders `<RankingFilters activePlayersOptions={activePlayersOptions}>` driven by `usePlayers`. Hook test describe-A confirms default all-active: `result.current.players === ['p1','p2','p3']` when URL has no players key. |
| SC#3 | Changing filters writes to URL search params; reloading the page restores the same selection; copying the URL into a new tab reproduces the same view | PARTIAL (human_needed) | Automated: `useRankingFilters` hook (21 tests) verifies URL writes via `setSearchParams`. Tests cover setPlayers, setFromDate, clearAll, replace:true mode, deterministic key order. `grep -c "replace: true" useRankingFilters.ts` = 5. NOT VERIFIED: actual browser reload/new-tab behavior requires manual smoke (curl only confirmed HTTP 200 shell delivery, not JS execution). |
| SC#4 | URL `players` are intersected against active players: unknown ids silently dropped; URL rewritten to cleaned subset; empty intersection falls back to default all-active | VERIFIED | Hook tests describe-B and C cover both cases. Describe-B: `?players=p1,ghost,p2` with active=['p1','p2','p3'] → resolved=['p1','p2'], URL rewritten once (idempotent guard). Describe-C: `?players=ghost1,ghost2` with active=['p1','p2'] → resolved=['p1','p2'], URL drops players key. Pitfall B (infinite rewrite) explicitly guarded. |
| SC#5 | Filter dates round-trip as opaque `YYYY-MM-DD` strings; verified by vitest test in `America/Argentina/Buenos_Aires` timezone | VERIFIED | `setup.ts` line 1: `process.env.TZ = 'America/Argentina/Buenos_Aires'`. `rankingFilters.test.ts` describe "TZ-safe YYYY-MM-DD round-trip (SC#5)": asserts `process.env.TZ === 'America/Argentina/Buenos_Aires'` then confirms `parseRankingParams(new URLSearchParams('from=2026-01-01')).from === '2026-01-01'` round-trips back to `'from=2026-01-01'`. Zero `new Date(` constructor calls in all source files (only a comment text in `rankingFilters.ts`). |
| SC#6 | When the active filter excludes all data, the page shows "Sin partidas en este rango" with "Limpiar filtros" CTA, not a blank page | VERIFIED | `Ranking.tsx` lines 22-37: `renderEmptyState('no-data', clearAll)` renders "Sin partidas en este rango" + `<Button>Limpiar filtros</Button>`. `Ranking.test.tsx` test 3: `renderAt('/ranking?from=2026-01-01')` with data in 2025 → `screen.getByText('Sin partidas en este rango')` passes. Test 4 covers "Selecciona al menos un jugador" path. Test 8 confirms clicking Limpiar filtros clears URL and restores skeleton. |

**Score:** 5/6 truths fully verified (SC#3 has automated evidence but requires human confirmation of real-browser persistence behaviors)

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Chart skeleton (`data-testid="chart-skeleton"`) is a placeholder div, not a real chart | Phase 12 | Phase 12 goal: "The `/ranking` page renders the multi-line ELO evolution chart." Phase 12 SC#1: "The chart renders one line per selected player with a deterministic, id-keyed color palette." The skeleton's `data-testid` is the explicit replacement target per Plan 05 SUMMARY. |
| 2 | No leaderboard table below chart | Phase 12 | Phase 12 SC#5: "Below the chart, a leaderboard table lists Posición, Jugador, ELO actual, Última delta." RANK-05 requirement is explicitly mapped to Phase 12 in REQUIREMENTS.md. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/test/setup.ts` | TZ pin at line 1 | VERIFIED | Line 1: `process.env.TZ = 'America/Argentina/Buenos_Aires'`; line 2: `import '@testing-library/jest-dom'`; localStorage polyfill unchanged |
| `frontend/src/types/index.ts` | EloHistoryPointDTO + PlayerEloHistoryDTO | VERIFIED | Both interfaces present, 4 and 3 fields respectively, mirrors Phase 8 backend exactly |
| `frontend/src/api/elo.ts` | `getEloHistory()` single-arg export | VERIFIED | `api.get<PlayerEloHistoryDTO[]>('/elo/history')` — single arg, no query params |
| `frontend/src/utils/rankingFilters.ts` | 3 pure functions + 2 interfaces | VERIFIED | `parseRankingParams`, `serializeRankingParams`, `applyRankingFilters` exported; `RankingFilterState`, `RankingParseResult` exported |
| `frontend/src/test/unit/rankingFilters.test.ts` | 4 describe blocks, SC#5 test | VERIFIED | 16 tests in 4 describes, TZ assertion present |
| `frontend/src/hooks/useRankingFilters.ts` | Hook with URL state + intersection + idempotent rewrite | VERIFIED | 3 helpers extracted (computeResolved, shouldRewriteUrl, useSetters); 5× `replace: true`; 1× `explicitEmptyPlayers` |
| `frontend/src/test/hooks/useRankingFilters.test.ts` | 21 tests across describes A-I | VERIFIED | 21 tests, all pass |
| `frontend/src/components/RankingFilters/RankingFilters.tsx` | Presentational composer (MultiSelect + date + Button) | VERIFIED | 37 lines; 16 LOC body; zero `new Date(`; zero inline style |
| `frontend/src/components/RankingFilters/RankingFilters.module.css` | Design tokens only | VERIFIED | 17× `var(--`; zero hex literals |
| `frontend/src/test/components/RankingFilters.test.tsx` | 8 tests | VERIFIED | 8 tests, all pass |
| `frontend/src/pages/Ranking/Ranking.tsx` | Page with 4 render gates | VERIFIED | loading/error/empty(×2)/skeleton gates; all Spanish strings present; zero `new Date(`; zero inline styles |
| `frontend/src/pages/Ranking/Ranking.module.css` | Token-based layout with chartSkeleton | VERIFIED | 25× `var(--`; `min-height: 280px` present; zero hex literals |
| `frontend/src/test/components/Ranking.test.tsx` | 8 tests covering all render gates | VERIFIED | 8 tests, all pass |
| `frontend/src/App.tsx` | `/ranking` route in ProtectedRoute | VERIFIED | `import Ranking from '@/pages/Ranking/Ranking'`; Route element wrapped in `<ProtectedRoute><Ranking /></ProtectedRoute>` |
| `frontend/src/pages/Home/Home.tsx` | 6th navItem: Ranking tile | VERIFIED | `{ to: '/ranking', icon: '📈', title: 'Ranking', description: 'Evolución de ELO', disabled: false }` after `/achievements` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `App.tsx` | `Ranking.tsx` | `import Ranking from '@/pages/Ranking/Ranking'` | WIRED | Import line 14; Route element confirmed |
| `App.tsx` | `ProtectedRoute` | Route element wrapper | WIRED | `<ProtectedRoute><Ranking /></ProtectedRoute>` |
| `Home.tsx` | `/ranking` route | `navItems[5].to = '/ranking'` | WIRED | Line 12; awk ordering: after `/achievements` |
| `Ranking.tsx` | `getEloHistory()` | `useEffect([retryCount])` | WIRED | Line 76: `getEloHistory().then(setDataset).catch(...)` |
| `Ranking.tsx` | `useRankingFilters` | hook call passing `activePlayerIds` | WIRED | Line 65: `useRankingFilters(activePlayerIds)` |
| `Ranking.tsx` | `<RankingFilters>` | rendered child with setters | WIRED | Lines 109-116: all 6 props passed |
| `Ranking.tsx` | `applyRankingFilters` | `useMemo` client-side filter | WIRED | Lines 82-85: `applyRankingFilters(dataset, selectedPlayers, fromDate)` |
| `useRankingFilters.ts` | `rankingFilters.ts` | `parseRankingParams`, `serializeRankingParams` | WIRED | Lines 3-4: imports confirmed |
| `useRankingFilters.ts` | `react-router-dom useSearchParams` | URL read/write with `replace: true` | WIRED | Line 2: import; 5× `replace: true` |
| `RankingFilters.tsx` | `MultiSelect` | composition (rendered child) | WIRED | Line 1 import; rendered at line 24 |
| `RankingFilters.tsx` | `Button` | "Limpiar filtros" button | WIRED | Line 2 import; rendered at line 34 |
| `api/elo.ts` | `types/index.ts` | `import type { PlayerEloHistoryDTO }` | WIRED | Line 2: `import type { PlayerEloSummaryDTO, PlayerEloHistoryDTO } from '@/types'` |
| `rankingFilters.ts` | `types/index.ts` | `import type { PlayerEloHistoryDTO }` | WIRED | Line 1 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `Ranking.tsx` | `dataset` (PlayerEloHistoryDTO[]) | `getEloHistory()` → `api.get('/elo/history')` → backend Phase 8 | Phase 8 verified live (curl HTTP 200, exact DTO shape confirmed); data flows through `setDataset` in useEffect | FLOWING |
| `Ranking.tsx` | `filtered` (applyRankingFilters output) | `dataset` filtered by `selectedPlayers` + `fromDate` | Pure function with 4 test cases; filters are applied per URL params | FLOWING |
| `Ranking.tsx` | `activePlayersOptions` | `usePlayers({ activeOnly: true })` → existing API | Uses the same `usePlayers` hook tested in prior phases | FLOWING |
| `RankingFilters.tsx` | All props (players, fromDate, activePlayersOptions) | Passed from Ranking.tsx at lines 109-116 | No hardcoded empty values at call site; all driven by real hook/fetch data | FLOWING |

### Behavioral Spot-Checks (Step 7b)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite (189 tests, 22 files) | `cd frontend && npx vitest run --reporter=basic` | 189 passed, 0 failed | PASS |
| TypeScript compilation clean | `cd frontend && npx tsc --noEmit` | Exit 0, no output | PASS |
| TZ pin at line 1 of setup.ts | `head -1 src/test/setup.ts` | `process.env.TZ = 'America/Argentina/Buenos_Aires'` | PASS |
| `/ranking` route registered in App.tsx | `grep -c 'path="/ranking"' src/App.tsx` | 1 | PASS |
| Ranking tile in Home navItems after Logros | `awk` ordering check | Exit 0 | PASS |
| Zero `new Date(` constructor calls in source files | `grep "new Date" rankingFilters.ts useRankingFilters.ts RankingFilters.tsx Ranking.tsx` | Only comment text in rankingFilters.ts | PASS |
| Zero inline styles in components | `grep " style=" Ranking.tsx RankingFilters.tsx` | No output | PASS |
| Chart skeleton `min-height: 280px` | `grep -c "min-height: 280px" Ranking.module.css` | 1 | PASS |
| Dev server serves /ranking | `curl -sS -w "\nHTTP %{http_code}\n" http://localhost:5173/ranking` | HTTP 200 (documented in 11-06-SUMMARY.md) | PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|----------------|-------------|--------|----------|
| RANK-01 | 11-06 | Usuario accede a "Ranking" desde navegación principal (`/ranking`) | VERIFIED | Route registered in App.tsx with ProtectedRoute; Home navItems[5] = `/ranking` tile enabled |
| RANK-03 | 11-03, 11-04, 11-05 | Ranking page incluye selector multi-jugador con default = todos los jugadores activos | VERIFIED | `useRankingFilters` describe-A: URL clean → resolved.players === activePlayerIds. `RankingFilters` composes `MultiSelect`. Page renders filters wired to hook. |
| RANK-04 | 11-02, 11-04, 11-05 | Ranking page incluye filtro de fecha "desde" (input nativo `type=date`) | VERIFIED | `applyRankingFilters` lexicographic compare. `RankingFilters` renders `<input type="date">` with opaque-string passthrough. Empty state test confirms date filter excludes data. |
| RANK-06 | 11-02, 11-03, 11-05, 11-06 | Estado de filtros se persiste en URL search params; IDs inválidos se filtran | VERIFIED (automated) / human_needed (real browser) | URL writes via `setSearchParams`; `replace: true` × 5; serialization deterministic; invalid ID intersection drops confirmed in hook tests. Real-browser persistence (reload/new-tab) requires manual smoke. |

**Orphaned requirements check:** REQUIREMENTS.md maps RANK-02 and RANK-05 to Phase 12 (not Phase 11). No RANK IDs are orphaned for this phase.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/pages/Ranking/Ranking.tsx` | 40-48 | `renderChartSkeleton()` returns placeholder divs | Info | Intentional Phase 11 deliverable — chart skeleton is the explicit replacement target for Phase 12. `data-testid="chart-skeleton"` stabilizes the handoff. Documented in Plan 05 SUMMARY under "Known Stubs". |
| `src/utils/rankingFilters.ts` | 50 | Comment text contains "NEVER new Date()" | Info | Comment only — zero actual `new Date(` constructor calls in logic. Grep match is documentation, not a stub. |

No blockers or warnings found.

### Human Verification Required

#### 1. Manual Browser Smoke: RANK-01 + SC#3 + SC#6 + RANK-06 end-to-end

**Test:** Run the full smoke checklist from Plan 06 Task 3, steps 4-27:
- (steps 4-6) Open Home, locate "Ranking" tile (📈 Evolución de ELO, last after Logros), click it → expect URL becomes `/ranking`, filter bar and chart skeleton render
- (steps 7-13) Apply player + date filters, hard-reload → same selection restores. Copy URL, open new tab → same view renders.
- (steps 14-15) Navigate to `/ranking?players=ghost-id-123,real-active-id` → ghost ID silently dropped from address bar.
- (steps 16-22) Set "Desde" far in future → empty state with "Limpiar filtros". Click it → URL clears, skeleton returns. Deselect all players → "Selecciona al menos un jugador" + Limpiar. Click Limpiar → default restores.
- (steps 23-25) Apply filter changes, click browser Back → lands on Home, NOT through filter history entries (replace mode).
- (steps 26-27) iPhone SE 375px in DevTools → filters stack vertically, no horizontal scroll, chart skeleton min-height 280px visible.

**Expected:** All 7 smoke groups pass without drift.

**Why human:** React Router client-side routing, auth redirect behavior via ProtectedRoute, URL param persistence across hard reloads and new browser tabs, and back-button history discipline require actual JS execution in a browser with an authenticated session. The curl smoke confirmed the Vite dev server delivers the SPA shell at `/ranking` with HTTP 200 but cannot execute React or verify filter state. Mobile touch targets require DevTools device emulation.

---

### Gaps Summary

No gaps blocking goal achievement. All automated must-haves are satisfied:
- Route and tile wiring: complete and verified
- Data layer (types, API wrapper, pure utils): complete with 16 unit tests
- Hook (useRankingFilters): complete with 21 tests covering all D-A/D-C decisions
- Component (RankingFilters): complete with 8 tests; no inline styles, no hardcoded colors
- Page (Ranking): complete with 8 tests covering all 4 render gates
- Full test suite: 189/189 passing across 22 files
- TypeScript: clean compile

One human verification item remains per the auto-approval rationale in 11-06-SUMMARY.md: the manual browser smoke for SC#3/RANK-06 real-browser persistence (reload, new-tab share, ghost-ID drop), SC#1 tile click, SC#6 empty-state CTA, back-button discipline, and mobile layout. This was auto-approved during execution but flagged as requiring user confirmation before PR merge.

---

_Verified: 2026-04-30T02:11:30Z_
_Verifier: Claude (gsd-verifier)_
