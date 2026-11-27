---
phase: 11
plan: 06
type: execute
wave: 5
depends_on: [11-05]
files_modified:
  - frontend/src/App.tsx
  - frontend/src/pages/Home/Home.tsx
autonomous: false
requirements: [RANK-01, RANK-06]
must_haves:
  truths:
    - "App.tsx has Route path='/ranking' element={<ProtectedRoute><Ranking /></ProtectedRoute>} registered"
    - "Home navItems array has a 6th entry: { to: '/ranking', icon: 'chart-emoji', title: 'Ranking', description: 'Evolución de ELO', disabled: false }"
    - "Tile is positioned AFTER the 'Logros' entry (D-D1)"
    - "Tile is enabled in Phase 11 (D-D3 — disabled: false), navigates to /ranking when clicked"
    - "Manual smoke test confirms: tile click navigates to /ranking, URL share/reload reproduces filters (SC#1, SC#3)"
  artifacts:
    - path: "frontend/src/App.tsx"
      provides: "Route registration for /ranking, wrapped in ProtectedRoute"
      contains: "path=\"/ranking\""
    - path: "frontend/src/pages/Home/Home.tsx"
      provides: "Home grid with 6th tile (Ranking — Evolución de ELO)"
      contains: "to: '/ranking'"
  key_links:
    - from: "frontend/src/App.tsx"
      to: "frontend/src/pages/Ranking/Ranking.tsx"
      via: "import + Route element wrapping"
      pattern: "import Ranking from"
    - from: "frontend/src/pages/Home/Home.tsx"
      to: "/ranking route"
      via: "navItems[5].to = '/ranking'"
      pattern: "to: '/ranking'"
---

<objective>
Wire the Ranking page into the app: register `<Route path="/ranking">` in `App.tsx` and append the Home tile to the `navItems` array. After this plan, the user can navigate from Home to `/ranking` and verify the full URL→filter→render loop in a real browser.

Why a dedicated plan: routing + Home tile are global app-config touches. Bundling with the page (Plan 05) would mix focused page rendering with cross-cutting wiring, and the smoke checkpoint at the end is the natural phase-closure gate. This plan is intentionally tiny (2 in-file edits) so the human-verify checkpoint dominates the time spent.

Closes RANK-01 (tile from Home navigates to /ranking — observable end-to-end). The smoke test also closes the manual portion of RANK-06 (URL share/reload reproduces state — only verifiable in a real browser, per VALIDATION.md §Manual-Only Verifications).

Purpose: Final wiring + manual verification gate. After this plan, Phase 11 is complete.

Output: 2 in-file edits + checkpoint approval.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-VALIDATION.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md
@frontend/src/App.tsx
@frontend/src/pages/Home/Home.tsx
@frontend/src/pages/Home/Home.module.css
@frontend/src/components/ProtectedRoute/ProtectedRoute.tsx

<interfaces>
Existing App.tsx route block (PATTERNS.md §`src/App.tsx` lines 614-638):

    <Route
      path="/players"
      element={
        <ProtectedRoute>
          <Players />
        </ProtectedRoute>
      }
    />

Existing Home.tsx navItems array (PATTERNS.md §`src/pages/Home/Home.tsx` lines 642-665):

    const navItems = [
      { to: '/players', icon: '👥', title: 'Jugadores', description: 'Gestión de jugadores', disabled: false },
      { to: '/games/new', icon: '🎯', title: 'Cargar Partida', description: 'Registrar nueva partida', disabled: false },
      { to: '/games', icon: '📋', title: 'Partidas', description: 'Historial de partidas', disabled: false },
      { to: '/records', icon: '🏆', title: 'Records', description: 'Records globales', disabled: false },
      { to: '/achievements', icon: '🏅', title: 'Logros', description: 'Catalogo de logros', disabled: false },
    ]

Per CONTEXT D-D1/D-D2/D-D3 the new entry is appended at the end (after Logros): `{ to: '/ranking', icon: '📈', title: 'Ranking', description: 'Evolución de ELO', disabled: false }`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Register /ranking route in App.tsx</name>
  <files>frontend/src/App.tsx</files>
  <read_first>
    - frontend/src/App.tsx (full file — locate import block ~line 1-15 and Routes block ~line 30-94)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md (§`src/App.tsx` (MOD) — lines 614-638)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md (D-D3 — tile must navigate to a real route in Phase 11)
  </read_first>
  <action>
    Two edits in `frontend/src/App.tsx`:

    1. Add import after the existing page imports (match the alias-style of neighbors):

           import Ranking from '@/pages/Ranking/Ranking'

    2. Add a Route block inside the existing `<Routes>` element, placed before the closing `</Routes>` tag (or before any catch-all `<Route path="*">` if one exists):

           <Route
             path="/ranking"
             element={
               <ProtectedRoute>
                 <Ranking />
               </ProtectedRoute>
             }
           />

    Do NOT touch any other route. Do NOT modify ProtectedRoute. Do NOT add a navigation guard or redirect. Match the indentation and JSX style of the surrounding routes verbatim.

    Implements RANK-01 (page accessible at /ranking, auth-gated).
  </action>
  <verify>
    <automated>cd frontend && grep -c "import Ranking from '@/pages/Ranking/Ranking'" src/App.tsx && grep -c 'path="/ranking"' src/App.tsx && npx tsc --noEmit 2>&1 | tail -5 && npx vitest run --reporter=basic 2>&1 | tail -10</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "import Ranking from '@/pages/Ranking/Ranking'" frontend/src/App.tsx` == 1
    - `grep -c 'path="/ranking"' frontend/src/App.tsx` == 1
    - `grep -B1 -A6 'path="/ranking"' frontend/src/App.tsx` shows the element wrapped in `<ProtectedRoute>` (regex match: `ProtectedRoute>\s*<Ranking`)
    - `npx tsc --noEmit` from `frontend/` exits 0
    - `npx vitest run` from `frontend/` is still fully green (no regressions in any earlier-plan test file)
  </acceptance_criteria>
  <done>Route registered, type-checks clean, full test suite still green.</done>
</task>

<task type="auto">
  <name>Task 2: Append Ranking tile to Home navItems</name>
  <files>frontend/src/pages/Home/Home.tsx</files>
  <read_first>
    - frontend/src/pages/Home/Home.tsx (lines 1-30 — locate the existing `const navItems = [...]` array)
    - frontend/src/pages/Home/Home.module.css (verify grid wraps on a 6th tile — already does per RESEARCH line 594; no CSS edit required)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md (§`src/pages/Home/Home.tsx` (MOD) — lines 642-665)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md (D-D1, D-D2 — exact tile config locked)
  </read_first>
  <action>
    Append exactly ONE entry to the `navItems` array in `frontend/src/pages/Home/Home.tsx`. Position: AFTER the existing `'/achievements'` entry (D-D1: final order Jugadores → Cargar Partida → Partidas → Records → Logros → Ranking).

    Exact entry to add (D-D2 verbatim):

        { to: '/ranking', icon: '📈', title: 'Ranking', description: 'Evolución de ELO', disabled: false },

    Do NOT extract `navItems` to a typed constant (RESEARCH Open Question #4: YAGNI — only Home reads it). Do NOT alter the surrounding render code. Do NOT touch `Home.module.css` (grid already wraps to a 6th cell per RESEARCH line 594).

    Implements RANK-01 (tile is the entry point from Home).
  </action>
  <verify>
    <automated>cd frontend && grep -c "to: '/ranking'" src/pages/Home/Home.tsx && grep -c "Evolución de ELO" src/pages/Home/Home.tsx && npx tsc --noEmit 2>&1 | tail -5 && npx vitest run --reporter=basic 2>&1 | tail -10</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "to: '/ranking'" frontend/src/pages/Home/Home.tsx` == 1
    - `grep -c "Evolución de ELO" frontend/src/pages/Home/Home.tsx` == 1
    - `grep -c "icon: '📈'" frontend/src/pages/Home/Home.tsx` == 1
    - The `'/ranking'` line appears AFTER the `'/achievements'` line (verify ordering: `awk '/to: .\/achievements./ {a=NR} /to: .\/ranking./ {r=NR} END {exit !(r > a)}' frontend/src/pages/Home/Home.tsx` exits 0)
    - `grep -c "disabled: false" frontend/src/pages/Home/Home.tsx` >= 6 (was 5; one new entry, also disabled:false per D-D3)
    - `npx tsc --noEmit` from `frontend/` exits 0
    - `npx vitest run` from `frontend/` is still fully green
  </acceptance_criteria>
  <done>Tile appended after Logros, all assertions pass, full suite green.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Manual smoke test — RANK-01 + SC#1 + SC#3 + SC#6 in real browser</name>
  <files>(none — manual verification in a real browser)</files>
  <action>See <how-to-verify> below. This is a checkpoint task; the executor pauses while the user runs the numbered smoke checklist (steps 4-27) and approves with the resume-signal phrase.</action>
  <what-built>
    Phase 11 is fully wired in code. Three behaviors are testable ONLY in a real browser (per VALIDATION.md §Manual-Only Verifications, lines 60-67):
    - SC#1 / RANK-01: Tile click on Home navigates to /ranking through React Router + ProtectedRoute auth wrapper
    - SC#3 / RANK-06: Filters apply → URL captures state → reload reproduces it → copy URL into a new tab reproduces it
    - SC#6: Empty-state CTA "Limpiar filtros" resets URL and returns the page to default
  </what-built>
  <how-to-verify>
    Run the frontend in dev mode and execute the following ordered checklist. Take notes on any drift.

    Setup:
    1. Start backend (if not running): `make up` (or whatever the project command is) — backend must serve `GET /elo/history`
    2. Start frontend: `cd frontend && npm run dev`
    3. Open http://localhost:5173 (or the port Vite reports) and log in

    SC#1 / RANK-01 — Tile navigates from Home:
    4. On Home, locate the "Ranking" tile (📈 icon, "Evolución de ELO" subtitle, last in the grid AFTER "Logros")
    5. Click the tile
    6. EXPECT: URL becomes `/ranking`; the page renders the filter bar (player MultiSelect with all active players selected by default + "Desde" date input empty + "Limpiar filtros" button) and either the chart skeleton (if there is at least one ELO history point) or the empty state if no data exists for the default selection

    SC#3 / RANK-06 — URL state persistence:
    7. Apply a filter that you can verify visually — for example, deselect one player in the MultiSelect (the URL should immediately show `?players=...` with the remaining IDs, sorted, comma-encoded as `%2C`)
    8. Set a "Desde" date that excludes some data — for example pick today (the URL should now show `?players=...&from=YYYY-MM-DD`)
    9. Hard-reload the page (Cmd-Shift-R / Ctrl-Shift-R)
    10. EXPECT: After reload, the same MultiSelect selection is shown and the same Desde date is shown — the page rebuilt itself from the URL alone
    11. Copy the URL from the address bar
    12. Open a NEW tab in the same browser session and paste the URL
    13. EXPECT: Same view renders — same selection, same Desde date

    SC#3 unknown-id drop (RANK-06):
    14. In a fresh tab, navigate to `/ranking?players=ghost-id-123,real-active-id` (substitute one real active player_id and one fake)
    15. EXPECT: Page renders only the real player as selected; URL is rewritten silently to drop the ghost ID (address bar should show `?players=real-active-id` without the ghost — happens via setSearchParams with replace, no history entry)

    SC#6 — Empty state + Limpiar filtros:
    16. Set a "Desde" date far in the future (e.g. year 2099-01-01) so that no data exists
    17. EXPECT: Page shows "Sin partidas en este rango" + a "Limpiar filtros" button (no chart skeleton)
    18. Click "Limpiar filtros"
    19. EXPECT: URL becomes `/ranking` (clean, no params); page returns to the default selection (all active players, no Desde date) and renders the chart skeleton

    Empty-state via 0 selected (D-C2):
    20. Deselect every player in the MultiSelect
    21. EXPECT: URL shows `?players=` (empty value, key present); page shows "Selecciona al menos un jugador" + "Limpiar filtros" button
    22. Click "Limpiar filtros" → returns to default

    Back-button discipline (D-A6):
    23. Apply some filter changes
    24. Click the browser Back button
    25. EXPECT: Browser navigates back to Home (or wherever you came from), NOT through intermediate filter states (each filter change uses replace mode, so no history entries are created)

    Mobile-first sanity (D-B5):
    26. Open Chrome DevTools, switch to mobile device emulation (e.g. iPhone SE 375px width)
    27. EXPECT: Filters stack vertically; chart skeleton has min-height 280px; touch targets on player chips and date input feel ≥36px; no horizontal scroll
  </how-to-verify>
  <resume-signal>
    Type "approved — all smoke checks pass" to close Phase 11. If anything fails, describe the failing case (e.g. "step 10: after reload Desde date was reset to empty") so it can be tracked as a blocker before /gsd-verify-work runs.
  </resume-signal>
  <verify>Manual — see <how-to-verify> steps 4-27. No automated command applies (real-browser routing + auth + URL persistence).</verify>
  <done>User has approved with the resume-signal phrase. All eight smoke groups (SC#1, SC#3, SC#3 unknown-id drop, SC#6, D-C2 explicit empty, D-A6 back-button, D-B5 mobile-first) verified in the live SPA against the live backend.</done>
</task>

</tasks>

<verification>
- App.tsx has the new import and the Route block, full test suite green
- Home.tsx has the 6th navItem positioned after Logros
- Manual smoke test approved by user covering SC#1, SC#3, SC#6, D-A6 (back-button), D-C2 (explicit empty)
</verification>

<success_criteria>
- All four phase requirements (RANK-01, RANK-03, RANK-04, RANK-06) demonstrably closed end-to-end
- All six phase Success Criteria #1..#6 verified (SC#5 closed in unit tests at Plan 02; SC#1, #3, #6 closed manually here; SC#2, #4 closed in component tests at Plans 04/05)
- No new runtime regressions; full vitest suite green
- Phase 11 ready for /gsd-verify-work
</success_criteria>

<output>
After completion, create `.planning/phases/11-ranking-page-skeleton-filters-url-state/11-06-SUMMARY.md` documenting:
- Diff of App.tsx (one new import line + one new Route block)
- Diff of Home.tsx (one new array entry)
- Manual smoke checklist results: tick / cross per numbered step (4-27); flag any drift
- Confirmation user approved the smoke (or escalation note if not)
</output>
