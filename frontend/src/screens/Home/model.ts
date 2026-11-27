// Lo puro de Inicio (port de docs/redesign/mockup/js/screens/home.js).
import { CATEGORIES } from '@/domain/catalog'
import type { FeedItem, Season } from '@/data/types'
import { fmt } from '@/domain/format'
import type { TagTone } from '@/ui/atoms'

export const MIN_SEASON_GAMES = 3
export const SEASON_CATEGORIES = ['total', ...CATEGORIES.map((c) => c.key)]
export const CAT_LABEL: Record<string, string> = { total: 'Total', ...Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label])) }

/** `?cat=` válido o la carrera por total. */
export const categoryOf = (cat: string | null) => (cat && SEASON_CATEGORIES.includes(cat) ? cat : 'total')

/** Topes de los parámetros de la temporada (pasos de temperatura, % de oxígeno, océanos). */
const SEASON_PARAMS = [
  { key: 'temp', cap: 19, label: 'la temperatura' },
  { key: 'oxygen', cap: 14, label: 'el oxígeno' },
  { key: 'oceans', cap: 9, label: 'los océanos' },
] as const

type SeasonLevels = Pick<Season, 'temp' | 'oxygen' | 'oceans' | 'games_left'>

/** Parámetros que todavía no llegaron al tope, en orden del tablero. */
export const pendingParams = (s: SeasonLevels) => SEASON_PARAMS.filter((p) => s[p.key] < p.cap)

const joinEs = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)

/** Qué falta para cerrar la temporada: partidas estimadas y parámetros pendientes. */
export function seasonEta(s: SeasonLevels) {
  const pending = pendingParams(s)
  const what = pending.length === 1 && pending[0].key === 'oxygen'
    ? `Solo falta el oxígeno: ${fmt.dec(s.oxygen)} de 14 %.`
    : `Falta completar ${joinEs(pending.map((p) => p.label))}.`
  if (s.games_left == null) return `${what} Todavía no hay vegetación para estimar cuántas partidas faltan.`
  const left = s.games_left === 1 ? 'Falta más o menos 1 partida' : `Faltan unas ${s.games_left} partidas`
  return `${left} para completarla. ${what}`
}

export function raceLede(category: string, games: number) {
  const what = category === 'total' ? 'puntos' : CAT_LABEL[category].toLowerCase()
  const pool = category === 'turmoil_points' ? `${games} partidas con Turmoil` : `${games} partidas`
  return `Promedio de ${what} por partida en las ${pool} de esta temporada. Hacen falta ${MIN_SEASON_GAMES} partidas para clasificar.`
}

export const missingText = (n: number) => `le ${n === 1 ? 'falta 1 partida' : `faltan ${n} partidas`}`
export const gamesText = (n: number) => `${n} ${n === 1 ? 'partida' : 'partidas'}`

export const FEED_TAG: Record<FeedItem['type'], [string, TagTone, string]> = {
  record: ['trophy', 'blue', 'Récord'], achievement: ['crown', 'green', 'Logro'], game: ['games', 'red', 'Partida'], season: ['spark', 'gold', 'Temporada'],
}

/** La bitácora de Inicio: lo último que no es una partida común. */
export const logbookItems = (feed: FeedItem[]) => feed.filter((f) => f.type !== 'game').slice(0, 9)
