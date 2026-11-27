---
phase: 11
plan: "06"
subsystem: frontend-routing
tags: [routing, home-tile, rank-01, rank-06, phase-11-close]
dependency_graph:
  requires: [11-05]
  provides: [routing-for-ranking, home-tile-ranking]
  affects: [frontend/src/App.tsx, frontend/src/pages/Home/Home.tsx]
tech_stack:
  added: []
  patterns: [ProtectedRoute-wrap, navItems-append]
key_files:
  created: []
  modified:
    - frontend/src/App.tsx
    - frontend/src/pages/Home/Home.tsx
decisions:
  - "Appended Ranking tile after Logros per D-D1; no CSS changes needed (grid already wraps to 6th cell)"
  - "Route placed before closing </Routes> in App.tsx, matching indentation style of all other protected routes"
  - "Auto-approved Task 3 checkpoint per autonomous_mode directive; deferred visual smoke to user before PR merge"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-30"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 2
---

# Phase 11 Plan 06: Routing + Home Tile Summary

**One-liner:** Wired `/ranking` route in `App.tsx` (ProtectedRoute-wrapped) and appended the Ranking tile (📈 Evolución de ELO) as the 6th entry in `Home.tsx` navItems, closing Phase 11.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Register /ranking route in App.tsx | 0b9b583 | frontend/src/App.tsx |
| 2 | Append Ranking tile to Home navItems | 972efcb | frontend/src/pages/Home/Home.tsx |
| 3 | Manual smoke test (auto-approved) | — | (no files) |

## Diffs Applied

### App.tsx — new import + new Route block

```diff
+ import Ranking from '@/pages/Ranking/Ranking'
```

```diff
+         <Route
+           path="/ranking"
+           element={
+             <ProtectedRoute>
+               <Ranking />
+             </ProtectedRoute>
+           }
+         />
```

### Home.tsx — 6th navItem appended after Logros

```diff
   { to: '/achievements', icon: '🏅', title: 'Logros', description: 'Catalogo de logros', disabled: false },
+  { to: '/ranking', icon: '📈', title: 'Ranking', description: 'Evolución de ELO', disabled: false },
```

## Acceptance Criteria — All Passed

| Criterion | Result |
|-----------|--------|
| `grep -c "import Ranking..." App.tsx` == 1 | PASS |
| `grep -c 'path="/ranking"' App.tsx` == 1 | PASS |
| Route wrapped in ProtectedRoute | PASS |
| `grep -c "to: '/ranking'" Home.tsx` == 1 | PASS |
| `grep -c "Evolución de ELO" Home.tsx` == 1 | PASS |
| `grep -c "icon: '📈'" Home.tsx` == 1 | PASS |
| `/ranking` entry after `/achievements` (awk ordering check) | PASS |
| `disabled: false` count >= 6 in Home.tsx | PASS (count = 6) |
| `npx tsc --noEmit` exits 0 | PASS |
| `npx vitest run` — 189 tests pass, 0 failures | PASS |

## Task 3: Auto-Approval Rationale

**Context:** Task 3 is a `checkpoint:human-verify` requiring a manual browser smoke test (steps 4-27). The user authorized autonomous execution and specified the following auto-approval protocol.

### Automated Coverage Substituting Each Manual Step

| Manual step group | Automated coverage already in place |
|-------------------|-------------------------------------|
| SC#1 / RANK-01 — tile click navigates to /ranking | Route registration verified via `grep` + tsc clean + vitest green. The route is registered, auth-gated by ProtectedRoute (same pattern as all other pages). |
| SC#3 / RANK-06 — URL state persistence (reload, new tab) | `useRankingFilters` hook fully tested in `src/test/hooks/useRankingFilters.test.ts` (Plan 03, 234 lines). Tests cover: URL clean → default, URL with `?players=` key → explicit empty, setters write URL with `replace: true`, `clearAll` produces clean URL. |
| SC#3 unknown-id drop — ghost IDs silently removed | Covered in `useRankingFilters.test.ts`: "URL with unknown ID drops + rewrites once" test case. |
| SC#6 — empty state + Limpiar filtros resets URL | `Ranking.test.tsx` (Plan 05) covers empty-state render gate. `useRankingFilters` tests cover `clearAll`. Component integration verified by 189 passing tests. |
| D-C2 — 0 players selected shows correct empty state | Covered in `Ranking.test.tsx` via "no players selected" render gate. |
| D-A6 — back-button discipline (replace mode) | Covered in `useRankingFilters.test.ts`: asserts `setSearchParams` is called with `{ replace: true }`. |
| D-B5 — mobile-first layout | CSS Modules with tokens and `flex-direction: column` mobile-first already established in Plans 04-05. No regression possible from 2-line Plan 06 changes. |

### Curl Smoke Result

Command run:
```bash
cd frontend && npm run dev &
sleep 8
curl -sS -w "\nHTTP %{http_code}\n" http://localhost:5173/ranking -m 5
```

Result:
```
<html>...</html>
HTTP 200
```

The Vite dev server served the SPA shell at `/ranking` with HTTP 200 and non-empty HTML body. React Router handles client-side routing; the 200 confirms the server is wired and the SPA shell is delivered to the browser. This is the maximum automation possible without a running browser and logged-in session.

### What the Curl Smoke Does NOT Verify

The curl smoke cannot verify:
- React Router rendering the `<Ranking />` component (client-side, requires JS execution)
- Auth redirect behavior (requires a logged-in session)
- Filter interaction, URL param persistence, chart skeleton rendering
- Mobile-first visual appearance

These require a real browser with a running backend.

## Pending Follow-Ups — User Action Required Before PR Merge

The user MUST run the full manual smoke checklist (Plan 06 Task 3, steps 4-27) in a real browser before merging the Phase 11 PR. The following require human eyes:

1. **Tile visual** (step 4-6): Confirm the Ranking tile (📈) appears last in the grid after Logros, is enabled (not greyed), and clicking navigates to `/ranking`.
2. **Filter persistence across reload** (steps 7-13): Deselect a player, set a date, hard-reload — confirm URL reconstructs the same view.
3. **New tab share** (steps 11-13): Copy URL, open new tab — confirm same selection renders.
4. **Ghost ID drop** (step 14-15): Navigate with a fake player ID in URL — confirm it's silently dropped from the address bar.
5. **Empty state + Limpiar** (steps 16-22): Set future date, confirm empty state + button; click Limpiar, confirm URL clears and defaults restore.
6. **Back-button** (steps 23-25): Apply filters, hit browser Back — confirm navigation returns to Home, not through filter history.
7. **Mobile DevTools** (steps 26-27): Switch to iPhone SE 375px — confirm vertical stacking, no horizontal scroll, 280px chart skeleton.

Resume signal for Phase 11 closure: "approved — all smoke checks pass"

## Deviations from Plan

### Structural deviation: worktree merge required

**Found during:** Pre-execution setup
**Issue:** This worktree (`worktree-agent-adbbbc129796cd340`) was branched from main (`472650d`) and did not contain the Plan 01-05 implementation work from `phase-11-ranking-context`.
**Fix:** Merged `phase-11-ranking-context` into the worktree branch before executing Plan 06 tasks. This brought in all 20+ prior plan commits (types, API, utils, hook, component, page, tests) that Plan 06 depends on.
**Impact:** None on plan output; merge was clean with no conflicts.

### Structural deviation: node_modules install required

**Found during:** Task 1 verification
**Issue:** The worktree frontend directory had no `node_modules` (symlinked repos share source but not installed packages).
**Fix:** Ran `npm install` in the worktree frontend to enable `npx tsc --noEmit` and `npx vitest run`.
**Impact:** ~15 seconds added to execution time. `node_modules` is gitignored; no tracked files affected.

## Known Stubs

None. The Plan 06 changes (2 in-file edits) introduce no stub patterns, placeholder text, or hardcoded empty values.

## Threat Flags

None. The two edits (import + route registration, navItems append) do not introduce new network endpoints, auth paths, file access patterns, or schema changes. The route is gated behind the existing `ProtectedRoute` auth wrapper.

## Self-Check: PASSED

- `frontend/src/App.tsx` modified: FOUND
- `frontend/src/pages/Home/Home.tsx` modified: FOUND
- Commit `0b9b583` (Task 1): FOUND — `feat(11-06): register /ranking route in App.tsx`
- Commit `972efcb` (Task 2): FOUND — `feat(11-06): append Ranking tile to Home navItems`
- `grep -c 'path="/ranking"' frontend/src/App.tsx` == 1: VERIFIED
- `grep -c "to: '/ranking'" frontend/src/pages/Home/Home.tsx` == 1: VERIFIED
- `npx tsc --noEmit` exits 0: VERIFIED
- `npx vitest run` 189 tests pass: VERIFIED
- Curl smoke HTTP 200: VERIFIED
