import { api } from './client'
import type { PlayerEloSummaryDTO, PlayerEloHistoryDTO } from '@/types'

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
 * Fetch the full ELO history for all active players. No filter params:
 * Phase 11 D-A4 locks 100% client-side filtering. Backend `from` and
 * `player_ids` query params remain available but are not consumed.
 *
 * No caching. No retries. Per CONTEXT D-19 (load-bearing for cascade
 * correctness): a fresh fetch on every page mount.
 */
export function getEloHistory(): Promise<PlayerEloHistoryDTO[]> {
  return api.get<PlayerEloHistoryDTO[]>('/elo/history')
}
