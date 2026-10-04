// Hooks de datos de la API v2.0 (D-10). Las pantallas suman los suyos en cada fase.
import type { TableSize } from '@/ui/MesaFilter'
import { apiPath, useApiQuery } from './query'
import type {
  FeedItem, GameReport, GameSummary, GroupSummary, HeadToHead, PlayerEloHistory, PlayerInsights, PlayerSummary, Ranking, Season, Seasons,
} from './types'

export function useFeed(options: { mesa?: TableSize | null; limit?: number } = {}) {
  const { data, ...rest } = useApiQuery<FeedItem[]>(apiPath('/feed', { player_count: options.mesa, limit: options.limit }))
  return { feed: data, ...rest }
}

export function useCurrentSeason(options: { mesa?: TableSize | null; category?: string } = {}) {
  const { data, ...rest } = useApiQuery<Season>(apiPath('/seasons/current', { player_count: options.mesa, category: options.category }), true, true)
  return { season: data, ...rest }
}

export function usePlayersList() {
  const { data, ...rest } = useApiQuery<PlayerSummary[]>('/players/')
  return { players: data, ...rest }
}

export function useGameReport(gameId: string, enabled = true) {
  const { data, ...rest } = useApiQuery<GameReport>(`/games/${encodeURIComponent(gameId)}/report`, enabled)
  return { report: data, ...rest }
}

export function usePlayerInsights(playerId: string, options: { mesa?: TableSize | null; enabled?: boolean } = {}) {
  const path = apiPath(`/players/${encodeURIComponent(playerId)}/insights`, { player_count: options.mesa })
  const { data, ...rest } = useApiQuery<PlayerInsights>(path, options.enabled ?? true, true)
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

export function useRanking(options: { mesa?: TableSize | null; from?: string | null } = {}) {
  const { data, ...rest } = useApiQuery<Ranking>(apiPath('/ranking', { player_count: options.mesa, from: options.from }))
  return { ranking: data, ...rest }
}

export function useGroupSummary(options: { mesa?: TableSize | null } = {}) {
  const { data, ...rest } = useApiQuery<GroupSummary>(apiPath('/stats/summary', { player_count: options.mesa }))
  return { summary: data, ...rest }
}

export function useGameSummaries(options: { mesa?: TableSize | null } = {}) {
  const { data, ...rest } = useApiQuery<GameSummary[]>(apiPath('/games/summaries', { player_count: options.mesa }))
  return { games: data, ...rest }
}

export function useSeasons() {
  const { data, ...rest } = useApiQuery<Seasons>('/seasons')
  return { seasons: data, ...rest }
}
