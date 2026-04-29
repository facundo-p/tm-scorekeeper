import { api } from './client'
import type { PlayerEloSummaryDTO } from '@/types'

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
