---
phase: 10
plan: "02"
subsystem: frontend
tags: [modal, elo, achievements, records, component, tests]
dependency_graph:
  requires:
    - "frontend/src/components/Modal/Modal.tsx"
    - "frontend/src/components/RecordsSection/RecordsSection.tsx"
    - "frontend/src/components/AchievementBadgeMini/AchievementBadgeMini.tsx"
    - "frontend/src/components/Spinner/Spinner.tsx"
    - "frontend/src/components/Button/Button.tsx"
    - "frontend/src/types/index.ts (GameResultDTO, EloChangeDTO, AchievementsByPlayerDTO)"
  provides:
    - "EndOfGameSummaryModal: unified post-game summary surface with 4 sections"
    - "ResultsSection: ranking display with position/name/pts/MC grid"
    - "AchievementsSection: per-player badge groups with empty state"
    - "EloSection: elo_before→elo_after per player joined by player_id with delta classes"
  affects:
    - "Plan 10-03: wires EndOfGameSummaryModal into GameRecords.tsx replacing AchievementModal"
tech_stack:
  added: []
  patterns:
    - "CSS Module scoped classes for delta color-coding (deltaPositive/Negative/Zero)"
    - "player_id join: result.results × EloChangeDTO[] via Map lookup"
    - "formatDelta/deltaClass utilities copied from EloSummaryCard pattern"
key_files:
  created:
    - "frontend/src/components/EndOfGameSummaryModal/EndOfGameSummaryModal.tsx"
    - "frontend/src/components/EndOfGameSummaryModal/EndOfGameSummaryModal.module.css"
    - "frontend/src/components/EndOfGameSummaryModal/ResultsSection.tsx"
    - "frontend/src/components/EndOfGameSummaryModal/AchievementsSection.tsx"
    - "frontend/src/components/EndOfGameSummaryModal/EloSection.tsx"
    - "frontend/src/test/components/EndOfGameSummaryModal.test.tsx"
  modified: []
decisions:
  - "EloSection shows Spinner (with heading) when eloChanges is null (both inputs needed for join), returns null entirely when eloChanges is empty array (legacy game omission)"
  - "Records empty state handled at modal level ('Ningún record nuevo en esta partida.') to avoid modifying RecordsSection which has different copy"
  - "Test fixes: #1/#2 positions appear in both ResultsSection and EloSection — used getAllByText; Alice name appears in both sections — used section-scoped querySelector"
metrics:
  duration_minutes: 3
  completed_date: "2026-04-29"
  tasks_completed: 3
  files_created: 6
  files_modified: 0
---

# Phase 10 Plan 02: EndOfGameSummaryModal Component + Tests Summary

**One-liner:** New `EndOfGameSummaryModal` with 4 fixed-order sections (Resultados, Records, Logros, ELO), ELO rows joined by `player_id` with `elo_before → elo_after` and CSS-classed signed delta, covered by 17 passing tests.

## What Was Built

### Components created

- **`EndOfGameSummaryModal.tsx`** — Top-level modal wrapping `Modal` base. Composes 4 sections in fixed order: Resultados, Records, Logros, ELO. Handles the "no achieved records" empty state wrapper at this level. Footer has `Button` with text "Continuar" that calls `onClose`.

- **`ResultsSection.tsx`** — Renders `GameResultDTO.results` as a grid list (position / name / pts / MC). Shows `Spinner` when `result` is null. First-place row receives `.firstPlace` modifier class.

- **`AchievementsSection.tsx`** — Renders per-player `AchievementBadgeMini` groups, filtering players with empty arrays. Shows `Spinner` when `achievements` is null. Shows "Ningún logro desbloqueado." when all arrays are empty.

- **`EloSection.tsx`** — Renders ELO rows joined from `GameResultDTO.results` × `EloChangeDTO[]` by `player_id`. Position `#N` derived from `result.results[].position` (POST-03). Shows `Spinner` with heading when either input is null. Returns `null` entirely (section omitted) when `eloChanges` is empty array (legacy game Pitfall 5). Delta formatted via `formatDelta()` and colored via `deltaClass()` using CSS Module classes.

- **`EndOfGameSummaryModal.module.css`** — Scoped CSS module with section structure, result row grid, ELO row grid, delta color classes (`.deltaPositive`, `.deltaNegative`, `.deltaZero`), achievements player group styles, and footer layout.

### Tests created

- **`EndOfGameSummaryModal.test.tsx`** — 17 tests across 5 describe blocks:
  - POST-01: modal title, 4-section order assertion, Continuar callback
  - POST-02: ELO row content, delta CSS classes, null/empty guards
  - POST-03: position-by-player_id join with reordered input
  - D-04 empty states: "Ningún record nuevo" and "Ningún logro desbloqueado"
  - Resultados visuals: firstPlace class, pts/MC rendering

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate element queries in test data**
- **Found during:** Task 3 (test run)
- **Issue:** Both `ResultsSection` and `EloSection` render `#1`/`#2` position spans and player name "Alice"/"Bob". Using `getByText(/#1/)` and `getByText('Alice')` threw "Found multiple elements" errors.
- **Fix:** Changed `getByText(/#1/)` → `getAllByText(/#1/).length >= 1`; changed `getByText('Alice').closest('div')` → section-scoped `querySelector('[class*="resultPlayerName"]').closest('div')` within the Resultados section heading's parent.
- **Files modified:** `frontend/src/test/components/EndOfGameSummaryModal.test.tsx`
- **Commit:** 756106a

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All string rendering uses JSX text interpolation (React escapes by default). No `dangerouslySetInnerHTML` in any component in this directory.

T-10-04 (XSS via player_name): mitigated — all player names render via `{elo.player_name}` JSX text nodes.

## Self-Check

### Files exist

- `frontend/src/components/EndOfGameSummaryModal/EndOfGameSummaryModal.tsx` — FOUND
- `frontend/src/components/EndOfGameSummaryModal/EndOfGameSummaryModal.module.css` — FOUND
- `frontend/src/components/EndOfGameSummaryModal/ResultsSection.tsx` — FOUND
- `frontend/src/components/EndOfGameSummaryModal/AchievementsSection.tsx` — FOUND
- `frontend/src/components/EndOfGameSummaryModal/EloSection.tsx` — FOUND
- `frontend/src/test/components/EndOfGameSummaryModal.test.tsx` — FOUND

### Commits exist

- `9a8c35d` feat(10-02): scaffold EndOfGameSummaryModal — FOUND
- `45c074f` feat(10-02): implement EloSection — FOUND
- `756106a` test(10-02): add EndOfGameSummaryModal tests — FOUND

### Tests

- 17/17 tests pass (`npm test -- --run EndOfGameSummaryModal`)
- TypeScript: `tsc --noEmit` exits 0

## Self-Check: PASSED
