import { api } from './client'
import type { AchievementsByPlayerDTO, PlayerAchievementsResponseDTO, AchievementCatalogResponseDTO } from '@/types'

export function triggerAchievements(gameId: string): Promise<AchievementsByPlayerDTO> {
  return api.post<AchievementsByPlayerDTO>(`/games/${gameId}/achievements`, {})
}

export function getPlayerAchievements(playerId: string): Promise<PlayerAchievementsResponseDTO> {
  return api.get<PlayerAchievementsResponseDTO>(`/players/${playerId}/achievements`)
}

export function getAchievementsCatalog(): Promise<AchievementCatalogResponseDTO> {
  return api.get<AchievementCatalogResponseDTO>('/achievements/catalog')
}
