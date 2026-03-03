import { describe, it, expect } from 'vitest'
import { calcMilestonePoints, calcAwardPoints, calcRunningTotal } from '@/utils/gameCalculations'
import { Milestone, Award } from '@/constants/enums'
import type { AwardResultDTO } from '@/types'

describe('calcMilestonePoints', () => {
  it('returns 0 for no milestones', () => {
    expect(calcMilestonePoints([])).toBe(0)
  })

  it('returns 5 per milestone', () => {
    expect(calcMilestonePoints([Milestone.TERRAFORMER])).toBe(5)
    expect(calcMilestonePoints([Milestone.TERRAFORMER, Milestone.MAYOR])).toBe(10)
    expect(calcMilestonePoints([Milestone.TERRAFORMER, Milestone.MAYOR, Milestone.GARDENER])).toBe(15)
  })
})

describe('calcAwardPoints', () => {
  const awards: AwardResultDTO[] = [
    { name: Award.CULTIVATOR, opened_by: 'p1', first_place: ['p1'], second_place: ['p2'] },
    { name: Award.MAGNATE, opened_by: 'p2', first_place: ['p2', 'p3'], second_place: [] },
  ]

  it('returns 0 when player has no positions', () => {
    expect(calcAwardPoints('p4', awards)).toBe(0)
  })

  it('counts 5 pts for first place', () => {
    expect(calcAwardPoints('p1', awards)).toBe(5)
  })

  it('counts 2 pts for second place', () => {
    expect(calcAwardPoints('p2', [{ name: Award.CULTIVATOR, opened_by: 'p1', first_place: ['p1'], second_place: ['p2'] }])).toBe(2)
  })

  it('counts 5 pts for each tied first place player', () => {
    // awards[1] = MAGNATE: p2 and p3 are tied first (no second place)
    const tiedAwards: AwardResultDTO[] = [
      { name: Award.MAGNATE, opened_by: 'p1', first_place: ['p2', 'p3'], second_place: [] },
    ]
    expect(calcAwardPoints('p2', tiedAwards)).toBe(5)
    expect(calcAwardPoints('p3', tiedAwards)).toBe(5)
  })

  it('accumulates across multiple awards', () => {
    const multiAwards: AwardResultDTO[] = [
      { name: Award.CULTIVATOR, opened_by: 'p1', first_place: ['p1'], second_place: ['p2'] },
      { name: Award.MAGNATE, opened_by: 'p1', first_place: ['p1'], second_place: ['p2'] },
    ]
    expect(calcAwardPoints('p1', multiAwards)).toBe(10)
    expect(calcAwardPoints('p2', multiAwards)).toBe(4)
  })
})

describe('calcRunningTotal', () => {
  it('returns 0 for empty scores', () => {
    expect(calcRunningTotal({})).toBe(0)
  })

  it('sums all provided fields', () => {
    expect(
      calcRunningTotal({
        terraform_rating: 20,
        milestone_points: 10,
        award_points: 5,
        card_points: 15,
        card_resource_points: 3,
        greenery_points: 4,
        city_points: 2,
        turmoil_points: 1,
      }),
    ).toBe(60)
  })

  it('treats null turmoil as 0', () => {
    expect(calcRunningTotal({ terraform_rating: 20, turmoil_points: null })).toBe(20)
  })

  it('ignores undefined fields', () => {
    expect(calcRunningTotal({ terraform_rating: 25 })).toBe(25)
  })
})
