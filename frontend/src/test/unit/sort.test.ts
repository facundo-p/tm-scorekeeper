import { describe, it, expect } from 'vitest'
import { DEFAULT_SORT, nextSort, sortGames, type Sortable } from '@/domain/sort'

const g = (id: string, date: string, map: string, winner: string, n: number): Sortable => ({ id, date, map, winners: [winner], player_count: n })
const games = [g('g1', '2026-01-01', 'Tharsis', 'b', 4), g('g2', '2026-01-02', 'Hellas', 'a', 3), g('g3', '2026-01-02', 'Elysium', 'c', 2)]
const name = (id: string) => ({ a: 'Ana', b: 'Beto', c: 'Álvaro' })[id] ?? id

describe('orden de partidas', () => {
  it('by date, newest first; same day, fewer players first', () => {
    expect(sortGames(games, DEFAULT_SORT, name).map((x) => x.id)).toEqual(['g3', 'g2', 'g1'])
  })

  it('by winner name with Spanish collation, ties newest first', () => {
    expect(sortGames(games, { by: 'winner', dir: 'asc' }, name).map((x) => x.id)).toEqual(['g3', 'g2', 'g1'])
    expect(sortGames(games, { by: 'winner', dir: 'desc' }, name).map((x) => x.id)).toEqual(['g1', 'g2', 'g3'])
  })

  it('by players and by map', () => {
    expect(sortGames(games, { by: 'players', dir: 'desc' }, name).map((x) => x.id)).toEqual(['g1', 'g2', 'g3'])
    expect(sortGames(games, { by: 'map', dir: 'asc' }, name).map((x) => x.map)).toEqual(['Elysium', 'Hellas', 'Tharsis'])
  })

  it('the active column flips; another starts descending', () => {
    expect(nextSort(DEFAULT_SORT, 'date')).toEqual({ by: 'date', dir: 'asc' })
    expect(nextSort({ by: 'date', dir: 'asc' }, 'map')).toEqual({ by: 'map', dir: 'desc' })
  })
})
