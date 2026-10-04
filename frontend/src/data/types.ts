// Formas de la API v2.0 que consume el frontend nuevo (backend/schemas/*).

export interface FeedItem {
  date: string
  type: 'season' | 'record' | 'achievement' | 'game'
  game_id?: string | null
  player_id?: string | null
  code?: string | null
  level?: number | null
  text: string
}

export interface RaceRow {
  player_id: string
  games: number
  avg: number
  best: number
}

export interface SeasonRace {
  category: string
  games: number
  qualified: RaceRow[]
  pending: (RaceRow & { missing: number })[]
}

export interface Season {
  number: number
  start: string
  end: string | null
  games: string[]
  temp: number
  oxygen: number
  oceans: number
  temperature: number
  oxygen_pct: number
  ocean_count: number
  pct: number
  race: SeasonRace
  champion: string | null
}

export interface PlayerSummary {
  player_id: string
  name: string
  is_active: boolean
  elo: number
  color: string
  since: string | null
}
