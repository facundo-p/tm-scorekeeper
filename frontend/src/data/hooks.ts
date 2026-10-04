// Hooks de datos de la API v2.0 (D-10). Las pantallas suman los suyos en cada fase.
import type { TableSize } from '@/ui/MesaFilter'
import { apiPath, useApiQuery } from './query'
import type { FeedItem, PlayerSummary, Season } from './types'

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
