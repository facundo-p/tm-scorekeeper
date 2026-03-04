import { api } from './client'
import type { GameDTO, GameCreatedResponseDTO, GameRecordsDTO, GameResultDTO } from '@/types'

export function createGame(data: GameDTO): Promise<GameCreatedResponseDTO> {
  return api.post<GameCreatedResponseDTO>('/games/', data)
}

export function listGames(): Promise<GameDTO[]> {
  return api.get<GameDTO[]>('/games/')
}

export function getGameResults(gameId: string): Promise<GameResultDTO> {
  return api.get<GameResultDTO>(`/games/${gameId}/results`)
}

export function getGameRecords(gameId: string): Promise<GameRecordsDTO> {
  return api.get<GameRecordsDTO>(`/games/${gameId}/records`)
}
