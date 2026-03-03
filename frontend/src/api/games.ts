import { api } from './client'
import type { GameDTO, GameCreatedResponseDTO, GameRecordsDTO } from '@/types'

export function createGame(data: GameDTO): Promise<GameCreatedResponseDTO> {
  return api.post<GameCreatedResponseDTO>('/games/', data)
}

export function getGameRecords(gameId: string): Promise<GameRecordsDTO> {
  return api.get<GameRecordsDTO>(`/games/${gameId}/records`)
}
