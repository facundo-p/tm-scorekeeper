// Lo puro del ranking (port de docs/redesign/mockup/js/screens/ranking.js).
import type { HeadToHead, PlayerSummary, RankingRow } from '@/data/types'
import { monthsBefore, today } from '@/domain/clock'
import type { PlayerLike } from '@/ui/atoms'
import type { EloSeries } from '@/ui/instruments'

export const COLORS = ['rojo', 'verde', 'azul', 'amarillo', 'negro', 'naranja', 'violeta', 'rosa', 'blanco'] as const

export interface Range { id: string; label: string; from: string | null }

/** Rangos del gráfico de ELO: todo, la temporada en curso, el año y los últimos 3 meses. */
export function ranges(season: { number: number; start: string } | undefined): Range[] {
  const year = today().slice(0, 4)
  return [
    { id: 'all', label: 'Todo', from: null },
    ...(season ? [{ id: 'season', label: `Temporada ${season.number}`, from: season.start }] : []),
    { id: 'year', label: year, from: `${year}-01-01` },
    { id: 'q', label: 'Últimos 3 meses', from: monthsBefore(today(), 3) },
  ]
}

export const eloLabel = (mesa: number | null) => (mesa ? `ELO de mesa ${mesa}` : 'ELO')

export const asPlayer = (r: RankingRow): PlayerLike => ({ id: r.player_id, name: r.name, color: r.color })

/** Series del gráfico desde la clasificación (con filtro de mesa, el ELO de esa mesa). */
export const seriesOf = (rows: RankingRow[]): EloSeries[] =>
  rows.map((r) => ({ player: asPlayer(r), points: r.elo_series.map(({ date, elo }) => ({ date, elo })) }))

export interface Rivalry { a: string; b: string; games: number; ahead: number; behind: number }

/** Las 4 parejas con más partidas juntas (a adelante de b en `ahead`). */
export function rivalries(ids: string[], matrix: HeadToHead['matrix']): Rivalry[] {
  const out: Rivalry[] = []
  ids.forEach((a, i) => ids.slice(i + 1).forEach((b) => {
    const c = matrix[a]?.[b]
    if (c?.games) out.push({ a, b, games: c.games, ahead: c.ahead, behind: c.behind })
  }))
  return out.sort((x, y) => y.games - x.games).slice(0, 4)
}

/** Colores en uso por otros jugadores activos (al editar, el propio no cuenta). */
export const takenColors = (players: PlayerSummary[], self?: string) =>
  new Set(players.filter((p) => p.is_active && p.player_id !== self).map((p) => p.color))

/** «1 inactivo: …» / «2 inactivos: …». */
export const inactiveNote = (n: number) =>
  `${n} ${n === 1 ? 'inactivo' : 'inactivos'}: no aparece${n === 1 ? '' : 'n'} en el ranking ni al registrar partidas, pero conserva${n === 1 ? '' : 'n'} su historial.`
