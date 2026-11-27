---
phase: 11
plan: 01
type: execute
wave: 0
depends_on: []
files_modified:
  - frontend/src/test/setup.ts
autonomous: false
requirements: []
must_haves:
  truths:
    - "Backend GET /elo/history is live and returns the contract Phase 11 expects (PlayerEloHistoryDTO[])"
    - "Vitest setup pins process.env.TZ = 'America/Argentina/Buenos_Aires' BEFORE @testing-library/jest-dom is imported"
    - "frontend/src/test/setup.ts is wired into vitest config (it already is — verified)"
  artifacts:
    - path: "frontend/src/test/setup.ts"
      provides: "TZ-pinned vitest setup so SC#5 round-trip tests are stable across local/CI"
      contains: "process.env.TZ = 'America/Argentina/Buenos_Aires'"
  key_links:
    - from: "frontend/src/test/setup.ts"
      to: "vitest test workers"
      via: "setupFiles in frontend/vite.config.ts (already present, line 22-27)"
      pattern: "setupFiles.*setup\\.ts"
    - from: "Phase 11 frontend"
      to: "Phase 8 backend GET /elo/history"
      via: "live endpoint contract verification before plan 02 ships"
      pattern: "PlayerEloHistoryDTO\\[\\]"
---

<objective>
Pre-flight gate for Phase 11.

Two preconditions must hold before any other Phase 11 plan executes:

1. Phase 8 endpoint `GET /elo/history` MUST be live and return `PlayerEloHistoryDTO[]` matching the contract in `.planning/phases/08-backend-get-elo-history-endpoint/08-01-PLAN.md`. Phase 11 has zero fallback if Phase 8 is missing (RESEARCH §"Environment Availability" lines 800-805 marks this BLOCKING).
2. Vitest setup MUST pin `process.env.TZ = 'America/Argentina/Buenos_Aires'` BEFORE the `@testing-library/jest-dom` import so SC#5 (`YYYY-MM-DD` round-trip) is stable on any developer machine and CI (RESEARCH Pitfall A, lines 411-431).

Purpose: Without this gate, downstream plans build against a missing endpoint or fail SC#5 nondeterministically.
Output: Updated `frontend/src/test/setup.ts` with TZ pin at line 1, plus checkpoint approval that the endpoint is live.
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
@.planning/phases/08-backend-get-elo-history-endpoint/08-01-PLAN.md
@frontend/src/test/setup.ts
@frontend/vite.config.ts

<interfaces>
<!-- Existing test setup, after edit must match this exact shape. -->

Current `frontend/src/test/setup.ts` (verified 2026-04-30):
```typescript
import '@testing-library/jest-dom'

// Mock localStorage for jsdom environment
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

Vitest config (verified at `frontend/vite.config.ts` lines 22-27) already references `'./src/test/setup.ts'` in `setupFiles` — no config change needed.

Expected backend DTO shape from Phase 8 plan 01 (`08-01-PLAN.md`):
```typescript
PlayerEloHistoryDTO {
  player_id: string
  player_name: string
  points: EloHistoryPointDTO[]
}
EloHistoryPointDTO {
  recorded_at: string  // YYYY-MM-DD
  game_id: string
  elo_after: number
  delta: number
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Pin process.env.TZ in test/setup.ts</name>
  <files>frontend/src/test/setup.ts</files>
  <read_first>
    - frontend/src/test/setup.ts (current file — must NOT remove existing localStorage polyfill)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-RESEARCH.md (§Pitfall A — lines 419-431)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md (§`src/test/setup.ts` (MOD — pin TZ) — lines 746-758)
  </read_first>
  <action>
    Edit `frontend/src/test/setup.ts`. Insert exactly ONE line at the very top of the file (line 1), before the existing `import '@testing-library/jest-dom'`:

    ```typescript
    process.env.TZ = 'America/Argentina/Buenos_Aires'
    import '@testing-library/jest-dom'
    ```

    The TZ assignment MUST precede the jest-dom import (RESEARCH Pitfall A: V8 reads `process.env.TZ` once; module imports execute in order — the jest-dom import touches `Date.prototype.toLocaleString` indirectly via internal asserters in some matchers, so the env var must be set first).

    Do NOT touch the localStorage polyfill block. Do NOT add any other code. Do NOT add a setup script entry to `package.json` (RESEARCH lines 426-430 — optional, planner discretion: skip).

    Implements Phase 11 SC#5 prerequisite.
  </action>
  <verify>
    <automated>cd frontend && head -1 src/test/setup.ts | grep -q "process.env.TZ = 'America/Argentina/Buenos_Aires'" &amp;&amp; npx vitest run --reporter=basic 2>&amp;1 | tail -20</automated>
  </verify>
  <acceptance_criteria>
    - `head -1 frontend/src/test/setup.ts` outputs literally `process.env.TZ = 'America/Argentina/Buenos_Aires'`
    - `head -2 frontend/src/test/setup.ts | tail -1` outputs literally `import '@testing-library/jest-dom'`
    - The existing localStorage polyfill block is unchanged (line-for-line match against original)
    - `npx vitest run` from `frontend/` directory still passes the existing test suite (no regressions)
  </acceptance_criteria>
  <done>
    File has exactly 18 lines (was 17 — one line added at top). The full existing test suite (`npx vitest run` in `frontend/`) is green. SC#5 prerequisite satisfied.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Verify Phase 8 GET /elo/history endpoint is live</name>
  <files>(none — manual verification of external backend endpoint)</files>
  <action>See <how-to-verify> below. This is a checkpoint task; the executor pauses for the user to manually verify the live endpoint and contract per the steps in <how-to-verify>.</action>
  <what-built>
    Phase 11 depends on a live `GET /elo/history` endpoint shipped by Phase 8 (RESEARCH Open Question #1, Assumption A4 — MEDIUM risk). Plans 02–05 cannot execute against a missing endpoint. This checkpoint blocks downstream waves until the user confirms Phase 8 is shipped.
  </what-built>
  <how-to-verify>
    1. Confirm Phase 8 has shipped:
       ```bash
       git log --all --oneline | grep -iE "phase.?8|elo.?history" | head -5
       ```
       Expected: at least one commit referencing Phase 8 / elo history merged into `staging` or `main`.

    2. Start the backend locally (if not already running):
       ```bash
       cd /Users/facu/Desarrollos/Personales/tm-scorekeeper && make up   # or equivalent project command
       ```

    3. Hit the endpoint with `curl` (replace `<token>` with a valid auth token from a logged-in browser session, or skip auth if local dev mode allows):
       ```bash
       curl -sS http://localhost:8000/elo/history | jq '.[0]' 2>/dev/null
       ```
       Expected response shape (one element, abbreviated):
       ```json
       {
         "player_id": "...",
         "player_name": "...",
         "points": [
           { "recorded_at": "2026-...", "game_id": "...", "elo_after": ..., "delta": ... }
         ]
       }
       ```

    4. Field-name parity check: every key in the response MUST match the frontend DTO that Plan 02 will create:
       - `player_id` (string)
       - `player_name` (string)
       - `points` (array)
       - `points[*].recorded_at` (string, format `YYYY-MM-DD`)
       - `points[*].game_id` (string)
       - `points[*].elo_after` (integer)
       - `points[*].delta` (integer)

    5. If any field is missing or renamed (e.g. `recorded_at` is actually `recordedAt`), STOP — flag the drift and resolve in Phase 8 before continuing Phase 11. RESEARCH §Phase 9 D-13 establishes that DTO drift is treated as a Phase-8 bug, not a Phase-11 workaround.

    6. If the endpoint requires auth and returns 401, that is acceptable — log in via the SPA dev server and verify via browser DevTools Network tab instead.
  </how-to-verify>
  <resume-signal>Type "approved — endpoint live, contract matches" to unblock Wave 1, or describe the drift / missing-endpoint situation so it can be escalated.</resume-signal>
  <verify>Manual — see <how-to-verify>. No automated command applies (external service availability + contract parity).</verify>
  <done>User has confirmed in chat that GET /elo/history is live and the response contract matches PlayerEloHistoryDTO[] field-for-field. No drift escalations outstanding.</done>
</task>

</tasks>

<verification>
- `frontend/src/test/setup.ts` line 1 is the TZ pin
- `npx vitest run` is still green
- User has confirmed Phase 8 endpoint is live and contract matches `PlayerEloHistoryDTO[]`
</verification>

<success_criteria>
- TZ pin in place, no test regressions
- Phase 8 endpoint approval received from user (checkpoint task 2)
- Phase 11 unblocked to proceed with Wave 1
</success_criteria>

<output>
After completion, create `.planning/phases/11-ranking-page-skeleton-filters-url-state/11-01-SUMMARY.md` documenting:
- The exact line added to setup.ts (with line number)
- The endpoint verification result (response shape captured)
- Any drift between expected and actual DTO field names (must be zero, else escalate)
</output>
