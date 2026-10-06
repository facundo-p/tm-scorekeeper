---
phase: 12-ranking-line-chart-leaderboard
reviewed: 2026-05-01T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - frontend/src/components/EloLineChart/EloLineChart.tsx
  - frontend/src/components/EloLineChart/EloLineChart.module.css
  - frontend/src/test/components/EloLineChart.test.tsx
  - frontend/src/components/EloLeaderboard/EloLeaderboard.tsx
  - frontend/src/components/EloLeaderboard/EloLeaderboard.module.css
  - frontend/src/test/components/EloLeaderboard.test.tsx
  - frontend/src/pages/Ranking/Ranking.tsx
  - frontend/src/pages/Ranking/Ranking.module.css
  - frontend/src/test/components/Ranking.test.tsx
  - frontend/src/test/setup.ts
  - frontend/package.json
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-05-01
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 12 introduces `EloLineChart`, `EloLeaderboard`, and the `Ranking` page. The implementation is generally solid: cancellation guards in `useEffect`, deterministic color hashing, correct date-string comparisons, and good table semantics. No critical issues were found.

Three warnings require attention before merge:

1. The leaderboard is passed `dataset` (raw, unfiltered data) while the chart receives `filtered` — this is a behavioral inconsistency that will cause the leaderboard to show players/rankings that the user filtered away.
2. The test suite for `EloLineChart` asserts a11y elements (`Ver datos como tabla`, table rows, ELO values) that do not exist in the component's current source — those tests will fail.
3. Column header text in `EloLeaderboard` tests does not match the rendered markup — test will fail.

---

## Warnings

### WR-01: Leaderboard ignores active filters — shows unfiltered rankings

**File:** `frontend/src/pages/Ranking/Ranking.tsx:142`

**Issue:** `EloLeaderboard` is passed `dataset` (the raw API response) instead of `filtered` (the result of applying the player and date filters). As a result, when the user narrows the chart to specific players or a date window, the leaderboard still ranks **all** players from all time. The chart and the leaderboard will be visually inconsistent: the chart may show three players for a 30-day window while the leaderboard shows all six players ranked by their all-time latest ELO.

```tsx
// current — wrong
<EloLeaderboard data={dataset} />

// fix — pass the same filtered slice the chart uses
<EloLeaderboard data={filtered} />
```

Note: if the design intent is that the leaderboard always shows the global/current ranking regardless of filters, this must be documented explicitly in the component's props or a comment, because the guard `selectedPlayers.length > 0 && totalPoints > 0` already depends on the filtered state, making the current behaviour confusing.

---

### WR-02: EloLineChart tests assert a11y table that is not implemented

**File:** `frontend/src/test/components/EloLineChart.test.tsx:32-44`

**Issue:** Three tests assert UI elements that are not present in `EloLineChart.tsx`:
- `'Ver datos como tabla'` (line 34) — no such text in the component.
- `getAllByRole('row')` with at least 4 rows (line 40) — no table is rendered.
- `getByText('1510')`, `getByText('1520')`, `getByText('1450')` (lines 41-43) — ELO values are only passed to Recharts, not rendered as DOM text.

The CSS file (`EloLineChart.module.css`) defines `.a11yDetails`, `.a11yToggle`, and `.a11yTable` classes, confirming these were planned but not yet implemented. The tests will fail as written.

**Fix:** Either implement the a11y table in `EloLineChart.tsx` (matching the CSS that is already written), or remove / skip these three tests until the feature is built. The role=img + aria-label on the wrapper alone is not sufficient for screen reader accessibility if a data table was planned.

```tsx
// skeleton to add inside EloLineChart, after </ResponsiveContainer>:
<details className={styles.a11yDetails}>
  <summary className={styles.a11yToggle}>Ver datos como tabla</summary>
  <table className={styles.a11yTable}>
    <thead>
      <tr><th>Jugador</th><th>Fecha</th><th>ELO</th></tr>
    </thead>
    <tbody>
      {data.flatMap((player) =>
        player.points.map((pt) => (
          <tr key={`${player.player_id}-${pt.game_id}`}>
            <td>{player.player_name}</td>
            <td>{pt.recorded_at}</td>
            <td>{pt.elo_after}</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</details>
```

---

### WR-03: EloLeaderboard test asserts column header text that does not match rendered markup

**File:** `frontend/src/test/components/EloLeaderboard.test.tsx:33`

**Issue:** The test expects column headers `['Posición', 'Jugador', 'ELO actual', 'Última delta']`, but `EloLeaderboard.tsx` renders `#`, `Jugador`, `ELO`, and `Últ. delta`. The test will fail on headers 1, 3, and 4.

```ts
// test expects (line 33):
expect(headers).toEqual(['Posición', 'Jugador', 'ELO actual', 'Última delta'])

// component renders (EloLeaderboard.tsx lines 74-77):
<th ...>#</th>
<th ...>Jugador</th>
<th ...>ELO</th>
<th ...>Últ. delta</th>
```

**Fix:** Either update the test to match the actual rendered text, or update the component headers to match the test's expected values. Given the test was written with more descriptive labels (`Posición`, `ELO actual`, `Última delta`), the component headers are likely the ones that should change for better accessibility.

```tsx
// recommended — more descriptive for screen readers:
<th scope="col" className={styles.colPosition}>Posición</th>
<th scope="col" className={styles.colPlayer}>Jugador</th>
<th scope="col" className={styles.colElo}>ELO actual</th>
<th scope="col" className={styles.colDelta}>Última delta</th>
```

---

## Info

### IN-01: `renderError` and `renderEmptyState` are render-prop functions violating React component conventions

**File:** `frontend/src/pages/Ranking/Ranking.tsx:15-40`

**Issue:** `renderError` and `renderEmptyState` are plain functions that return JSX, called inline as `{renderError(...)}`. Per the project rule "separar lógica y presentación" and React best practices, these should either be proper React components (`<ErrorBox />`, `<EmptyState />`) or inlined. As plain functions they bypass React's reconciler — their subtrees are always recreated on every render rather than being diffed.

**Fix:** Convert to named components:

```tsx
function ErrorBox({ onRetry }: { onRetry: () => void }) { ... }
function EmptyState({ kind, onClear }: { ... }) { ... }
// Usage:
{!isLoading && hasError && <ErrorBox onRetry={...} />}
```

---

### IN-02: Hash collision risk for player IDs with same character-code sum

**File:** `frontend/src/components/EloLineChart/EloLineChart.tsx:36-42`

**Issue:** `hashPlayerId` sums UTF-16 char codes. Two different player IDs with the same char-code sum will map to the same color. For UUID-based IDs the probability is low, but for short human-entered IDs (e.g., `'ab'` and `'ba'`) the collision is certain. The comment claims "no collisions for our short-ID space (UUIDs)" but the codebase also uses short IDs in tests (`'p1'`, `'p-alice'`). If IDs ever change to be human-readable, color collisions become a real UX problem.

**Fix:** This is acceptable for the current UUID ID space. Consider adding a note that the hash function is order-insensitive (anagram collisions) if the ID format ever changes.

---

### IN-03: `activePlayerIds` memo depends on `playersLoading` but the null-vs-array distinction may not be needed downstream

**File:** `frontend/src/pages/Ranking/Ranking.tsx:50-53`

**Issue:** `activePlayerIds` returns `null` while loading, and passes that to `useRankingFilters`. This is fine if the hook handles `null` gracefully, but it introduces a nullable type that callers must guard. The pattern is unusual; a more conventional approach is to initialize with `[]` and let the hook wait for the players load to complete via `playersLoading`.

**Fix:** Verify `useRankingFilters` documents its `null` input contract. If it does, this is fine. If not, consider passing `[]` while loading and letting the hook react to the `playersLoading` flag directly.

---

### IN-04: CSS class `.row` uses `min-height` on `<tr>` which has no effect in most browsers

**File:** `frontend/src/components/EloLeaderboard/EloLeaderboard.module.css:36-38`

**Issue:** `min-height` on table row elements (`<tr>`) is ignored by most browsers because table rows do not participate in the block formatting context. This rule has no visual effect.

```css
/* current — ineffective */
.row {
  min-height: 44px;
}
```

**Fix:** To enforce a minimum touch target height, apply `height` or `min-height` to the `<td>` cells, or use `display: block` on the row (which breaks table layout). For touch targets, the simplest fix is padding on cells:

```css
.table td {
  padding: var(--spacing-sm) var(--spacing-md);
  /* padding-top + padding-bottom already gives sufficient tap height */
}
```

---

_Reviewed: 2026-05-01_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
