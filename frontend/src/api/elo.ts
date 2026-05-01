import { api } from './client'
import type { PlayerEloSummaryDTO, PlayerEloHistoryDTO } from '@/types'

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
 */
export function getEloHistory(): Promise<PlayerEloHistoryDTO[]> {
  return api.get<PlayerEloHistoryDTO[]>('/elo/history')
}
