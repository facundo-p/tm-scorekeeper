import type { PlayerEloHistoryDTO } from '@/types'

const PLAYERS_KEY = 'players'
const FROM_KEY = 'from'
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export interface RankingFilterState {
  players: string[]
  from: string | null
}

export interface RankingParseResult extends RankingFilterState {
  hasPlayersKey: boolean   // distinguishes ?players= from key absence (D-C3)
}

export function parseRankingParams(search: URLSearchParams): RankingParseResult {
  const hasPlayersKey = search.has(PLAYERS_KEY)
  const playersRaw = search.get(PLAYERS_KEY) ?? ''
  const players = playersRaw === '' ? [] : playersRaw.split(',').filter(Boolean)
  const fromRaw = search.get(FROM_KEY)
  const from = fromRaw && ISO_DATE_RE.test(fromRaw) ? fromRaw : null
  return { players, from, hasPlayersKey }
}

export function serializeRankingParams(
  state: RankingFilterState,
  opts?: { explicitEmptyPlayers?: boolean },
): URLSearchParams {
  const out = new URLSearchParams()
  if (state.players.length > 0) {
    // Stable string-compare sort (D-A7); set PLAYERS_KEY before FROM_KEY (Pitfall D)
    out.set(PLAYERS_KEY, [...state.players].sort().join(','))
  } else if (opts?.explicitEmptyPlayers) {
    out.set(PLAYERS_KEY, '')  // ?players= explicit empty (D-C2)
  }
  if (state.from) out.set(FROM_KEY, state.from)
  return out
}

export function applyRankingFilters(
  dataset: PlayerEloHistoryDTO[],
  selectedPlayerIds: string[],
  fromDate: string | null,
): PlayerEloHistoryDTO[] {
  if (selectedPlayerIds.length === 0) return []
  return dataset
    .filter((p) => selectedPlayerIds.includes(p.player_id))
    .map((p) => ({
      ...p,
      // Lexicographic compare — NEVER new Date() (RESEARCH Pattern 4 / Pitfall A)
      points: fromDate === null ? p.points : p.points.filter((pt) => pt.recorded_at >= fromDate),
    }))
}
