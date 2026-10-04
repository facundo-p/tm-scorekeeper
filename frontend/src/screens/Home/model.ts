// Lo puro de Inicio (port de docs/redesign/mockup/js/screens/home.js).
import { CATEGORIES } from '@/domain/catalog'
import type { FeedItem } from '@/data/types'
import type { TagTone } from '@/ui/atoms'

export const MIN_SEASON_GAMES = 3
export const SEASON_CATEGORIES = ['total', ...CATEGORIES.map((c) => c.key)]
export const CAT_LABEL: Record<string, string> = { total: 'Total', ...Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label])) }

/** `?cat=` válido o la carrera por total. */
export const categoryOf = (cat: string | null) => (cat && SEASON_CATEGORIES.includes(cat) ? cat : 'total')

/** Partidas que faltan, aproximadas, para completar la temperatura (19 pasos de 2 °C, ~0,8 por partida). */
export const gamesLeft = (temperature: number) => Math.max(1, Math.ceil((19 - (temperature + 30) / 2) / 0.8))

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
