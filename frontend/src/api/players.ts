import { api } from './client'
import type {
  PlayerResponseDTO,
  PlayerCreateDTO,
  PlayerUpdateDTO,
  PlayerCreatedResponseDTO,
  PlayerProfileDTO,
} from '@/types'

export function getPlayers(active?: boolean): Promise<PlayerResponseDTO[]> {
  const query = active == true ? `?active=${active}` : ''
  return api.get<PlayerResponseDTO[]>(`/players/${query}`)
}

export function getPlayerProfile(playerId: string): Promise<PlayerProfileDTO> {
  return api.get<PlayerProfileDTO>(`/players/${playerId}/profile`)
}

export function createPlayer(data: PlayerCreateDTO): Promise<PlayerCreatedResponseDTO> {
  return api.post<PlayerCreatedResponseDTO>('/players/', data)
}

export function updatePlayer(
  playerId: string,
  data: PlayerUpdateDTO,
): Promise<{ message: string }> {
  return api.patch<{ message: string }>(`/players/${playerId}`, data)
}
