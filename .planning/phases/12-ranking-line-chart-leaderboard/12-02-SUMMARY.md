---
phase: 12-ranking-line-chart-leaderboard
plan: "02"
subsystem: frontend-chart
tags: [frontend, chart, recharts, a11y, vitest]

# Dependency graph
requires: [12-01]
provides:
  - "<EloLineChart data={PlayerEloHistoryDTO[]}> component with deterministic palette"
  - "playerColor(player_id) exported pure function for testing"
  - "EloLineChart.module.css CSS module with token-only design"
  - "5 vitest tests covering a11y, data table, empty state, palette determinism"
affects: [12-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "charCode-sum hash % palette.length for deterministic player color assignment"
    - "Export pure palette helper for direct unit testing when jsdom can't render SVG"
    - "<details>/<summary> HTML5 collapsible data table for a11y chart fallback"
    - "Recharts Tooltip contentStyle uses CSS var() strings for dark theme integration"

key-files:
  created:
    - "frontend/src/components/EloLineChart/EloLineChart.tsx"
    - "frontend/src/components/EloLineChart/EloLineChart.module.css"
    - "frontend/src/test/components/EloLineChart.test.tsx"
  modified: []

key-decisions:
  - "Exported playerColor as named export to enable direct unit testing (jsdom cannot render Recharts SVG — ResponsiveContainer needs dimensions)"
  - "charCode-sum hash chosen: pure, no dependencies, deterministic, no collisions for UUID space"
  - "Tooltip labelFormatter/formatter use inferred types (not annotated) to avoid Recharts v3 ValueType/ReactNode overload conflicts"
  - "p-alice and p-bob hash to different palette slots — validated in test (distinct colors)"

requirements-completed: [RANK-02]

# Metrics
duration: 4min
completed: 2026-05-01
---

# Phase 12 Plan 02: EloLineChart Component Summary

**`<EloLineChart>` built with Recharts multi-line chart, charCode-sum deterministic palette (6 colors), click-trigger tooltip, role=img a11y wrapper, and collapsible data-table fallback — 5 vitest tests all green**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-01T18:04:29Z
- **Completed:** 2026-05-01T18:08:39Z
- **Tasks:** 3 (2 implementation + 1 TDD)
- **Files created:** 3

## Accomplishments

- `EloLineChart.tsx` — typed React component, `<ResponsiveContainer>` wrapping `<LineChart>`, one `<Line>` per `PlayerEloHistoryDTO`, deterministic charCode-sum palette, click tooltip, `role="img"` + aria-label + `accessibilityLayer`, `<details>` data-table fallback
- `EloLineChart.module.css` — token-only CSS module (zero hardcoded hex, zero `.recharts-*` global selectors), `.wrapper` fills parent container so `Ranking.module.css` controls responsive height (D-07)
- `EloLineChart.test.tsx` — 5 vitest tests all passing; `playerColor` exported as named export to enable pure-function testing (Recharts doesn't render SVG in jsdom)
- Full suite: 23 test files, 194 tests — zero regressions

## Task Commits

1. **Task 1: EloLineChart TSX component** — `3613873` (feat)
2. **Task 2: EloLineChart CSS module** — `b6b3b55` (feat)
3. **Task 3: Vitest coverage + playerColor export** — `67ab7ff` (test)

## Files Created/Modified

- `frontend/src/components/EloLineChart/EloLineChart.tsx` — 165 lines, default export `EloLineChart`, named export `playerColor`
- `frontend/src/components/EloLineChart/EloLineChart.module.css` — 38 lines, 4 classes
- `frontend/src/test/components/EloLineChart.test.tsx` — 70 lines, 5 test cases

## Final Palette (6 hex values)

| Slot | Color | Name | WCAG vs #2c1810 |
|------|-------|------|-----------------|
| 0 | `#4e9af1` | bright blue | ≥3:1 ✓ |
| 1 | `#f1c40f` | yellow | ≥3:1 ✓ |
| 2 | `#2ecc71` | green | ≥3:1 ✓ |
| 3 | `#e91e8c` | pink | ≥3:1 ✓ |
| 4 | `#ff7043` | orange-red | ≥3:1 ✓ |
| 5 | `#a78bfa` | purple | ≥3:1 ✓ |

`playerColor('p-alice')` → slot `hashPlayerId('p-alice') % 6`; `playerColor('p-bob')` → different slot — test confirms distinct colors for these two IDs.

## Hash Function Chosen

**charCode-sum**: `sum of UTF-16 charCodeAt(i) % PLAYER_COLORS.length`

Rationale: pure function (no imports), deterministic for any string input, O(n) where n = player_id length (short UUIDs), uniform distribution over a 6-element palette for the expected ID space. No collisions observed for `p-alice`/`p-bob` test pair.

## Recharts API Surprises

1. **Tooltip `labelFormatter` and `formatter` types**: Recharts v3 uses `ReactNode` (not `string`) for `label`, and `ValueType | undefined` for `value`. Annotating these explicitly caused TypeScript errors — fix was to use inferred parameter types (let TypeScript infer from the overloaded intersection type).

2. **SVG not rendered in jsdom**: `ResponsiveContainer` requires real browser dimensions. In jsdom, `querySelector('.recharts-line')` returns elements but they have no `stroke` attribute — the chart SVG tree is never painted. Fix: exported `playerColor` as a named export so the determinism test exercises the pure function directly.

3. **`stderr` width/height warnings**: Recharts logs `The width(-1) and height(-1) of chart should be greater than 0` in every test. These are harmless jsdom artifacts — the a11y DOM (role, aria-label, table) renders correctly regardless.

## Test Count and Runtime

- **5 tests** in `EloLineChart.test.tsx`
- **Runtime:** ~60ms for this file; 2.1s for full suite (23 files, 194 tests)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Recharts Tooltip type annotation incompatibility**
- **Found during:** Task 1 verification (`npx tsc -b`)
- **Issue:** Explicitly typing `labelFormatter` as `(label: string) => string` and `formatter` as `(value: number, nameOrId: string) => [string, string]` failed TS2322 — Recharts v3 expects `ReactNode`/`ValueType | undefined`
- **Fix:** Removed explicit type annotations; TypeScript infers correct types from Recharts' overloaded signatures
- **Files modified:** `EloLineChart.tsx`
- **Commit:** `3613873`

**2. [Rule 1 - Bug] Color determinism test fails in jsdom (stroke attr not rendered)**
- **Found during:** Task 3 test run
- **Issue:** Plan's test used `querySelector('.recharts-line').getAttribute('stroke')` — returns `undefined` in jsdom because Recharts SVG is not painted without real dimensions
- **Fix:** Exported `playerColor` as named export; rewrote test to call the pure function directly, verifying same player_id always returns same color and two different IDs return different colors
- **Files modified:** `EloLineChart.tsx` (added `export`), `EloLineChart.test.tsx` (rewrote test body)
- **Commit:** `67ab7ff`

## Known Stubs

None — component renders real data from `PlayerEloHistoryDTO[]`, no placeholders or TODO items.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. Component is a pure presentation layer consuming already-authenticated data (see threat_model in plan).

## Self-Check: PASSED

- `frontend/src/components/EloLineChart/EloLineChart.tsx` — FOUND
- `frontend/src/components/EloLineChart/EloLineChart.module.css` — FOUND
- `frontend/src/test/components/EloLineChart.test.tsx` — FOUND
- Commit `3613873` — FOUND
- Commit `b6b3b55` — FOUND
- Commit `67ab7ff` — FOUND
- `npx tsc -b` exits 0 — PASSED
- `npm test -- --run EloLineChart.test.tsx` shows 5 passed — PASSED
