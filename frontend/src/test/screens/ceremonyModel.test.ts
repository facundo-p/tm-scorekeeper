import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReportResult } from '@/data/types'
import { CATEGORIES } from '@/domain/catalog'
import { statusText, tally } from '@/screens/Ceremony/model'
import { useSequence } from '@/screens/Ceremony/useSequence'

const result = (player_id: string, tr: number, cards: number, mc: number) =>
  ({ player_id, scores: { terraform_rating: tr, card_points: cards }, mc_total: mc, total_points: tr + cards }) as unknown as ReportResult
const cats = CATEGORIES.filter((c) => c.key === 'terraform_rating' || c.key === 'card_points')

describe('ceremonia (lo puro)', () => {
  it('rows re-sort as categories are added; M€ breaks ties only at the end', () => {
    const rs = [result('a', 20, 10, 1), result('b', 25, 5, 9)]
    expect(tally(rs, cats, 1).order.map((r) => r.r.player_id)).toEqual(['b', 'a'])
    const mid = tally(rs, cats, 0)
    expect(mid.order.map((r) => r.r.player_id)).toEqual(['a', 'b'])
    const end = tally(rs, cats, 2)
    expect(end).toMatchObject({ done: true })
    expect(end.order.map((r) => [r.r.player_id, r.total])).toEqual([['b', 30], ['a', 30]])
  })

  it('the status says which category is being added, then the final results', () => {
    expect(statusText(cats, 0, false)).toBe('Fin de la partida')
    expect(statusText(cats, 1, false)).toBe('Sumando Terraform Rating')
    expect(statusText(cats, 2, true)).toBe('Resultados finales')
  })
})

describe('useSequence', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('starts after 700 ms, advances every 950 ms and skip jumps to the end', () => {
    vi.useFakeTimers()
    const { result: r } = renderHook(() => useSequence(5))
    expect(r.current[0]).toBe(0)
    act(() => { vi.advanceTimersByTime(700) })
    expect(r.current[0]).toBe(1)
    act(() => { vi.advanceTimersByTime(950) })
    expect(r.current[0]).toBe(2)
    act(() => r.current[1]())
    expect(r.current[0]).toBe(5)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(r.current[0]).toBe(5)
  })

  it('with reduced motion it starts at the end', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const { result: r } = renderHook(() => useSequence(5))
    expect(r.current[0]).toBe(5)
  })
})
