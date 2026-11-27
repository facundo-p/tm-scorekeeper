// Datos que dibujan los instrumentos, ya resueltos (jugador con nombre y color). Las pantallas
// los arman desde la API; los instrumentos no buscan nada por su cuenta.
import type { PlayerLike } from '@/ui/atoms'

export type ScoreKey =
  | 'terraform_rating' | 'award_points' | 'milestone_points' | 'card_resource_points'
  | 'card_points' | 'greenery_points' | 'city_points' | 'turmoil_points'

export interface ResultRow {
  player: PlayerLike
  position: number
  total: number
  /** M€ al final (desempate). */
  mc: number
  scores: Partial<Record<ScoreKey, number | null>>
}

/** Una partida, en el orden de posiciones del informe. */
export interface ScoredGame {
  expansions: string[]
  results: ResultRow[]
}

export interface EloShiftRow {
  player: PlayerLike
  before: number
  after: number
  delta: number
}

export interface EloPoint {
  date: string
  elo: number
}

export interface EloSeries {
  player: PlayerLike
  points: EloPoint[]
}

export interface FormCell {
  position: number
  n: number
}

export interface H2HCell {
  games: number
  ahead: number
}

/** `matrix[a][b]`: partidas juntas y cuántas terminó `a` delante de `b`. */
export type H2HMatrixData = Record<string, Record<string, H2HCell>>
