import { api } from './client'
import type { GameDTO, GameCreatedResponseDTO, RecordComparisonDTO, GameResultDTO } from '@/types'

export function createGame(data: GameDTO): Promise<GameCreatedResponseDTO> {
  return api.post<GameCreatedResponseDTO>('/games/', data)
}

export function listGames(): Promise<GameDTO[]> {
  return api.get<GameDTO[]>('/games/')
}

export function getGameResults(gameId: string): Promise<GameResultDTO> {
  return api.get<GameResultDTO>(`/games/${gameId}/results`)
}

export function getGameRecords(gameId: string): Promise<RecordComparisonDTO[]> {
  return api.get<RecordComparisonDTO[]>(`/games/${gameId}/records`)
}
