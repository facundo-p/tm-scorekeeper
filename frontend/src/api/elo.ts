import { api } from './client'
import type { PlayerEloSummaryDTO, EloChangeDTO } from '@/types'

/**
 * Fetch the ELO summary for a single player (current_elo, peak_elo,
 * last_delta, rank). Backend endpoint: GET /players/{id}/elo-summary.
 *
 * No caching. No retries. Per CONTEXT D-19 (load-bearing for cascade
 * correctness): callers must catch the promise rejection inline so a
 * summary failure does not break the parent page.
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
