import { describe, it, expect, vi, afterEach } from 'vitest'
import { expectedTone, signedDec } from '@/ui/fairness'
import { firstFreeColor, inactiveNote, ranges, rivalries, takenColors } from '@/screens/Ranking/model'
import type { PlayerSummary } from '@/data/types'

const player = (player_id: string, color: string, is_active = true) => ({ player_id, name: player_id, color, is_active, elo: 1000, since: null }) as PlayerSummary

describe('ranking (lo puro)', () => {
  afterEach(() => vi.useRealTimers())

  it('date ranges: all, the current season (if any), this year and the last 3 months', () => {
    vi.useFakeTimers({ now: new Date('2026-09-27T12:00:00') })
    expect(ranges({ number: 3, start: '2026-05-01' })).toEqual([
      { id: 'all', label: 'Todo', from: null }, { id: 'season', label: 'Temporada 3', from: '2026-05-01' },
      { id: 'year', label: '2026', from: '2026-01-01' }, { id: 'q', label: 'Últimos 3 meses', from: '2026-06-27' },
    ])
    expect(ranges(undefined).map((r) => r.id)).toEqual(['all', 'year', 'q'])
  })

  it('rivalries: the four pairs with most shared games, each pair once', () => {
    const cell = (games: number, ahead: number) => ({ games, ahead, behind: games - ahead, even: 0 })
    const matrix = { a: { b: cell(10, 6), c: cell(3, 1), d: cell(8, 2), e: cell(1, 1) }, b: { c: cell(9, 5), d: cell(0, 0) }, c: { d: cell(4, 4) } }
    expect(rivalries(['a', 'b', 'c', 'd', 'e'], matrix).map((r) => `${r.a}-${r.b}:${r.ahead}/${r.behind}`)).toEqual(['a-b:6/4', 'b-c:5/4', 'a-d:2/6', 'c-d:4/0'])
  })

  it('colors in use are those of the other active players', () => {
    const players = [player('a', 'rojo'), player('b', 'verde'), player('c', 'azul', false)]
    expect([...takenColors(players)]).toEqual(['rojo', 'verde'])
    expect([...takenColors(players, 'a')]).toEqual(['verde'])
    expect(firstFreeColor(takenColors(players))).toBe('azul')
    expect(firstFreeColor(new Set(['rojo', 'verde', 'azul', 'amarillo', 'negro', 'naranja', 'violeta', 'rosa', 'blanco']))).toBe('rojo')
  })

  it('texts: signed decimals, tone with a 0.05 band and the inactive note in singular and plural', () => {
    expect([signedDec(1.25), signedDec(-0.4), signedDec(0)]).toEqual(['+1,3', '−0,4', '±0,0'])
    expect([expectedTone(0.05), expectedTone(-0.05), expectedTone(0.04)]).toEqual(['up', 'down', 'flat'])
    expect(inactiveNote(1)).toBe('1 inactivo: no aparece en el ranking ni al registrar partidas, pero conserva su historial.')
    expect(inactiveNote(2)).toMatch(/^2 inactivos: no aparecen .* conservan su historial\.$/)
  })
})
