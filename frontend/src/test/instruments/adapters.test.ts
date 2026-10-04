import { describe, it, expect } from 'vitest'
import { eloSeries, eloShift, playerIndex, scoredGame } from '@/data/instruments'
import type { GameReport, PlayerSummary } from '@/data/types'

const players: PlayerSummary[] = [
  { player_id: 'p-facu', name: 'Facu', color: 'rojo', is_active: true, elo: 1010, since: '2025-03-08' },
  { player_id: 'p-nico', name: 'Nico', color: 'azul', is_active: true, elo: 990, since: '2025-03-08' },
]
const report: GameReport = {
  game: { id: 'g-1', date: '2025-03-08', map_name: 'Tharsis', expansions: ['Turmoil'], generations: 10 },
  results: [
    { player_id: 'p-facu', player_name: 'Facu', corporation: 'Helion', position: 1, tied: false, total_points: 90, mc_total: 30, scores: { terraform_rating: 40 } },
    { player_id: 'p-gone', player_name: 'Viejo', corporation: 'Ecoline', position: 2, tied: false, total_points: 70, mc_total: 10, scores: {} },
  ],
  winners: ['p-facu'], margin: 20, decided_by_mc: false,
  elo: [
    { player_id: 'p-gone', player_name: 'Viejo', elo_before: 1000, elo_after: 990, delta: -10 },
    { player_id: 'p-facu', player_name: 'Facu', elo_before: 1000, elo_after: 1010, delta: 10 },
  ],
}

describe('de la API a los instrumentos', () => {
  const index = playerIndex(players)

  it('a game keeps the report order, with colours (grey when the player is gone)', () => {
    const g = scoredGame(report, index)
    expect(g.expansions).toEqual(['Turmoil'])
    expect(g.results.map((r) => [r.player.name, r.player.color, r.total, r.mc])).toEqual([['Facu', 'rojo', 90, 30], ['Viejo', 'gris', 70, 10]])
  })

  it('ELO changes follow the finishing order', () => {
    expect(eloShift(report, index).map((c) => [c.player.id, c.delta])).toEqual([['p-facu', 10], ['p-gone', -10]])
  })

  it('ELO history becomes dated series', () => {
    const [s] = eloSeries([{ player_id: 'p-nico', player_name: 'Nico', points: [{ recorded_at: '2025-03-08', game_id: 'g-1', elo_after: 990, delta: -10 }] }], index)
    expect(s).toEqual({ player: { id: 'p-nico', name: 'Nico', color: 'azul' }, points: [{ date: '2025-03-08', elo: 990 }] })
  })
})
