import { describe, it, expect } from 'vitest'
import type { CatalogAchievement, GroupRecord, PlayerAchievement } from '@/data/types'
import { gamesText, holdersBySignup, splitRecords, stepChart, timeline, unitOf } from '@/screens/Records/model'
import { holdersText, ladderRow, sheetTitle, shownTier, thresholdText, tierTitle } from '@/screens/Achievements/model'

const rec = (code: string, extra: Partial<GroupRecord> = {}) => ({ code, title: code, description: '', scope: 'game', unit: 'pts', lower_is_better: false, value: 10, holders: [], history: [], ...extra }) as GroupRecord
const step = (value: number, player_id: string, date: string) => ({ value, player_id, date, game_id: `g-${date}`, kind: 'set' as const })

describe('récords (lo puro)', () => {
  it('the top score goes to the monument; the rest keep their order', () => {
    const { top, rest } = splitRecords([rec('a'), rec('highest_single_game_score'), rec('b')])
    expect(top?.code).toBe('highest_single_game_score')
    expect(rest.map((r) => r.code)).toEqual(['a', 'b'])
  })

  it('the step chart uses the whole archive timeline and needs two steps', () => {
    const t = timeline('2026-01-01', '2026-01-11')
    expect([t('2026-01-01'), t('2026-01-06'), t('2026-01-11')]).toEqual([0, 0.5, 1])
    expect(stepChart([step(5, 'a', '2026-01-01')], 64, t)).toBeNull()
    const c = stepChart([step(5, 'a', '2026-01-01'), step(8, 'b', '2026-01-11')], 64, t)!
    expect(c.d).toBe('M6 54H294V8H294')
    expect(c.points.map((p) => [Math.round(p.x), Math.round(p.y)])).toEqual([[2, 84], [98, 13]])
  })

  it('texts and order: closest win at 0 decided by M€, games, career co-holders by signup', () => {
    expect(unitOf(rec('closest_win', { value: 0 }))).toBe('pts, definida por M€')
    expect(unitOf(rec('closest_win', { value: 2 }))).toBe('pts')
    expect([gamesText(1), gamesText(4)]).toEqual(['1 partida', '4 partidas'])
    const holders = ['c', 'a', 'b'].map((player_id) => ({ player_id, player_name: player_id }))
    expect(holdersBySignup(rec('x', { holders }), (id) => ['a', 'b', 'c'].indexOf(id)).map((h) => h.player_id)).toEqual(['a', 'b', 'c'])
  })
})

describe('logros (lo puro)', () => {
  const tiers = [{ level: 1, threshold: 3, title: 'Uno' }, { level: 2, threshold: 5, title: 'Dos' }]
  const a = { code: 'x', description: '', tiers, kind: 'max', glyph: 'g', flavor: '',
    holders: [{ player_id: 'p', player_name: 'P', tier: 2, unlocked_at: '2026-01-01' }, { player_id: 'q', player_name: 'Q', tier: 1, unlocked_at: '2026-02-01' }] } as CatalogAchievement

  it('the medal shows the picked player tier or the best of the group', () => {
    expect(shownTier(a)).toBe(2)
    expect(shownTier(a, { tier: 0 } as PlayerAchievement)).toBe(0)
    expect([tierTitle(a, 2), tierTitle(a, 0), sheetTitle(a)]).toEqual(['Dos', 'Uno', 'Dos'])
  })

  it('ladder: who is at each level and whether it was reached', () => {
    expect(ladderRow(a, 1)).toMatchObject({ reached: true })
    expect(ladderRow(a, 1).at.map((h) => h.player_id)).toEqual(['q'])
    expect(ladderRow(a, 2, { tier: 1 } as PlayerAchievement).reached).toBe(false)
    expect([thresholdText(a, 3), thresholdText({ ...a, kind: 'flag' }, 1)]).toEqual(['Umbral: 3', 'Lograrlo una vez'])
    expect([holdersText(0), holdersText(1), holdersText(3)]).toEqual(['Nadie todavía', '1 jugador', '3 jugadores'])
  })
})
