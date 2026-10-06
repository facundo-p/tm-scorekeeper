import { describe, it, expect } from 'vitest'
import { achievementRows, corpRows, dnaRows, heldRecords, mapRows, tabOf, timesText } from '@/screens/Profile/model'
import { progressPct } from '@/ui/atoms'
import type { CatalogAchievement, GroupRecord, PlayerAchievement, SplitStat } from '@/data/types'

const split = (name: string, games: number, wins: number): SplitStat => ({ name, games, wins, avg: 80, avg_pos: 2 })

describe('perfil (lo puro)', () => {
  it('tab from the URL: known ids or the summary', () => {
    expect([tabOf('logros'), tabOf('records'), tabOf(null), tabOf('otra')]).toEqual(['logros', 'records', 'resumen', 'resumen'])
  })

  it('score DNA: own average, difference with the group and a ±0.5 tone band', () => {
    const rows = dnaRows({ avg: { terraform_rating: 30, card_points: 10, city_points: 5 }, share: {} },
      { avg: { terraform_rating: 28, card_points: 10.4, city_points: 6 }, share: {} })
    const by = Object.fromEntries(rows.map((r) => [r.cat.key, r]))
    expect(by.terraform_rating).toMatchObject({ own: 30, diff: 2, tone: 'up' })
    expect(by.card_points.tone).toBe('flat')
    expect(by.city_points).toMatchObject({ diff: -1, tone: 'down' })
    expect(by.turmoil_points).toMatchObject({ own: 0, tone: 'flat' })
  })

  it('maps in catalog order, unplayed ones empty; corporations: top 6 relative to the most played', () => {
    const maps = mapRows([split('Hellas', 4, 1), split('Tharsis', 10, 3)])
    expect(maps.slice(0, 3).map((m) => [m.name, m.stat?.games ?? null])).toEqual([['Tharsis', 10], ['Hellas', 4], ['Elysium', null]])
    const corps = corpRows([split('Helion', 8, 4), split('Ecoline', 4, 1), ...['a', 'b', 'c', 'd', 'e'].map((n) => split(n, 1, 0))])
    expect(corps).toHaveLength(6)
    expect(corps[1]).toMatchObject({ name: 'Ecoline', g: '50', w: '13' })
    expect([timesText(1), timesText(3)]).toEqual(['1 vez', '3 veces'])
    expect([progressPct({ current: 4, target: 5 }), progressPct({ current: 9, target: 5 }), progressPct({ current: 1, target: 0 })]).toEqual([80, 100, 0])
  })

  it('achievements: catalog order, unlocked first by tier; held records keep the records order', () => {
    const def = (code: string) => ({ code, description: '', tiers: [], holders: [], kind: 'tiered', glyph: 'x', flavor: '' }) as CatalogAchievement
    const mine = (code: string, tier: number) => ({ code, tier }) as PlayerAchievement
    const rows = achievementRows([def('a'), def('b'), def('c'), def('d')], [mine('a', 0), mine('b', 1), mine('c', 3), mine('d', 0)])
    expect(rows.map((r) => r.def.code)).toEqual(['c', 'b', 'a', 'd'])
    const rec = (code: string) => ({ code }) as GroupRecord
    expect(heldRecords([rec('x'), rec('y'), rec('z')], ['z', 'x']).map((r) => r.code)).toEqual(['x', 'z'])
  })
})
