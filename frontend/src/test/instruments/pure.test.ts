import { describe, it, expect } from 'vitest'
import { mixStops } from '@/ui/instruments'
import { chartDates, chartScale, chartSeries, hoverRows, layoutLabels } from '@/ui/instruments/eloChart'
import { h2hCell } from '@/ui/instruments/HeadToHead'
import { placeCubes } from '@/ui/instruments/ScoreTrack'
import { categoriesOf } from '@/ui/instruments/ScoreBars'
import { sparkPoints } from '@/ui/instruments/Sparkline'
import { trSquares } from '@/ui/instruments/TrTrack'
import type { EloSeries, ResultRow } from '@/ui/instruments'

const P = (id: string) => ({ id, name: id, color: 'rojo' })
const row = (id: string, total: number, position: number): ResultRow => ({ player: P(id), total, position, mc: 0, scores: {} })

describe('instrumentos (lo puro)', () => {
  it('mixes the board gradients by stop, clamped', () => {
    expect(mixStops(['#000000', '#ffffff'], 0.5)).toBe('rgb(128 128 128)')
    expect(mixStops(['#000000', '#ff0000', '#ffffff'], 2)).toBe('rgb(255 255 255)')
    expect(mixStops(['#000000', '#ff0000'], -1)).toBe('rgb(0 0 0)')
  })

  it('stacks cubes that land close on the score track', () => {
    const placed = placeCubes([row('a', 90, 2), row('b', 91, 1), row('c', 140, 3)], 40, 140)
    expect(placed.map((p) => [p.r.player.id, p.lane])).toEqual([['a', 0], ['b', 1], ['c', 0]])
    expect(placed[2].x).toBe(100)
  })

  it('shows Turmoil only when the game had it', () => {
    expect(categoriesOf([]).map((c) => c.key)).not.toContain('turmoil_points')
    expect(categoriesOf(['Turmoil']).map((c) => c.key)).toContain('turmoil_points')
  })

  it('sparkline spans the box; flat series stay inside it', () => {
    expect(sparkPoints([1, 3], 96, 28)).toEqual([[2, 25], [92, 3]])
    expect(sparkPoints([5, 5], 96, 28).every(([, y]) => y === 25)).toBe(true)
  })

  it('the TR track covers the scores in squares of five', () => {
    const sq = trSquares([72, 90])
    expect(sq[0]).toBe(65)
    expect(sq[sq.length - 1]).toBe(95)
  })

  it('head to head needs two games; ahead is ocean, behind is rust', () => {
    const m = { a: { b: { games: 4, ahead: 3 }, c: { games: 1, ahead: 1 } }, b: { a: { games: 4, ahead: 1 } } }
    expect(h2hCell(m, 'a', 'c')).toBeNull()
    expect(h2hCell(m, 'a', 'b')).toMatchObject({ rate: 0.75, tone: 'a', strength: 0.55 })
    expect(h2hCell(m, 'b', 'a')).toMatchObject({ tone: 'b' })
  })
})

describe('gráfico de ELO (lo puro)', () => {
  const series: EloSeries[] = [
    { player: P('a'), points: [{ date: '2025-01-01', elo: 1010 }, { date: '2025-02-01', elo: 1030 }] },
    { player: P('b'), points: [{ date: '2025-01-15', elo: 990 }] },
  ]

  it('shares one date axis and carries the last value forward', () => {
    const dates = chartDates(series)
    expect(dates).toEqual(['2025-01-01', '2025-01-15', '2025-02-01'])
    const [a, b] = chartSeries(series, dates)
    expect(a.pts).toEqual([[0, 1010, true], [1, 1010, false], [2, 1030, true]])
    expect(b.pts).toEqual([[1, 990, true], [2, 990, false]])
  })

  it('with `from`, starts at the value it had before', () => {
    const dates = chartDates(series, '2025-01-15')
    expect(chartSeries(series, dates, '2025-01-15')[0].pts[0]).toEqual([0, 1010, false])
  })

  it('the Y scale always includes 1000, in steps of 50', () => {
    const s = chartScale(chartSeries(series, chartDates(series)), 3, 640, 260)
    expect([s.lo, s.hi]).toEqual([950, 1050])
    expect(s.ticks).toEqual([950, 1000, 1050])
    expect(s.Y(s.hi)).toBe(14)
  })

  it('labels keep 15 px apart and hover rows go from high to low', () => {
    expect(layoutLabels([{ y: 50 }, { y: 40 }]).map((l) => l.ly)).toEqual([40, 55])
    const rows = hoverRows(chartSeries(series, chartDates(series)), 1, new Set())
    expect(rows.map((r) => [r.player.id, r.v])).toEqual([['a', 1010], ['b', 990]])
  })
})
