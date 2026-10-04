import { describe, it, expect } from 'vitest'
import { blankState, derived, hasTies, reducer, validate, type WizardState } from '@/screens/Register/model'
import { stateFromGame, toPayload, type SavedGame } from '@/screens/Register/io'

const name = (id: string) => id.toUpperCase()
const withPlayers = (...ids: string[]) => ids.reduce((s, id) => reducer(s, { type: 'togglePlayer', id }), { ...blankState(), map: 'Tharsis' })

describe('asistente de registro (lo puro)', () => {
  it('up to five players; removing one also frees its milestones and awards', () => {
    let s = withPlayers('a', 'b', 'c', 'd', 'e', 'f')
    expect(s.players.map((p) => p.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
    s = reducer(s, { type: 'milestone', name: 'Terraformer', id: 'a' })
    s = reducer(s, { type: 'award', awards: [{ name: 'Banker', opened_by: 'a', first: ['a'], second: ['b'] }] })
    s = reducer(s, { type: 'togglePlayer', id: 'a' })
    expect(s.milestones).toEqual({})
    expect(s.awards[0]).toMatchObject({ opened_by: '', first: [], second: ['b'] })
  })

  it('three milestones at most; touching the owner frees it', () => {
    let s = withPlayers('a', 'b')
    for (const m of ['Terraformer', 'Mayor', 'Gardener', 'Builder']) s = reducer(s, { type: 'milestone', name: m, id: 'a' })
    expect(Object.keys(s.milestones)).toEqual(['Terraformer', 'Mayor', 'Gardener'])
    s = reducer(s, { type: 'milestone', name: 'Mayor', id: 'a' })
    expect(Object.keys(s.milestones)).toEqual(['Terraformer', 'Gardener'])
  })

  it('totals add milestones (5) and awards (5/2); ties on points and M€ share the position', () => {
    let s = withPlayers('a', 'b', 'c')
    s = reducer(s, { type: 'milestone', name: 'Terraformer', id: 'b' })
    s = reducer(s, { type: 'award', awards: [{ name: 'Banker', opened_by: 'a', first: ['a'], second: ['c'] }] })
    const { order } = derived(s)
    expect(order.map((r) => [r.id, r.total, r.position])).toEqual([['a', 25, 1], ['b', 25, 1], ['c', 22, 3]])
    expect(hasTies(order)).toBe(true)
  })

  it('turmoil only counts with Turmoil', () => {
    let s = reducer(withPlayers('a', 'b'), { type: 'score', id: 'a', key: 'turmoil_points', value: 7 })
    expect(derived(s).rows[0].total).toBe(20)
    s = reducer(s, { type: 'set', patch: { expansions: ['Turmoil'] } })
    expect(derived(s).rows[0].total).toBe(27)
    expect(reducer(s, { type: 'score', id: 'a', key: 'card_points', value: -3 }).players[0].scores.card_points).toBe(0)
  })

  it('validates each step with the mockup texts', () => {
    expect(validate({ ...blankState(), map: '' }, name).map((e) => e.msg)).toEqual(['Elegí el mapa en el que jugaron.'])
    expect(validate({ ...blankState(), map: 'Tharsis', date: '2999-01-01' }, name)[0].msg).toBe('La fecha no puede ser posterior a hoy.')
    const table: WizardState = { ...withPlayers('a'), step: 1 }
    expect(validate(table, name).map((e) => e.msg)).toEqual(['Elegí entre 2 y 5 jugadores.', 'Falta la corporación de A.'])
    const board: WizardState = { ...withPlayers('a', 'b'), step: 2, awards: [{ name: 'Banker', opened_by: '', first: [], second: [] }] }
    expect(validate(board, name)).toHaveLength(2)
  })
})

describe('de y hacia la API', () => {
  const game: SavedGame = {
    id: 'g', date: '2026-01-01', map: 'Tharsis', expansions: [], draft: true, generations: 9,
    awards: [{ name: 'Banker', opened_by: 'b', first_place: ['a'], second_place: [] }],
    player_results: [
      { player_id: 'a', corporation: 'Helion', end_stats: { mc_total: 12 }, scores: { terraform_rating: 30, milestones: ['Mayor'], turmoil_points: null } },
      { player_id: 'b', corporation: 'Ecoline', end_stats: { mc_total: 3 }, scores: { terraform_rating: 25, milestones: [] } },
    ],
  }

  it('a saved game becomes the wizard state and back, with computed milestone and award points', () => {
    const s = stateFromGame(game, { editing: 'g' })
    expect(s).toMatchObject({ editing: 'g', map: 'Tharsis', milestones: { Mayor: 'a' }, generations: 9 })
    expect(s.players[0]).toMatchObject({ corp: 'Helion', mc: 12, scores: { terraform_rating: 30, turmoil_points: 0 } })
    const body = toPayload(s)
    expect(body.player_results[0].scores).toMatchObject({ milestones: ['Mayor'], milestone_points: 5, award_points: 5, turmoil_points: null })
    expect(body.awards).toEqual([{ name: 'Banker', opened_by: 'b', first_place: ['a'], second_place: [] }])
  })
})
