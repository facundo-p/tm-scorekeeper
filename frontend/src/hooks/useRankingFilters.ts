import { useCallback, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseRankingParams, serializeRankingParams } from '@/utils/rankingFilters'
import type { RankingFilterState, RankingParseResult } from '@/utils/rankingFilters'

export interface UseRankingFiltersResult {
  players: string[]
  fromDate: string | null
  setPlayers: (next: string[]) => void
  setFromDate: (next: string | null) => void
  clearAll: () => void
}

type SetSearchParams = ReturnType<typeof useSearchParams>[1]

interface ResolveResult {
  /** What the page UI should display. */
  resolved: RankingFilterState
  /**
   * True when the URL needs a one-time rewrite — either to drop unknown
   * player ids (rewrite to canonical sorted form) or to clean a fully-
   * invalid `?players=...` (rewrite to no `players` key). The idempotency
   * check inside `resolveFilters` ensures `needsUrlRewrite` flips back to
   * false once the rewrite settles, breaking the classic loop:
   *   setSearchParams → searchParams change → effect re-runs → setSearchParams.
   */
  needsUrlRewrite: boolean
  /**
   * What to serialize into the URL when `needsUrlRewrite` is true. Usually
   * equals `resolved`, but differs in the empty-intersection case: the UI
   * falls back to all active players in-memory while the URL is cleaned to
   * `/ranking` (drop the dead `?players=...` entirely so a reload starts
   * fresh instead of carrying ghost ids forward).
   */
  urlState: RankingFilterState
}

/**
 * Single pass: resolves which players the page should display AND decides
 * whether the URL needs a one-time rewrite.
 *
 * Rules (applied top-to-bottom; first match wins):
 *   1. Active player list still loading (null) → render nothing yet; do NOT
 *      touch the URL (no way to intersect against an unknown set).
 *   2. URL has no `players` key at all → use all active players. This is the
 *      default state for /ranking with a clean URL; we never pollute the URL
 *      with the default selection.
 *   3. URL has `?players=` (key present, empty value) → respect the user's
 *      explicit empty selection; do NOT rewrite to default.
 *   4. URL has player ids → intersect against currently-active players:
 *      a. Empty intersection → fallback in-memory to all active AND clean
 *         the URL (drop `players` key) so reload doesn't keep retrying the
 *         dead ids.
 *      b. URL already canonical (sorted, all valid) → no rewrite.
 *      c. Some ids unknown → rewrite once to canonical sorted form.
 */
function resolveFilters(
  parsed: RankingParseResult,
  activePlayerIds: string[] | null,
): ResolveResult {
  // Rule 1: loading state.
  if (activePlayerIds === null) {
    const state: RankingFilterState = { players: [], from: parsed.from }
    return { resolved: state, needsUrlRewrite: false, urlState: state }
  }
  // Rule 2: clean URL → default to all active.
  if (!parsed.hasPlayersKey) {
    const state: RankingFilterState = { players: activePlayerIds, from: parsed.from }
    return { resolved: state, needsUrlRewrite: false, urlState: state }
  }
  // Rule 3: explicit empty selection.
  if (parsed.players.length === 0) {
    const state: RankingFilterState = { players: [], from: parsed.from }
    return { resolved: state, needsUrlRewrite: false, urlState: state }
  }
  const valid = parsed.players.filter((id) => activePlayerIds.includes(id))
  // Rule 4a: every URL id is unknown — UI falls back, URL is cleaned.
  if (valid.length === 0) {
    return {
      resolved: { players: activePlayerIds, from: parsed.from },
      needsUrlRewrite: true,
      urlState: { players: [], from: parsed.from },
    }
  }
  const canonical = [...valid].sort()
  const urlAsCanonical = [...parsed.players].sort().join(',')
  // Rule 4b: URL already canonical — no rewrite.
  if (canonical.join(',') === urlAsCanonical) {
    const state: RankingFilterState = { players: canonical, from: parsed.from }
    return { resolved: state, needsUrlRewrite: false, urlState: state }
  }
  // Rule 4c: some ids were unknown — rewrite to canonical.
  const state: RankingFilterState = { players: canonical, from: parsed.from }
  return { resolved: state, needsUrlRewrite: true, urlState: state }
}

interface FilterPatch {
  players?: string[]
  from?: string | null
  /** When players patch is `[]`, set to true to write `?players=` instead of dropping the key. */
  explicitEmptyPlayers?: boolean
}

/**
 * All filter writes share one path: merge the patch into the resolved state,
 * serialize, then write with `replace: true` so the browser back button skips
 * past intermediate filter states and lands on the page the user came from.
 *
 * Patch-style API (vs. one setter per field) avoids two latent bugs:
 *   - stale closures over the "other half" of resolved (e.g. setPlayers
 *     reading a stale fromDate),
 *   - drift between setters as new filters get added.
 */
function useApplyPatch(
  resolved: RankingFilterState,
  setSearchParams: SetSearchParams,
) {
  return useCallback((patch: FilterPatch) => {
    const next: RankingFilterState = {
      players: patch.players ?? resolved.players,
      from: patch.from !== undefined ? patch.from : resolved.from,
    }
    setSearchParams(
      serializeRankingParams(next, { explicitEmptyPlayers: patch.explicitEmptyPlayers ?? false }),
      { replace: true },
    )
  }, [resolved.players, resolved.from, setSearchParams])
}

export function useRankingFilters(activePlayerIds: string[] | null): UseRankingFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsed = useMemo(() => parseRankingParams(searchParams), [searchParams])
  const { resolved, needsUrlRewrite, urlState } = useMemo(
    () => resolveFilters(parsed, activePlayerIds),
    [parsed, activePlayerIds],
  )

  const applyPatch = useApplyPatch(resolved, setSearchParams)

  const setPlayers = useCallback(
    (next: string[]) => applyPatch({ players: next, explicitEmptyPlayers: next.length === 0 }),
    [applyPatch],
  )
  const setFromDate = useCallback(
    (next: string | null) => applyPatch({ from: next }),
    [applyPatch],
  )
  const clearAll = useCallback(
    () => setSearchParams(new URLSearchParams(), { replace: true }),
    [setSearchParams],
  )

  /**
   * One-time URL rewrite when the URL contained unknown player ids. The
   * idempotency check inside `resolveFilters` (rule 4b) ensures `needsUrlRewrite`
   * stays false after the rewrite settles, breaking the classic loop:
   *   setSearchParams → searchParams change → effect re-runs → setSearchParams.
   */
  useEffect(() => {
    if (!needsUrlRewrite) return
    setSearchParams(serializeRankingParams(urlState), { replace: true })
  }, [needsUrlRewrite, urlState, setSearchParams])

  return { players: resolved.players, fromDate: resolved.from, setPlayers, setFromDate, clearAll }
}
