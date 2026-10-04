// Hooks de datos de la API v2.0 (D-10). Las pantallas suman los suyos en cada fase.
import type { TableSize } from '@/ui/MesaFilter'
import { apiPath, useApiQuery } from './query'
import type {
  CatalogAchievement, FeedItem, GameReport, GameSummary, GroupRecord, GroupSummary, HeadToHead, PlayerAchievement, PlayerEloHistory,
  PlayerInsights, PlayerSummary, Ranking, Season, Seasons,
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
  const own = `/players/${encodeURIComponent(playerId)}/`
  const { data, ...rest } = useApiQuery<PlayerInsights>(apiPath(`${own}insights`, { player_count: options.mesa }), options.enabled ?? true, own)
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

/** Subconjunto de partidas del archivo (STAT-01): mesa, mapa y expansión. */
export interface SubsetOptions { mesa?: TableSize | null; map?: string | null; expansion?: string | null }
const subsetQuery = (o: SubsetOptions) => ({ player_count: o.mesa, map: o.map, expansion: o.expansion })

export function useGameSummaries(options: SubsetOptions = {}) {
  const { data, ...rest } = useApiQuery<GameSummary[]>(apiPath('/games/summaries', subsetQuery(options)), true, true)
  return { games: data, ...rest }
}

export function useSeasons() {
  const { data, ...rest } = useApiQuery<Seasons>('/seasons')
  return { seasons: data, ...rest }
}

export function usePlayerAchievements(playerId: string, options: { mesa?: TableSize | null; enabled?: boolean } = {}) {
  const own = `/players/${encodeURIComponent(playerId)}/`
  const path = apiPath(`${own}achievements`, { player_count: options.mesa })
  const { data, ...rest } = useApiQuery<{ achievements: PlayerAchievement[] }>(path, options.enabled ?? true, own)
  return { achievements: data?.achievements, ...rest }
}

export function useAchievementCatalog(options: { mesa?: TableSize | null } = {}) {
  const { data, ...rest } = useApiQuery<{ achievements: CatalogAchievement[] }>(apiPath('/achievements/catalog', { player_count: options.mesa }))
  return { catalog: data?.achievements, ...rest }
}

export function useRecords(options: SubsetOptions = {}) {
  const { data, ...rest } = useApiQuery<GroupRecord[]>(apiPath('/records', subsetQuery(options)), true, true)
  return { records: data, ...rest }
}
