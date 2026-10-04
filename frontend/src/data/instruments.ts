// De la API a los datos que dibujan los instrumentos (ui/instruments): jugador con nombre y color.
import type { EloSeries, EloShiftRow, ResultRow, ScoredGame } from '@/ui/instruments'
import type { PlayerLike } from '@/ui/atoms'
import type { GameReport, GameSummary, PlayerEloHistory, PlayerSummary } from './types'

export type PlayerIndex = Map<string, PlayerLike>

/** Jugadores en orden de alta (D-74), como `PLAYERS_SEED` en el mockup. */
export const bySignup = (players: PlayerSummary[]) => players.slice().sort((a, b) => (a.seq ?? Infinity) - (b.seq ?? Infinity))

export const playerIndex = (players: PlayerSummary[]): PlayerIndex =>
  new Map(players.map((p) => [p.player_id, { id: p.player_id, name: p.name, color: p.color }]))

/** Jugador del índice; si no está (por ejemplo, borrado), uno gris con el nombre que vino. */
const who = (index: PlayerIndex, id: string, name: string): PlayerLike => index.get(id) ?? { id, name, color: 'gris' }

export function scoredGame(report: GameReport, index: PlayerIndex): ScoredGame {
  const results: ResultRow[] = report.results.map((r) => ({
    player: who(index, r.player_id, r.player_name), position: r.position, total: r.total_points, mc: r.mc_total, scores: r.scores,
  }))
  return { expansions: report.game.expansions, results }
}

/** Cambios de ELO en el orden de posiciones de la partida. */
export function eloShift(report: GameReport, index: PlayerIndex): EloShiftRow[] {
  const byId = new Map(report.elo.map((c) => [c.player_id, c]))
  return report.results.flatMap((r) => {
    const c = byId.get(r.player_id)
    return c ? [{ player: who(index, c.player_id, c.player_name), before: c.elo_before, after: c.elo_after, delta: c.delta }] : []
  })
}

export function eloSeries(history: PlayerEloHistory[], index: PlayerIndex): EloSeries[] {
  return history.map((h) => ({
    player: who(index, h.player_id, h.player_name),
    points: h.points.map((p) => ({ date: p.recorded_at, elo: p.elo_after })),
  }))
}

/** Resultados de una fila del archivo (sin desglose: alcanzan para la pista de puntaje). */
export function summaryResults(game: GameSummary, index: PlayerIndex): ResultRow[] {
  return game.scores.map((s) => ({ player: who(index, s.player_id, s.player_id), position: s.position, total: s.total_points, mc: 0, scores: {} }))
}
