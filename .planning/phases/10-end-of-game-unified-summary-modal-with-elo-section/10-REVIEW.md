---
phase: 10-end-of-game-unified-summary-modal-with-elo-section
reviewed: 2026-04-29T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - frontend/src/api/elo.ts
  - frontend/src/hooks/useGames.ts
  - frontend/src/test/hooks/useGames.test.ts
  - frontend/src/components/EndOfGameSummaryModal/EndOfGameSummaryModal.tsx
  - frontend/src/components/EndOfGameSummaryModal/EndOfGameSummaryModal.module.css
  - frontend/src/components/EndOfGameSummaryModal/ResultsSection.tsx
  - frontend/src/components/EndOfGameSummaryModal/EloSection.tsx
  - frontend/src/components/EndOfGameSummaryModal/AchievementsSection.tsx
  - frontend/src/test/components/EndOfGameSummaryModal.test.tsx
  - frontend/src/pages/GameRecords/GameRecords.tsx
  - frontend/src/pages/GameRecords/GameRecords.module.css
  - frontend/src/test/components/GameRecords.test.tsx
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-29
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Phase 10 delivers the unified end-of-game summary modal with an ELO section added alongside the existing Results, Records, and Achievements sections. The overall architecture is solid: the component tree is well-decomposed, CSS variables are used throughout (no inline styles), retry logic is correctly implemented with silent failure as the design intent, and the test coverage is thorough and well-structured.

Four warnings and three info items were found. The most significant warning is a stale-closure bug in `GameRecords` where `fetchAchievements` and `fetchEloChanges` are omitted from the `useEffect` dependency array — this is harmless in practice today (the functions are stable `useCallback` references) but is a lint violation that could silently break under future refactors. Two other warnings relate to a redundant catch branch in `GameRecords`, a non-null assertion on an already-narrowed value, and a CSS class that is defined but never referenced. The info items are minor: a comment typo and two cosmetic issues in tests.

---

## Warnings

### WR-01: Missing `useEffect` dependency array entries for `fetchAchievements` and `fetchEloChanges`

**File:** `frontend/src/pages/GameRecords/GameRecords.tsx:59`

**Issue:** The `useEffect` dependency array is `[gameId]` but the effect body calls `fetchAchievements` and `fetchEloChanges`. Both come from `useGames()` and are stable `useCallback` refs today, so this does not cause an observable bug right now. However, the ESLint `react-hooks/exhaustive-deps` rule will flag this, and any future change that makes those functions non-stable (e.g., adding state deps to `useGames`) would silently stop re-running the effect.

**Fix:**
```tsx
// Option A — add to deps (recommended, exhaustive-deps compliant)
}, [gameId, fetchAchievements, fetchEloChanges])

// Option B — if the functions are guaranteed stable and you want to suppress the warning intentionally:
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [gameId])
```

---

### WR-02: Redundant `else setNotAvailable(true)` branch — both branches do the same thing

**File:** `frontend/src/pages/GameRecords/GameRecords.tsx:37-40`

**Issue:** The error handler for `getGameRecords` checks `err instanceof ApiError && err.status === 404` and calls `setNotAvailable(true)`, then the `else` branch also calls `setNotAvailable(true)`. The intended logic is likely to treat a 404 differently from other errors (e.g., set a different message or state), but as written both paths are identical, making the `if`/`else` dead code. This is a logic error — either the `else` should handle the non-404 case differently (e.g., set a generic error state), or the conditional should be removed entirely.

```tsx
// Current (both branches identical — else is dead code):
.catch((err) => {
  if (err instanceof ApiError && err.status === 404) setNotAvailable(true)
  else setNotAvailable(true)
})

// Fix A — remove the dead branch if truly no distinction is wanted:
.catch(() => setNotAvailable(true))

// Fix B — if a distinct error state is wanted for non-404 errors:
.catch((err) => {
  if (err instanceof ApiError && err.status === 404) setNotAvailable(true)
  else setLoadError(true)  // requires a new state slice
})
```

---

### WR-03: Non-null assertion on a value already narrowed by the surrounding condition

**File:** `frontend/src/components/EndOfGameSummaryModal/EndOfGameSummaryModal.tsx:37`

**Issue:** The expression `records!.filter(...)` uses a non-null assertion on `records` even though `hasRecordsData` on the line above already guards with `records !== null`. TypeScript should be able to narrow `records` to non-null inside the ternary condition without the `!`. The assertion is harmless but is a code smell — it hides the narrowing and can mislead future readers into thinking the guard is insufficient.

```tsx
// Current:
const hasRecordsData = records !== null && !loadingRecords && !notAvailable
const noAchievedRecords = hasRecordsData && records!.filter((r) => r.achieved).length === 0

// Fix — extract the filtered count inside the already-narrowed scope, or cast via type narrowing:
const noAchievedRecords =
  records !== null && !loadingRecords && !notAvailable &&
  records.filter((r) => r.achieved).length === 0
```

---

### WR-04: Unused CSS class `.subtitle` defined in `GameRecords.module.css`

**File:** `frontend/src/pages/GameRecords/GameRecords.module.css:37-39`

**Issue:** The `.subtitle` class is defined in the stylesheet but is not referenced in `GameRecords.tsx` or in any test. Dead CSS classes create maintenance overhead — if the rule is updated it is unclear whether it has any effect.

**Fix:** Remove the `.subtitle` rule from the stylesheet, or add the `subtitle` class to a `<p>` element in `GameRecords.tsx` where subtitle text would appear (if intentionally reserved for future use, add a comment).

---

## Info

### IN-01: Wrong design-decision reference label in `useGames.ts` comment

**File:** `frontend/src/hooks/useGames.ts:103`

**Issue:** The inline comment on the retry block for `fetchEloChanges` reads `// D-10: one retry` but the retry-once policy is documented as D-09 for achievements. For ELO changes the same retry policy applies, but the comment mixes D-04 and D-10 labels (`// D-04 / D-10: silent failure` at line 107). Consistency with `fetchAchievements`'s comment (`// D-09: one retry`) would make the relationship clearer. Minor, but can cause confusion when cross-referencing the design docs.

**Fix:** Align the comment to whichever decision code covers the ELO retry policy:
```ts
// D-09 / D-10: one retry — matches achievements retry contract
```

---

### IN-02: Test description in `EndOfGameSummaryModal.test.tsx` asserts incorrect section order

**File:** `frontend/src/test/components/EndOfGameSummaryModal.test.tsx:81-89`

**Issue:** The test description and assertion at line 81 says sections appear in order `Resultados, Records, Logros, ELO`, and the `indexOf` checks enforce `Records < Logros < ELO`. However, the actual rendered order in `EndOfGameSummaryModal.tsx` is: Resultados → ELO → Records → Logros (ELO is rendered second, between ResultsSection and the Records section). The `arrayContaining` assertion will pass regardless of order, and the `indexOf` checks only verify `Records < Logros < ELO` but not that ELO comes before Records — so the test does not actually catch the real order. The description is therefore misleading.

**Fix:** Update the test description and add the missing order assertion:
```ts
it('renders all 4 section headings in order: Resultados, ELO, Records, Logros', () => {
  // ...
  expect(indexOf('Resultados')).toBeLessThan(indexOf('ELO'))
  expect(indexOf('ELO')).toBeLessThan(indexOf('Records'))
  expect(indexOf('Records')).toBeLessThan(indexOf('Logros'))
})
```

---

### IN-03: `AchievementsSection` shows a spinner when `achievements` is `null`, but `null` is also the permanent "fetch failed" state

**File:** `frontend/src/components/EndOfGameSummaryModal/AchievementsSection.tsx:12`

**Issue:** The component returns `<Spinner />` whenever `achievements === null`. `null` has two distinct meanings in `GameRecords.tsx`: (a) the fetch is still in-flight, and (b) the fetch failed after retry exhaustion (the hook returns `null` on failure and the parent state is never updated from `null`). In the failure case the spinner will spin indefinitely with no error message shown, which is inconsistent with the ELO section's behavior (which silently omits the section on `null`). This is a UX inconsistency rather than a crash bug.

**Fix (two options):**

Option A — distinguish loading vs. failure by using a separate `loadingAchievements` boolean prop (consistent with how `loadingRecords` is handled):
```tsx
// Parent: track loading state separately
const [loadingAchievements, setLoadingAchievements] = useState(true)
fetchAchievements(gameId).then((data) => {
  setAchievements(data)
  setLoadingAchievements(false)
})

// AchievementsSection:
if (loading) return <Spinner />
if (!achievements) return <p className={styles.emptyState}>No se pudieron cargar los logros.</p>
```

Option B — omit the section entirely on failure (same pattern as ELO):
```tsx
if (!achievements) return null
```

---

_Reviewed: 2026-04-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
