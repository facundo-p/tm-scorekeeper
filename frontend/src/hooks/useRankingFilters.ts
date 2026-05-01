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

/** Pure: resolve displayed players per D-C1/D-C2/D-C3/D-A3. Never calls setSearchParams. */
function computeResolved(
  parsed: RankingParseResult,
  activePlayerIds: string[] | null,
): RankingFilterState {
  if (activePlayerIds === null) return { players: [], from: parsed.from }            // Pitfall E
  if (!parsed.hasPlayersKey) return { players: activePlayerIds, from: parsed.from }  // D-C1
  if (parsed.players.length === 0) return { players: [], from: parsed.from }         // D-C2/D-C3
  const valid = parsed.players.filter((id) => activePlayerIds.includes(id))
  if (valid.length === 0) return { players: activePlayerIds, from: parsed.from }     // D-A3 step 4
  return { players: [...valid].sort(), from: parsed.from }
}

/** Pure: decide if URL needs a one-time rewrite to drop invalid IDs (D-A3 step 3, Pitfall B). */
function shouldRewriteUrl(
  parsed: RankingParseResult,
  activePlayerIds: string[] | null,
): { rewrite: boolean; nextState: RankingFilterState | null } {
  if (activePlayerIds === null) return { rewrite: false, nextState: null }      // Pitfall E
  if (!parsed.hasPlayersKey) return { rewrite: false, nextState: null }         // D-C1 — URL clean
  if (parsed.players.length === 0) return { rewrite: false, nextState: null }   // D-C2 — explicit empty
  const valid = parsed.players.filter((id) => activePlayerIds.includes(id))
  const sortedValid = [...valid].sort().join(',')
  const sortedUrl = [...parsed.players].sort().join(',')
  if (sortedValid === sortedUrl) return { rewrite: false, nextState: null }     // idempotent guard
  return { rewrite: true, nextState: { players: valid, from: parsed.from } }
}

/** Build URL-writing setters. Each uses replace: true (D-A6). */
function useSetters(resolved: RankingFilterState, setSearchParams: SetSearchParams) {
  const setPlayers = useCallback((next: string[]) => {
    setSearchParams(
      serializeRankingParams({ players: next, from: resolved.from }, { explicitEmptyPlayers: next.length === 0 }),
      { replace: true },
    )
  }, [resolved.from, setSearchParams])

  const setFromDate = useCallback((next: string | null) => {
    setSearchParams(
      serializeRankingParams({ players: resolved.players, from: next }),
      { replace: true },
    )
  }, [resolved.players, setSearchParams])

  const clearAll = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  return { setPlayers, setFromDate, clearAll }
}

export function useRankingFilters(activePlayerIds: string[] | null): UseRankingFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsed = useMemo(() => parseRankingParams(searchParams), [searchParams])
  const resolved = useMemo(() => computeResolved(parsed, activePlayerIds), [parsed, activePlayerIds])
  const setters = useSetters(resolved, setSearchParams)

  // Idempotent URL rewrite when intersection dropped invalid IDs (D-A3 step 3, Pitfall B)
  useEffect(() => {
    const { rewrite, nextState } = shouldRewriteUrl(parsed, activePlayerIds)
    if (!rewrite || !nextState) return
    setSearchParams(serializeRankingParams(nextState), { replace: true })
  }, [parsed, activePlayerIds, setSearchParams])

  return { players: resolved.players, fromDate: resolved.from, ...setters }
}
