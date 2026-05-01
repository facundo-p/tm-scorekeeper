import type { PlayerEloHistoryDTO } from '@/types'

const PLAYERS_KEY = 'players'
const FROM_KEY = 'from'
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export interface RankingFilterState {
  players: string[]
  from: string | null
}

export interface RankingParseResult extends RankingFilterState {
  /**
   * True if the URL had a `players` query key at all (even with empty value
   * `?players=`). Lets the hook distinguish "user explicitly chose empty"
   * from "user opened a clean URL" — the two trigger different defaults.
   */
  hasPlayersKey: boolean
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
    // Sort + write `players` BEFORE `from` so URLSearchParams produces a
    // deterministic key order across browsers (some implementations preserve
    // insertion order, some sort alphabetically — explicit ordering avoids
    // diff churn in shared links and test snapshots).
    out.set(PLAYERS_KEY, [...state.players].sort().join(','))
  } else if (opts?.explicitEmptyPlayers) {
    // Write `?players=` (key with empty value) so the hook can tell "user
    // deselected everything" apart from "user opened a clean URL". Without
    // this signal both states would render the all-active default.
    out.set(PLAYERS_KEY, '')
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
      // String compare on `YYYY-MM-DD` works because the format is sortable
      // by lexicographic order. Avoid `new Date(...)` here — it interprets
      // bare dates in local TZ, which can shift the cutoff by a day for
      // anyone west of UTC. The opaque-string round-trip is enforced by the
      // SC#5 test pinning TZ to America/Argentina/Buenos_Aires.
      points: fromDate === null ? p.points : p.points.filter((pt) => pt.recorded_at >= fromDate),
    }))
}
