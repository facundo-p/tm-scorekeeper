import { describe, it, expect } from 'vitest'
import { activeCount, activityWeeks, applyFilters, archiveSub, groupByMonth, rowSub } from '@/screens/Games/model'
import type { GameSummary } from '@/data/types'

const g = (id: string, date: string, map: string, ids: string[]): GameSummary => ({
  id, date, map, expansions: [], generations: 10, draft: false, player_count: ids.length, winners: [ids[0]], margin: 1, decided_by_mc: false,
  scores: ids.map((p, i) => ({ player_id: p, position: i + 1, total_points: 90 - i, corporation: 'Helion' })),
})
const games = [g('g3', '2026-02-10', 'Hellas', ['a', 'b', 'c']), g('g2', '2026-01-20', 'Tharsis', ['a', 'b']), g('g1', '2026-01-05', 'Hellas', ['b', 'c'])]

describe('archivo de partidas (lo puro)', () => {
  it('filters by map, by every chosen player and by table size', () => {
    expect(applyFilters(games, { map: 'Hellas', players: [] }, null).map((x) => x.id)).toEqual(['g3', 'g1'])
    expect(applyFilters(games, { map: '', players: ['a', 'c'] }, null).map((x) => x.id)).toEqual(['g3'])
    expect(applyFilters(games, { map: '', players: [] }, 2).map((x) => x.id)).toEqual(['g2', 'g1'])
    expect(activeCount({ map: 'Hellas', players: ['a', 'b'] })).toBe(3)
  })

  it('groups consecutive games of the same month', () => {
    expect(groupByMonth(games).map((m) => [m.key, m.games.length])).toEqual([['2026-02', 1], ['2026-01', 2]])
  })

  it('52 weeks ending on the last game, counting games per week', () => {
    const weeks = activityWeeks(games, '2026-02-10')
    expect(weeks).toHaveLength(52)
    expect(weeks[51]).toEqual({ from: '2026-02-04', n: 1 })
    expect(weeks.reduce((s, w) => s + w.n, 0)).toBe(3)
  })

  it('row subtitle: weekday when grouped, month and year otherwise', () => {
    expect(rowSub('2026-02-10', false)).toBe('mar')
    expect(rowSub('2026-02-10', true)).toBe('feb 26')
  })

  it('archive subtitle, also when empty', () => {
    expect(archiveSub(63, '2025-03-08')).toBe('63 misiones archivadas desde marzo de 2025.')
    expect(archiveSub(0, null)).toBe('Todavía no hay misiones archivadas.')
  })
})
