import type { MapName, Expansion, Milestone, Award, Corporation } from '@/constants/enums'

// ---- Player DTOs ----

export interface PlayerResponseDTO {
  player_id: string
  name: string
  is_active: boolean
}

export interface PlayerCreateDTO {
  name: string
}

export interface PlayerUpdateDTO {
  name?: string
  is_active?: boolean
}

export interface PlayerCreatedResponseDTO {
  player_id: string
}

export interface PlayerStatsDTO {
  games_played: number
  games_won: number
  win_rate: number
}

export interface PlayerGameSummaryDTO {
  game_id: string
  date: string
  position: number
  points: number
}

export interface PlayerProfileDTO {
  player_id: string
  stats: PlayerStatsDTO
  games: PlayerGameSummaryDTO[]
  records: Record<string, boolean>
}

// ---- Score DTOs ----

export interface PlayerScoreDTO {
  terraform_rating: number
  milestone_points: number
  milestones: Milestone[]
  award_points: number
  card_points: number
  card_resource_points: number
  greenery_points: number
  city_points: number
  turmoil_points: number | null
}

export interface PlayerEndStatsDTO {
  mc_total: number
}

export interface PlayerResultDTO {
  player_id: string
  corporation: Corporation
  scores: PlayerScoreDTO
  end_stats: PlayerEndStatsDTO
}

// ---- Award DTOs ----

export interface AwardResultDTO {
  name: Award
  opened_by: string
  first_place: string[]
  second_place: string[]
}

// ---- Game DTOs ----

export interface GameDTO {
  id: string | null
  date: string
  map: MapName
  expansions: Expansion[]
  draft: boolean
  generations: number
  player_results: PlayerResultDTO[]
  awards: AwardResultDTO[]
}

export interface GameCreatedResponseDTO {
  id: string
  game: GameDTO
}

export interface GameListItemDTO {
  id: string
  game: GameDTO
}

// ---- Result DTOs ----

export interface GameResultPlayerDTO {
  player_id: string
  total_points: number
  mc_total: number
  position: number
  tied: boolean
}

export interface GameResultDTO {
  game_id: string
  date: string
  results: GameResultPlayerDTO[]
}

// ---- Records DTOs ----

export interface RecordAttributeDTO {
  label: string
  value: string
}

export interface RecordResultDTO {
  value: number
  attributes: RecordAttributeDTO[]
}

export interface RecordComparisonDTO {
  description: string
  achieved: boolean
  compared: RecordResultDTO | null
  current: RecordResultDTO
}

export interface GlobalRecordDTO {
  code: string
  description: string
  record: RecordResultDTO | null
}
