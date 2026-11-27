// Orden del archivo de partidas (#65): port de docs/redesign/mockup/js/data/sort.js.
// Por defecto, fecha (la más nueva primero). Empates: por fecha (la más nueva primero) en las
// otras columnas, y por cantidad de jugadores (menos primero) al ordenar por fecha.

export type SortBy = 'date' | 'winner' | 'map' | 'players'
export interface GameSort { by: SortBy; dir: 'asc' | 'desc' }

export const SORTS: { id: SortBy; label: string }[] = [
  { id: 'date', label: 'Fecha' },
  { id: 'winner', label: 'Ganador' },
  { id: 'map', label: 'Mapa' },
  { id: 'players', label: 'Jugadores' },
]
export const DEFAULT_SORT: GameSort = { by: 'date', dir: 'desc' }

/** Lo mínimo de una partida para ordenarla. */
export interface Sortable { id: string; date: string; map: string; winners: string[]; player_count: number }

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
/** Orden canónico (D-19): fecha y después id. */
export const byDate = (a: Sortable, b: Sortable) => cmp(a.date, b.date) || cmp(a.id, b.id)

const KEYS: Record<Exclude<SortBy, 'date'>, (g: Sortable, name: (id: string) => string) => string | number> = {
  winner: (g, name) => name(g.winners[0]),
  map: (g) => g.map,
  players: (g) => g.player_count,
}

function compareKey(by: Exclude<SortBy, 'date'>, name: (id: string) => string) {
  return (a: Sortable, b: Sortable) => {
    const x = KEYS[by](a, name)
    const y = KEYS[by](b, name)
    return typeof x === 'string' ? x.localeCompare(String(y), 'es') : x - Number(y)
  }
}

/** `name(playerId)` da el nombre del ganador para la columna «Ganador». */
export function sortGames<T extends Sortable>(games: T[], { by, dir }: GameSort, name: (id: string) => string): T[] {
  const sign = dir === 'asc' ? 1 : -1
  if (by === 'date') {
    return games.slice().sort((a, b) => sign * cmp(a.date, b.date) || a.player_count - b.player_count || sign * cmp(a.id, b.id))
  }
  const primary = compareKey(by, name)
  return games.slice().sort((a, b) => sign * primary(a, b) || -byDate(a, b))
}

/** Tocar la columna activa invierte el sentido; otra columna arranca descendente. */
export const nextSort = (cur: GameSort, by: SortBy): GameSort =>
  (cur.by === by ? { by, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { by, dir: 'desc' })
