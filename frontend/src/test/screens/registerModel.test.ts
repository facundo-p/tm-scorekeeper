import { describe, it, expect } from 'vitest'
import { blankState, derived, hasTies, reducer, scoreboard, scoredCats, stepIndex, stepsFor, toggleAward, validate, type WizardState } from '@/screens/Register/model'
import { suggestCorps } from '@/screens/Register/corpSearch'
import { CORPS } from '@/domain/catalog'
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

  it('going down to two players drops every 2nd place (two-player games have none)', () => {
    let s = withPlayers('a', 'b', 'c')
    s = reducer(s, { type: 'award', awards: [{ name: 'Banker', opened_by: 'a', first: ['a'], second: ['b'] }] })
    s = reducer(s, { type: 'togglePlayer', id: 'c' })
    expect(s.awards[0].second).toEqual([])
    expect(derived(s).rows.find((r) => r.id === 'b')!.sc.award_points).toBe(0)
  })

  it('three awards funded at most; toggling a funded one removes it', () => {
    let awards = ['Banker', 'Scientist', 'Thermalist', 'Miner'].reduce(toggleAward, [] as WizardState['awards'])
    expect(awards.map((w) => w.name)).toEqual(['Banker', 'Scientist', 'Thermalist'])
    awards = toggleAward(awards, 'Scientist')
    expect(awards.map((w) => w.name)).toEqual(['Banker', 'Thermalist'])
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
    expect(validate({ ...blankState(), map: 'Tharsis', date: '' }, name).map((e) => e.msg)).toEqual(['Indicá la fecha de la partida.'])
    const awards: WizardState = { ...withPlayers('a', 'b'), step: 3, awards: [{ name: 'Banker', opened_by: '', first: [], second: [] }] }
    expect(validate(awards, name)).toHaveLength(2)
    expect(validate({ ...awards, step: 2 }, name)).toEqual([])
  })
})

describe('pasos y marcador provisorio', () => {
  const ids = (exp: string[]) => stepsFor(exp).map((x) => x.id)

  it('loads TR and M€, awards, milestones, resources, cards, greenery, cities and, with Turmoil, turmoil', () => {
    expect(ids([])).toEqual(['game', 'table', 'trmc', 'awards', 'milestones', 'card_resource_points', 'card_points', 'greenery_points', 'city_points', 'review'])
    expect(ids(['Turmoil'])).toEqual(['game', 'table', 'trmc', 'awards', 'milestones', 'card_resource_points', 'card_points', 'greenery_points', 'city_points', 'turmoil_points', 'review'])
  })

  it('an old draft with a step past the end lands on the last one', () => {
    expect(stepIndex({ ...blankState(), step: 10 })).toBe(9)
    expect(stepIndex({ ...blankState(), step: 10, expansions: ['Turmoil'] })).toBe(10)
  })

  it('the scoreboard only appears on score steps and adds the categories loaded so far', () => {
    const at = (step: number, exp: string[] = []) => scoredCats({ ...blankState(), step, expansions: exp })
    expect(at(0)).toEqual([]); expect(at(1)).toEqual([])
    expect(at(2)).toEqual(['terraform_rating'])
    expect(at(4)).toEqual(['terraform_rating', 'award_points', 'milestone_points'])
    expect(at(8)).toHaveLength(7)
    expect(at(9)).toEqual([])
    expect(at(9, ['Turmoil'])).toContain('turmoil_points')
  })

  it('sorts by the partial total, then by M€; `add` is what the current step adds', () => {
    let s = withPlayers('a', 'b', 'c')
    s = reducer(s, { type: 'score', id: 'a', key: 'card_points', value: 30 })
    s = reducer(s, { type: 'player', id: 'c', patch: { mc: 9 } })
    s = reducer(s, { type: 'award', awards: [{ name: 'Banker', opened_by: 'a', first: ['b'], second: ['c'] }] })
    const two = scoreboard(s, ['terraform_rating', 'award_points'])
    expect(two.order.map((r) => [r.id, r.total, r.add])).toEqual([['b', 25, 5], ['c', 22, 2], ['a', 20, 0]])
    expect(two.scale).toBe(100)
    const tr = scoreboard(s, ['terraform_rating'])
    expect(tr.order.map((r) => r.id)).toEqual(['c', 'a', 'b'])
    expect(scoreboard(s, ['terraform_rating', 'award_points', 'milestone_points', 'card_resource_points', 'card_points']).order[0]).toMatchObject({ id: 'a', total: 50, add: 30 })
  })
})

describe('sugerencias de corporación', () => {
  const labels = (q: string) => suggestCorps(q).map((x) => x.label)

  it('without text lists every corporation alphabetically, whatever the expansions', () => {
    const all = labels('')
    expect(all).toHaveLength(CORPS.length)
    expect(all).toEqual([...all].sort((a, b) => a.localeCompare(b, 'es')))
    expect(all).toEqual(expect.arrayContaining(['Septem Tribus', 'Aphrodite', 'Arklight', 'Point Luna']))
  })

  it('names that start with the text come first; then the ones that contain it', () => {
    expect(suggestCorps('te').every((x) => x.corp.name.toLowerCase().includes('te'))).toBe(true)
    expect(labels('te').slice(0, 3)).toEqual(['Teractor', 'Terralabs Investigation', 'Terralabs Research'])
    expect(labels('ZZZ')).toEqual([])
  })

  it('ignores case and accents, finds UNMI by its full name and marks the matching part', () => {
    expect(labels('ÉCO')).toEqual(['Ecoline', 'Ecotec'])
    expect(labels('united')).toEqual(['UNMI'])
    expect(suggestCorps('line')[0]).toMatchObject({ label: 'Ecoline', match: [3, 7] })
  })

  it('a corporation someone else chose says who, except Novel Corporation', () => {
    const list = suggestCorps('', { Helion: 'Ana', 'Novel Corporation': 'Beto' })
    expect(list.find((x) => x.label === 'Helion')!.takenBy).toBe('Ana')
    expect(list.find((x) => x.label === 'Novel Corporation')!.takenBy).toBeUndefined()
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

  it('with Turmoil the payload carries the turmoil points; without it, null', () => {
    const s = stateFromGame({ ...game, expansions: ['Turmoil'], player_results: game.player_results.map((r) => ({ ...r, scores: { ...r.scores, turmoil_points: 4 } })) }, {})
    expect(toPayload(s).player_results.map((r) => r.scores.turmoil_points)).toEqual([4, 4])
    expect(toPayload({ ...s, expansions: [] }).player_results.map((r) => r.scores.turmoil_points)).toEqual([null, null])
  })
})
