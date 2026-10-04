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
  /** Orden de alta (D-74): la API lista por nombre; las pantallas que siguen al mockup ordenan por esto. */
  seq?: number | null
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
  scores: ScoreMap & { milestones?: string[] }
}

export interface AwardResult { name: string; opened_by: string; first_place: string[]; second_place: string[] }

export interface RecordBroken {
  code: string
  title: string
  description: string
  value: number
  player_id: string
  holders: string[]
  previous: { value: number; player_id: string; holders: string[] }
}

export interface NearRecord { code: string; title: string; gap: number; value: number; player_id: string; before: number }

export interface GameUnlock { code: string; title: string; tier: number; levels: number; max_tier: number; glyph: string; is_new: boolean }

export interface EloChange {
  player_id: string
  player_name: string
  elo_before: number
  elo_after: number
  delta: number
}

/** Informe de una partida (GET /games/{id}/report); solo lo que usa el frontend por ahora. */
export interface GameReport {
  game: { id: string; date: string; map: string; expansions: string[]; draft: boolean; generations: number; awards: AwardResult[] }
  results: ReportResult[]
  winners: string[]
  margin: number
  decided_by_mc: boolean
  elo: EloChange[]
  records_broken: RecordBroken[]
  near: NearRecord[]
  /** Por jugador, cada logro con el nivel más alto alcanzado y cuántos niveles subió en la partida. */
  achievements_by_player: Record<string, GameUnlock[]>
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

export interface FormEntry { position: number; n: number; game_id: string }

/** Fila de la clasificación (GET /ranking). */
export interface RankingRow {
  player_id: string
  name: string
  color: string
  rank: number
  elo: number
  peak: number | null
  last_delta: number | null
  games: number
  wins: number
  win_rate: number
  form: FormEntry[]
  archetype: string | null
  elo_series: { date: string; game_id: string; elo: number; delta: number }[]
}

export interface Ranking {
  view: 'all' | 'mesa'
  players: RankingRow[]
  lead_changes: { date: string; game_id: string; player_id: string | null }[]
}

export interface SplitStat { name: string; games: number; wins: number; avg: number; avg_pos: number }

/** Resumen del grupo (GET /stats/summary). */
export interface GroupSummary {
  view: 'all' | 'mesa'
  games: number
  generations: number
  avg_winner: number
  avg_generations: number
  first: string | null
  last: string | null
  top_corp: SplitStat | null
  corps_used: number
  top_map: SplitStat | null
}

/** Fila del archivo de partidas (GET /games/summaries), de la más nueva a la más vieja. */
export interface GameSummary {
  id: string
  date: string
  map: string
  expansions: string[]
  generations: number
  draft: boolean
  player_count: number
  winners: string[]
  margin: number
  decided_by_mc: boolean
  scores: { player_id: string; position: number; total_points: number; corporation: string }[]
}

export interface Seasons {
  seasons: Season[]
  champions: { number: number; end: string; player_id: string | null }[]
}
