---
phase: 14-elo-evolution-chart-in-player-profile-stats
plan: "02"
subsystem: frontend
tags: [recharts, component-props, tdd, testing]
dependency_graph:
  requires: []
  provides:
    - EloLineChart showLegend prop (optional boolean, default true)
    - EloLineChart test suite with 6 passing tests
  affects:
    - frontend/src/components/EloLineChart/EloLineChart.tsx
    - frontend/src/test/components/EloLineChart.test.tsx
tech_stack:
  added: []
  patterns:
    - vi.hoisted() for mock variables used inside vi.mock factory
    - Mocking ResponsiveContainer+LineChart to bypass jsdom rendering gap
    - capturedChildren pattern to inspect React element tree before Recharts processes it
key_files:
  created: []
  modified:
    - frontend/src/components/EloLineChart/EloLineChart.tsx
    - frontend/src/test/components/EloLineChart.test.tsx
decisions:
  - "Used vi.hoisted() to declare mockLegend before vi.mock factory hoist — the factory runs before top-level variable initializations"
  - "Mocked both ResponsiveContainer and LineChart: ResponsiveContainer must render children (real one skips in jsdom due to 0 dimensions), LineChart captures children for inspection"
  - "capturedChildren pattern: MockLineChart stores React.Children.toArray(children); hasLegendChild() checks child.type === mockLegend — tests component JSX intent, not Recharts internals"
  - "showLegend uses positive boolean name (not hideLegend) per D-02 React convention"
metrics:
  duration_minutes: 20
  completed_date: "2026-05-02"
  tasks_completed: 2
  files_modified: 2
---

# Phase 14 Plan 02: showLegend Prop for EloLineChart Summary

**One-liner:** Added optional `showLegend?: boolean` prop (default `true`) to `EloLineChart` with 3 new test cases using a mock-children-capture strategy to work around Recharts' jsdom rendering gap.

## What Was Built

`EloLineChart` now accepts an optional `showLegend` boolean prop (default `true`). When `false`, the `<Legend />` element is omitted from the JSX tree passed to `<LineChart>`. Existing callers (`Ranking.tsx`) are unaffected — no prop means default `true`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing test for showLegend | a785e6e | EloLineChart.test.tsx |
| 1 (GREEN) | Add showLegend prop to EloLineChart | 14cfb5c | EloLineChart.tsx |
| 2 | Add full showLegend test suite | 00ca7b4 | EloLineChart.test.tsx |

## Verification

- `npx tsc --noEmit` exits 0 — TypeScript clean
- `npx vitest run src/test/components/EloLineChart.test.tsx` — 6/6 tests pass
- `showLegend?: boolean` declared in interface (line 16)
- `showLegend = true` default in destructure (line 103)
- `{showLegend && <Legend />}` guards the Legend element (line 146)
- No unguarded `<Legend />` remains

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test Strategy] Switched from DOM-query to mock-children-capture approach**

- **Found during:** Task 2
- **Issue:** `.recharts-legend-wrapper` is never rendered in jsdom (Recharts skips legend wrapper DOM output when ResponsiveContainer has 0 dimensions). This made the "renders Legend by default" positive test a false negative — the class is absent regardless of whether Legend is in the JSX.
- **Also tried:** `vi.spyOn(recharts, 'Legend')` — fails because ESM namespace exports are non-configurable (TypeError: cannot spy on a non-function value). `vi.mock` with `mockLegend` call tracking — also failed because Recharts' `LineChart` processes `<Legend />` as chart configuration before React reconciles it as a component, so `mockLegend` is never called as a function.
- **Fix:** Mock both `ResponsiveContainer` (to allow children to render in jsdom) and `LineChart` (to capture children as a React element array). `hasLegendChild()` checks `child.type === mockLegend`. This tests the component's JSX intent correctly.
- **Files modified:** `frontend/src/test/components/EloLineChart.test.tsx`
- **Commit:** 00ca7b4

**2. [Deviation from acceptance criteria] `grep -n "recharts-legend"` returns 0 matches**

- **Issue:** The plan's acceptance criteria required `grep -n "recharts-legend" ... returns at least one match`. This was written for the DOM-query strategy. The mock approach doesn't reference "recharts-legend" as a string.
- **Resolution:** The mock approach is the plan's own prescribed third-level fallback ("count `<Legend>` element invocations via `vi.spyOn`..."). The intent (verifying Legend presence/absence) is fully achieved — the implementation method differs due to jsdom constraints. All 3 behaviors are tested correctly.

## Known Stubs

None — this plan adds a prop and tests only; no UI data flow or rendering stubs introduced.

## Threat Flags

None — pure frontend prop addition, no new network endpoints or trust boundaries.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| EloLineChart.tsx modified | FOUND |
| EloLineChart.test.tsx modified | FOUND |
| 14-02-SUMMARY.md created | FOUND |
| Commit a785e6e (RED test) | FOUND |
| Commit 14cfb5c (GREEN implementation) | FOUND |
| Commit 00ca7b4 (Task 2 tests) | FOUND |
