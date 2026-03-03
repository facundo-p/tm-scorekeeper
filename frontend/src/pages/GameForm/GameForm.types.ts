import type { MapName, Expansion, Milestone, Award, Corporation } from '@/constants/enums'

export interface AwardEntry {
  name: Award | ''
  opened_by: string
  first_place: string[]
  second_place: string[]
}

export interface MilestoneEntry {
  milestone: Milestone
  claimed: boolean
  player_id: string
}

export interface PlayerFormData {
  player_id: string
  name: string
  corporation: Corporation | ''
  terraform_rating: number
  card_resource_points: number
  card_points: number
  greenery_points: number
  city_points: number
  turmoil_points: number | null
}

export interface GameFormState {
  date: string
  map: MapName | ''
  expansions: Expansion[]
  draft: boolean
  generations: number
  selectedPlayerIds: string[]
  players: PlayerFormData[]
  awards: AwardEntry[]
  milestones: MilestoneEntry[]
}

export const INITIAL_PLAYER_DATA: Omit<PlayerFormData, 'player_id' | 'name'> = {
  corporation: '',
  terraform_rating: 20,
  card_resource_points: 0,
  card_points: 0,
  greenery_points: 0,
  city_points: 0,
  turmoil_points: null,
}

export const INITIAL_GAME_STATE: GameFormState = {
  date: new Date().toISOString().split('T')[0],
  map: '',
  expansions: [],
  draft: false,
  generations: 1,
  selectedPlayerIds: [],
  players: [],
  awards: [],
  milestones: [],
}
