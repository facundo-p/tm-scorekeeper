import { api } from './client'
import type { PlayerEloSummaryDTO, EloChangeDTO, PlayerEloHistoryDTO } from '@/types'

/**
 * Fetch the ELO summary for a single player (current_elo, peak_elo,
 * last_delta, rank). Backend endpoint: GET /players/{id}/elo-summary.
 *
 * No caching, no retries — every call is a fresh fetch. Cached snapshots
 * would silently desync after a game edit/delete (which recomputes the
 * affected players' ELO history); the page would then render a stale rank
 * or peak. Callers must catch promise rejections inline so a summary
 * failure does not break the surrounding page.
 */
export function getEloSummary(playerId: string): Promise<PlayerEloSummaryDTO> {
  return api.get<PlayerEloSummaryDTO>(`/players/${playerId}/elo-summary`)
}

/**
 * Fetch the ELO changes for a single finished game (one entry per
 * participant with elo_before, elo_after, delta). Backend endpoint:
 * GET /games/{gameId}/elo.
 *
 * No caching. No retries at this layer. Per CONTEXT D-09 / D-10 the
 * retry-once policy lives in useGames.fetchEloChanges so a transient
 * failure can silently omit the ELO section of the end-of-game modal
 * without leaking to the UI.
 */
export function getEloChanges(gameId: string): Promise<EloChangeDTO[]> {
  return api.get<EloChangeDTO[]>(`/games/${gameId}/elo`)
}

/**
 * Fetch the full ELO history for all active players in one shot. We do not
 * pass `from` or `player_ids` query params on purpose — the Ranking page
 * filters the dataset entirely client-side (player count is small and the
 * full payload is cheap), trading a slightly larger payload for zero
 * round-trip latency on every filter change.
 *
 * No caching, no retries — every page mount fetches fresh. A cached payload
 * would silently desync after a game edit/delete (which recomputes ELO
 * history for affected players), making the chart show stale points. The
 * backend `from` / `player_ids` params are still defined and available if
 * a future page needs them.
 *
 * When `params.playerIds` is provided, the backend filters to those players
 * server-side (GET /elo/history?player_ids=id1,id2). Use this in single-player
 * contexts (e.g. PlayerProfile) to avoid fetching all players' histories.
 * Ranking.tsx continues to call getEloHistory() without params and filters
 * client-side for zero round-trip latency on filter changes.
 */
export function getEloHistory(params?: {
  playerIds?: string[]
}): Promise<PlayerEloHistoryDTO[]> {
  const qs = new URLSearchParams()
  if (params?.playerIds && params.playerIds.length > 0) {
    qs.set('player_ids', params.playerIds.join(','))
  }
  const query = qs.toString()
  return api.get<PlayerEloHistoryDTO[]>(query ? `/elo/history?${query}` : '/elo/history')
}
