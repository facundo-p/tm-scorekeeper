import { describe, it, expect } from 'vitest'
import { MAP_MILESTONES, MAP_AWARDS, EXPANSION_MILESTONES, EXPANSION_AWARDS, MAX_MILESTONES, MAX_AWARDS, MIN_PLAYERS, MAX_PLAYERS } from '@/constants/gameRules'
import { Expansion, MapName, Milestone, Award } from '@/constants/enums'

const ALL_MAPS = Object.values(MapName)

describe('MAP_MILESTONES', () => {
  it('defines milestones for every map', () => {
    ALL_MAPS.forEach((map) => {
      expect(MAP_MILESTONES[map], `Missing milestones for ${map}`).toBeDefined()
    })
  })

  it('has exactly 5 milestones per map', () => {
    ALL_MAPS.forEach((map) => {
      expect(MAP_MILESTONES[map]).toHaveLength(5)
    })
  })

  it('has no duplicate milestones within a map', () => {
    ALL_MAPS.forEach((map) => {
      const values = MAP_MILESTONES[map]
      expect(new Set(values).size).toBe(values.length)
    })
  })
})

describe('MAP_AWARDS', () => {
  it('defines awards for every map', () => {
    ALL_MAPS.forEach((map) => {
      expect(MAP_AWARDS[map], `Missing awards for ${map}`).toBeDefined()
    })
  })

  it('has exactly 5 awards per map', () => {
    ALL_MAPS.forEach((map) => {
      expect(MAP_AWARDS[map]).toHaveLength(5)
    })
  })

  it('has no duplicate awards within a map', () => {
    ALL_MAPS.forEach((map) => {
      const values = MAP_AWARDS[map]
      expect(new Set(values).size).toBe(values.length)
    })
  })
})

describe('game constants', () => {
  it('enforces expected limits', () => {
    expect(MAX_MILESTONES).toBe(3)
    expect(MAX_AWARDS).toBe(3)
    expect(MIN_PLAYERS).toBe(2)
    expect(MAX_PLAYERS).toBe(5)
  })
})

describe('EXPANSION_MILESTONES', () => {
  it('Venus Next includes HOVERLORD', () => {
    expect(EXPANSION_MILESTONES[Expansion.VENUS_NEXT]).toContain(Milestone.HOVERLORD)
  })

  it('other expansions have no milestones defined', () => {
    expect(EXPANSION_MILESTONES[Expansion.PRELUDE]).toBeUndefined()
    expect(EXPANSION_MILESTONES[Expansion.COLONIES]).toBeUndefined()
    expect(EXPANSION_MILESTONES[Expansion.TURMOIL]).toBeUndefined()
  })
})

describe('EXPANSION_AWARDS', () => {
  it('Venus Next includes VENUPHILE', () => {
    expect(EXPANSION_AWARDS[Expansion.VENUS_NEXT]).toContain(Award.VENUPHILE)
  })

  it('other expansions have no awards defined', () => {
    expect(EXPANSION_AWARDS[Expansion.PRELUDE]).toBeUndefined()
    expect(EXPANSION_AWARDS[Expansion.COLONIES]).toBeUndefined()
    expect(EXPANSION_AWARDS[Expansion.TURMOIL]).toBeUndefined()
  })
})
