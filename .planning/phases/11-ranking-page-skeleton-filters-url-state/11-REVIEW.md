---
phase: 11-ranking-page-skeleton-filters-url-state
reviewed: 2026-05-01T05:18:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - frontend/src/App.tsx
  - frontend/src/api/elo.ts
  - frontend/src/components/RankingFilters/RankingFilters.module.css
  - frontend/src/components/RankingFilters/RankingFilters.tsx
  - frontend/src/hooks/useRankingFilters.ts
  - frontend/src/pages/Home/Home.tsx
  - frontend/src/pages/Ranking/Ranking.module.css
  - frontend/src/pages/Ranking/Ranking.tsx
  - frontend/src/test/components/Ranking.test.tsx
  - frontend/src/test/components/RankingFilters.test.tsx
  - frontend/src/test/hooks/useRankingFilters.test.ts
  - frontend/src/test/setup.ts
  - frontend/src/test/unit/rankingFilters.test.ts
  - frontend/src/types/index.ts
  - frontend/src/utils/rankingFilters.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: needs-fixes
---

# Phase 11: Code Review Report

**Reviewed:** 2026-05-01T05:18:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** needs-fixes

## Summary

Phase 11 delivers the Ranking page skeleton, filter components, URL-state management via `useRankingFilters`, and comprehensive test coverage. The URL-state design is well thought out — the `computeResolved` / `shouldRewriteUrl` split cleanly separates display logic from mutation, the idempotency guard prevents infinite rewrite loops, and the lexicographic date comparison correctly avoids timezone pitfalls. No security vulnerabilities were found.

Two warnings require fixes before merge. The more impactful one is a genuine UX/logic bug: the "Reintentar" button silently fails to retry the players fetch when `playersError` is the cause of the error state. The second is a redundant double-filter that creates a maintenance hazard. Two info items are noted for cleanup.

---

## Warnings

### WR-01: "Reintentar" button does not retry the players fetch when `playersError` is the cause

**File:** `frontend/src/pages/Ranking/Ranking.tsx:93-106`

**Issue:** `hasError` is computed as `!!(playersError || error)` — meaning it becomes `true` when the players API call fails. The "Reintentar" button rendered in that case calls `() => setRetryCount((c) => c + 1)`, which only triggers the `getEloHistory` `useEffect` (whose dependency array is `[retryCount]`). The `usePlayers` hook's `refetch` function is available in the return value but is never destructured. As a result, if `usePlayers` fails (network error, 5xx), clicking "Reintentar" re-fetches ELO history but leaves `playersError` set permanently — the page stays in the error state with no way to recover.

**Fix:** Destructure `refetch` from `usePlayers` and include it in the retry handler:

```tsx
// Line 52-53 — add refetch:
const { players: allPlayers, loading: playersLoading, error: playersError, refetch: refetchPlayers } =
  usePlayers({ activeOnly: true })

// Line 106 — call both:
{!isLoading && hasError && renderError(() => {
  refetchPlayers()
  setRetryCount((c) => c + 1)
})}
```

---

### WR-02: Redundant `is_active` client-side filter when `activeOnly: true` already filters server-side

**File:** `frontend/src/pages/Ranking/Ranking.tsx:56-61`

**Issue:** `usePlayers({ activeOnly: true })` calls `getPlayers(true)`, which appends `?active=true` to the API request. The backend therefore returns only active players. Lines 56 and 61 then re-apply `.filter((p) => p.is_active)` on the already-filtered list. This is harmless today but creates a maintenance hazard: if the `activeOnly` option or the API contract changes, the client filter silently hides the discrepancy instead of surfacing it.

**Fix:** Remove the redundant client-side filter. Since `activeOnly: true` guarantees the response contains only active players, `allPlayers` can be used directly:

```tsx
// Line 55-58: remove .filter((p) => p.is_active)
const activePlayerIds = useMemo<string[] | null>(
  () => (playersLoading ? null : allPlayers.map((p) => p.player_id)),
  [allPlayers, playersLoading],
)

// Line 60-62: remove .filter((p) => p.is_active)
const activePlayersOptions = useMemo(
  () => allPlayers.map((p) => ({ value: p.player_id, label: p.name })),
  [allPlayers],
)
```

---

## Info

### IN-01: `ISO_DATE_RE` accepts semantically invalid dates (e.g., `9999-99-99`)

**File:** `frontend/src/utils/rankingFilters.ts:5,21`

**Issue:** The regex `/^\d{4}-\d{2}-\d{2}$/` validates the shape of a date string but not its semantic validity — it accepts strings like `2026-13-99`. Because these strings are used only for lexicographic comparison and never passed to `new Date()`, there is no runtime crash. However, a user who manually edits the URL with an out-of-range date will see the filter accepted silently.

**Fix:** Acceptable as-is given the lexicographic-only usage. If stricter validation is desired in a future iteration, add a range check after the regex:

```ts
const from =
  fromRaw && ISO_DATE_RE.test(fromRaw) && fromRaw >= '1900-01-01' && fromRaw <= '9999-12-31'
    ? fromRaw
    : null
```

This is low-priority; the `<input type="date">` browser control already constrains user input.

---

### IN-02: `RankingFilters` passes raw `e.target.value` string to `onFromDateChange` without ISO validation

**File:** `frontend/src/components/RankingFilters/RankingFilters.tsx:31`

**Issue:** The date input's `onChange` handler forwards `e.target.value` directly to `onFromDateChange`. If the browser supplies a non-ISO value (partial input, non-Chromium quirks), that raw string is written to the URL via `serializeRankingParams`, then sanitized by `ISO_DATE_RE` only on the next `parseRankingParams` call. The URL can contain an invalid `from=` value for one render cycle before self-correcting. This is self-healing and not a crash risk.

**Fix:** Low-priority. `<input type="date">` enforces ISO format in all modern browsers. If cross-browser safety is required, guard inline:

```tsx
onChange={(e) => {
  const val = e.target.value
  onFromDateChange(val === '' ? null : val)
}}
```

The current code is already doing this — the only actionable improvement would be adding the ISO regex check inside `RankingFilters` before propagating, which would prevent transient invalid URL writes. Not required for phase completion.

---

_Reviewed: 2026-05-01T05:18:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
