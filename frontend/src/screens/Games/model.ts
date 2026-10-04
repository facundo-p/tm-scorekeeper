// Lo puro del archivo de partidas (port de docs/redesign/mockup/js/screens/games.js).
import type { GameSummary } from '@/data/types'
import { MONTHS, MONTHS_SHORT, WEEKDAYS } from '@/domain/catalog'

export interface GameFilters { map: string; players: string[] }
export const EMPTY_FILTERS: GameFilters = { map: '', players: [] }

/** Mapa, jugadores (todos tienen que estar) y mesa. */
export function applyFilters(games: GameSummary[], f: GameFilters, mesa: number | null) {
  return games.filter((g) => (!f.map || g.map === f.map)
    && (!mesa || g.player_count === mesa)
    && f.players.every((id) => g.scores.some((s) => s.player_id === id)))
}

export const activeCount = (f: GameFilters) => (f.map ? 1 : 0) + f.players.length

const DAY = 86400000
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

/** Las 52 semanas que terminan en `last`, con cuántas partidas hubo en cada una. */
export function activityWeeks(games: { date: string }[], last: string) {
  const end = new Date(`${last}T12:00:00Z`).getTime()
  return Array.from({ length: 52 }, (_, k) => {
    const i = 51 - k
    const from = iso(end - (i * 7 + 6) * DAY)
    const to = iso(end - i * 7 * DAY)
    return { from, n: games.filter((g) => g.date >= from && g.date <= to).length }
  })
}

export interface MonthGroup { key: string; games: GameSummary[] }

/** Partidas seguidas del mismo mes, en el orden de la lista. */
export function groupByMonth(games: GameSummary[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  for (const g of games) {
    const key = g.date.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.games.push(g)
    else groups.push({ key, games: [g] })
  }
  return groups
}

/** Agrupada por mes, la fila muestra el día de la semana; en otros órdenes, mes y año. */
export function rowSub(date: string, flat: boolean) {
  const d = new Date(`${date}T12:00:00`)
  return flat ? `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : WEEKDAYS[d.getDay()]
}

export const monthTitle = (key: string) => {
  const [y, m] = key.split('-')
  return { month: MONTHS[Number(m) - 1], year: y }
}

export const gamesText = (n: number) => `${n} ${n === 1 ? 'partida' : 'partidas'}`

/** «63 misiones archivadas desde marzo de 2025.» */
export function archiveSub(games: number, first: string | null) {
  if (!first) return 'Todavía no hay misiones archivadas.'
  const d = new Date(`${first}T12:00:00`)
  return `${games} misiones archivadas desde ${MONTHS[d.getMonth()]} de ${d.getFullYear()}.`
}
