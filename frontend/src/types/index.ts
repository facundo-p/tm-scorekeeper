import type { MapName, Expansion, Milestone, Award, Corporation } from '@/constants/enums'

// ---- Player DTOs ----

export interface PlayerResponseDTO {
  player_id: string
  name: string
  is_active: boolean
  elo: number
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
  elo: number
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
  title: string | null
  emoji: string | null
  attributes: RecordAttributeDTO[]
}

export interface RecordComparisonDTO {
  code: string
  title: string | null
  emoji: string | null
  description: string
  achieved: boolean
  compared: RecordResultDTO | null
  current: RecordResultDTO
}

export interface GlobalRecordDTO {
  code: string
  description: string
  title: string | null
  emoji: string | null
  record: RecordResultDTO | null
}

// Achievement types

export interface AchievementUnlockedDTO {
  code: string
  title: string
  tier: number
  is_new: boolean
  is_upgrade: boolean
  icon: string | null
  fallback_icon: string
}

export interface AchievementsByPlayerDTO {
  achievements_by_player: Record<string, AchievementUnlockedDTO[]>
}

export interface ProgressDTO {
  current: number
  target: number
}

export interface PlayerAchievementDTO {
  code: string
  title: string
  description: string
  tier: number
  max_tier: number
  icon: string | null
  fallback_icon: string
  unlocked: boolean
  unlocked_at: string | null
  progress: ProgressDTO | null
}

export interface PlayerAchievementsResponseDTO {
  achievements: PlayerAchievementDTO[]
}

export interface AchievementTierInfoDTO {
  level: number
  threshold: number
  title: string
}

export interface HolderDTO {
  player_id: string
  player_name: string
  tier: number
  unlocked_at: string
}

export interface AchievementCatalogItemDTO {
  code: string
  description: string
  icon: string | null
  fallback_icon: string
  tiers: AchievementTierInfoDTO[]
  holders: HolderDTO[]
}

export interface AchievementCatalogResponseDTO {
  achievements: AchievementCatalogItemDTO[]
}

// ---- ELO DTOs ----

export interface EloChangeDTO {
  player_id: string
  player_name: string
  elo_before: number
  elo_after: number
  delta: number
}

export interface EloRankDTO {
  position: number
  total: number
}

export interface PlayerEloSummaryDTO {
  current_elo: number
  peak_elo: number | null
  last_delta: number | null
  rank: EloRankDTO | null
}
