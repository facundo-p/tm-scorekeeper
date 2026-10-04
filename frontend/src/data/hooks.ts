// Hooks de datos de la API v2.0 (D-10). Las pantallas suman los suyos en cada fase.
import type { TableSize } from '@/ui/MesaFilter'
import { apiPath, useApiQuery } from './query'
import type { FeedItem, GameReport, HeadToHead, PlayerEloHistory, PlayerInsights, PlayerSummary, Season } from './types'

export function useFeed(options: { mesa?: TableSize | null; limit?: number } = {}) {
  const { data, ...rest } = useApiQuery<FeedItem[]>(apiPath('/feed', { player_count: options.mesa, limit: options.limit }))
  return { feed: data, ...rest }
}

export function useCurrentSeason(options: { mesa?: TableSize | null; category?: string } = {}) {
  const { data, ...rest } = useApiQuery<Season>(apiPath('/seasons/current', { player_count: options.mesa, category: options.category }))
  return { season: data, ...rest }
}

export function usePlayersList() {
  const { data, ...rest } = useApiQuery<PlayerSummary[]>('/players/')
  return { players: data, ...rest }
}

export function useGameReport(gameId: string) {
  const { data, ...rest } = useApiQuery<GameReport>(`/games/${encodeURIComponent(gameId)}/report`)
  return { report: data, ...rest }
}

export function usePlayerInsights(playerId: string, options: { mesa?: TableSize | null } = {}) {
  const { data, ...rest } = useApiQuery<PlayerInsights>(apiPath(`/players/${encodeURIComponent(playerId)}/insights`, { player_count: options.mesa }))
  return { insights: data, ...rest }
}

export function useEloHistory(options: { from?: string | null } = {}) {
  const { data, ...rest } = useApiQuery<PlayerEloHistory[]>(apiPath('/elo/history', { from: options.from }))
  return { history: data, ...rest }
}

export function useHeadToHead(options: { mesa?: TableSize | null } = {}) {
  const { data, ...rest } = useApiQuery<HeadToHead>(apiPath('/stats/head-to-head', { player_count: options.mesa }))
  return { h2h: data, ...rest }
}
