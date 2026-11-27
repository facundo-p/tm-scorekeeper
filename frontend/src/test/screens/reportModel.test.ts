import { describe, it, expect } from 'vitest'
import { awardSlots, coords, isStolen, milestoneSlots, tierText, unlocksOf, winSub } from '@/screens/GameReport/model'
import type { GameReport } from '@/data/types'

const report = {
  game: { id: 'g', date: '2026-01-01', map: 'Tharsis', expansions: ['Venus next'], draft: false, generations: 10,
    awards: [{ name: 'Banker', opened_by: 'b', first_place: ['a'], second_place: ['b'] }] },
  results: [
    { player_id: 'a', position: 1, total_points: 90, scores: { milestones: ['Terraformer'] } },
    { player_id: 'b', position: 2, total_points: 80, scores: { milestones: ['Builder'] } },
  ],
  margin: 10, decided_by_mc: false, records_broken: [], near: [], elo: [], winners: ['a'],
  achievements_by_player: {
    b: [{ code: 'blitz', title: 'Blitz', tier: 1, levels: 1, max_tier: 1, glyph: 'blitz', is_new: true }],
    a: [{ code: 'games_played', title: 'Veterano', tier: 3, levels: 2, max_tier: 5, glyph: 'generation', is_new: false },
      { code: 'high_score', title: 'Colono', tier: 1, levels: 1, max_tier: 5, glyph: 'trophy', is_new: true }],
  },
} as unknown as GameReport

describe('informe (lo puro)', () => {
  it('coordinates with N/S and E/O', () => {
    expect(coords('Tharsis')).toBe('2° N / 100° O')
    // Como el mockup: la latitud sur conserva el signo ("-40° S").
    expect(coords('Hellas')).toBe('-40° S / 70° E')
  })

  it('winner subtitle: margin over the second, or the M€ tie-break', () => {
    const name = (id: string) => id.toUpperCase()
    expect(winSub(report, name, 'Helion')).toBe('Helion, 10 puntos sobre B')
    expect(winSub({ ...report, decided_by_mc: true }, name, 'Helion')).toBe('Helion, por desempate de M€')
  })

  it('milestones and awards of the map plus the expansions', () => {
    const ms = milestoneSlots(report)
    expect(ms.find((m) => m.name === 'Terraformer')?.owner).toBe('a')
    expect(ms.some((m) => m.name === 'Hoverlord')).toBe(true)
    const aw = awardSlots(report)
    expect(aw.find((a) => a.name === 'Banker')?.award?.opened_by).toBe('b')
    expect(aw.some((a) => a.name === 'Venuphile' && a.award === null)).toBe(true)
  })

  it('an award won alone by someone else is stolen', () => {
    expect(isStolen({ name: 'x', opened_by: 'b', first_place: ['a'], second_place: [] })).toBe(true)
    expect(isStolen({ name: 'x', opened_by: 'b', first_place: ['a', 'b'], second_place: [] })).toBe(false)
  })

  it('unlocks follow signup order, then the catalog', () => {
    const rank = (id: string) => ['a', 'b'].indexOf(id)
    expect(unlocksOf(report, rank).map((u) => `${u.player_id}:${u.code}`)).toEqual(['a:high_score', 'a:games_played', 'b:blitz'])
    expect(tierText(unlocksOf(report, rank)[1])).toBe('Nivel 3 de 5')
    expect(tierText(unlocksOf(report, rank)[2])).toBe('Logro único')
  })
})
