import { describe, it, expect } from 'vitest'
import {
  validateStepGameSetup,
  validateStepPlayerSelection,
  validateStepCorpsAndTR,
  validateStepAwards,
  validateStepMilestones,
} from '@/utils/validation'
import { MapName, Award, Milestone, Corporation } from '@/constants/enums'
import type { AwardEntry, MilestoneEntry, PlayerFormData } from '@/pages/GameForm/GameForm.types'

const makePlayer = (id: string, corp: Corporation | ''): PlayerFormData => ({
  player_id: id,
  name: id,
  corporation: corp,
  terraform_rating: 20,
  mc_total: 0,
  card_resource_points: 0,
  card_points: 0,
  greenery_points: 0,
  city_points: 0,
  turmoil_points: null,
})

describe('validateStepGameSetup', () => {
  it('returns no errors for valid data', () => {
    expect(validateStepGameSetup({ date: '2024-01-01', map: MapName.THARSIS, generations: 12 })).toHaveLength(0)
  })

  it('requires date', () => {
    const errors = validateStepGameSetup({ date: '', map: MapName.THARSIS, generations: 12 })
    expect(errors.some((e) => e.includes('fecha'))).toBe(true)
  })

  it('requires map', () => {
    const errors = validateStepGameSetup({ date: '2024-01-01', map: '' as MapName, generations: 12 })
    expect(errors.some((e) => e.includes('mapa'))).toBe(true)
  })

  it('requires generations >= 1', () => {
    const errors = validateStepGameSetup({ date: '2024-01-01', map: MapName.THARSIS, generations: 0 })
    expect(errors.some((e) => e.includes('generaciones'))).toBe(true)
  })
})

describe('validateStepPlayerSelection', () => {
  it('returns no errors for valid selection', () => {
    expect(validateStepPlayerSelection(['p1', 'p2'])).toHaveLength(0)
  })

  it('rejects fewer than 2 players', () => {
    expect(validateStepPlayerSelection(['p1']).length).toBeGreaterThan(0)
  })

  it('rejects more than 5 players', () => {
    expect(validateStepPlayerSelection(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']).length).toBeGreaterThan(0)
  })
})

describe('validateStepCorpsAndTR', () => {
  it('returns no errors for distinct non-NOVEL corps', () => {
    const players = [makePlayer('p1', Corporation.CREDICOR), makePlayer('p2', Corporation.ECOLINE)]
    expect(validateStepCorpsAndTR(players)).toHaveLength(0)
  })

  it('rejects duplicate non-NOVEL corps', () => {
    const players = [makePlayer('p1', Corporation.CREDICOR), makePlayer('p2', Corporation.CREDICOR)]
    const errors = validateStepCorpsAndTR(players)
    expect(errors.some((e) => e.includes('misma corporación'))).toBe(true)
  })

  it('allows multiple players to choose NOVEL', () => {
    const players = [makePlayer('p1', Corporation.NOVEL), makePlayer('p2', Corporation.NOVEL)]
    expect(validateStepCorpsAndTR(players)).toHaveLength(0)
  })

  it('rejects duplicate non-NOVEL even when mixed with NOVEL', () => {
    const players = [
      makePlayer('p1', Corporation.NOVEL),
      makePlayer('p2', Corporation.CREDICOR),
      makePlayer('p3', Corporation.CREDICOR),
    ]
    const errors = validateStepCorpsAndTR(players)
    expect(errors.some((e) => e.includes('misma corporación'))).toBe(true)
  })
})

describe('validateStepAwards', () => {
  const validAward: AwardEntry = {
    name: Award.CULTIVATOR,
    opened_by: 'p1',
    first_place: ['p1'],
    second_place: [],
  }

  it('returns no errors for valid awards', () => {
    expect(validateStepAwards([validAward], 3)).toHaveLength(0)
  })

  it('rejects more than 3 awards', () => {
    const awards = [validAward, { ...validAward, name: Award.MAGNATE }, { ...validAward, name: Award.SPACE_BARON }, { ...validAward, name: Award.EXCENTRIC }]
    expect(validateStepAwards(awards, 3).some((e) => e.includes('máximo'))).toBe(true)
  })

  it('rejects duplicate award names', () => {
    const errors = validateStepAwards([validAward, validAward], 3)
    expect(errors.some((e) => e.includes('misma recompensa'))).toBe(true)
  })

  it('requires at least one first place player', () => {
    const errors = validateStepAwards([{ ...validAward, first_place: [] }], 3)
    expect(errors.some((e) => e.includes('primer puesto'))).toBe(true)
  })

  it('rejects player in both first and second place', () => {
    const errors = validateStepAwards([{ ...validAward, first_place: ['p1'], second_place: ['p1'] }], 3)
    expect(errors.some((e) => e.includes('1ro y 2do puesto'))).toBe(true)
  })

  it('rejects second place in a 2-player game', () => {
    const errors = validateStepAwards([{ ...validAward, first_place: ['p1'], second_place: ['p2'] }], 2)
    expect(errors.some((e) => e.includes('2 jugadores'))).toBe(true)
  })

  it('rejects second place when there is a tie in first place', () => {
    const errors = validateStepAwards([{ ...validAward, first_place: ['p1', 'p2'], second_place: ['p3'] }], 3)
    expect(errors.some((e) => e.includes('empate en 1ro'))).toBe(true)
  })
})

describe('validateStepMilestones', () => {
  const claimedMilestone: MilestoneEntry = {
    milestone: Milestone.TERRAFORMER,
    claimed: true,
    player_id: 'p1',
  }

  it('returns no errors for valid milestones', () => {
    expect(validateStepMilestones([claimedMilestone])).toHaveLength(0)
  })

  it('rejects more than 3 claimed milestones', () => {
    const milestones: MilestoneEntry[] = [
      { milestone: Milestone.TERRAFORMER, claimed: true, player_id: 'p1' },
      { milestone: Milestone.MAYOR, claimed: true, player_id: 'p2' },
      { milestone: Milestone.GARDENER, claimed: true, player_id: 'p3' },
      { milestone: Milestone.BUILDER, claimed: true, player_id: 'p1' },
    ]
    expect(validateStepMilestones(milestones).some((e) => e.includes('máximo'))).toBe(true)
  })

  it('requires player when milestone is claimed', () => {
    const errors = validateStepMilestones([{ milestone: Milestone.TERRAFORMER, claimed: true, player_id: '' }])
    expect(errors.some((e) => e.includes('jugador'))).toBe(true)
  })

  it('ignores unclaimed milestones', () => {
    const milestones: MilestoneEntry[] = [
      { milestone: Milestone.TERRAFORMER, claimed: false, player_id: '' },
      { milestone: Milestone.MAYOR, claimed: false, player_id: '' },
    ]
    expect(validateStepMilestones(milestones)).toHaveLength(0)
  })
})
