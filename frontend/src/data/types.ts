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

export type ScoreMap = Partial<Record<
  'terraform_rating' | 'award_points' | 'milestone_points' | 'card_resource_points' | 'card_points' | 'greenery_points' | 'city_points' | 'turmoil_points',
  number | null
>>

export interface ReportResult {
  player_id: string
  player_name: string
  corporation: string
  position: number
  tied: boolean
  total_points: number
  mc_total: number
  scores: ScoreMap
}

export interface EloChange {
  player_id: string
  player_name: string
  elo_before: number
  elo_after: number
  delta: number
}

/** Informe de una partida (GET /games/{id}/report); solo lo que usa el frontend por ahora. */
export interface GameReport {
  game: { id: string; date: string; map_name: string; expansions: string[]; generations: number }
  results: ReportResult[]
  winners: string[]
  margin: number
  decided_by_mc: boolean
  elo: EloChange[]
}

export interface PlayerEloHistory {
  player_id: string
  player_name: string
  points: { recorded_at: string; game_id: string; elo_after: number; delta: number }[]
}

/** Ficha del jugador (GET /players/{id}/insights); por ahora, composición y forma. */
export interface PlayerInsights {
  view: 'all' | 'mesa'
  games: number
  composition: { avg: Record<string, number>; share: Record<string, number> }
  form: { position: number; n: number; game_id: string }[]
}

export interface HeadToHead {
  view: 'all' | 'mesa'
  matrix: Record<string, Record<string, { games: number; ahead: number; behind: number; even: number }>>
}
