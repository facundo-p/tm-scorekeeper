import { describe, it, expect } from 'vitest'
import { MapName, Expansion, Milestone, Award, Corporation } from '@/constants/enums'

// Verifies that frontend enum string values match the backend definitions exactly.
// If the backend changes an enum value, this test will catch the mismatch.

describe('MapName enum values', () => {
  it('matches backend string values', () => {
    expect(MapName.HELLAS).toBe('Hellas')
    expect(MapName.THARSIS).toBe('Tharsis')
    expect(MapName.ELYSIUM).toBe('Elysium')
    expect(MapName.BOREALIS).toBe('Vastitas Borealis')
    expect(MapName.AMAZONIS).toBe('Amazonis Planitia')
  })

  it('has exactly 5 maps', () => {
    expect(Object.keys(MapName)).toHaveLength(5)
  })
})

describe('Expansion enum values', () => {
  it('matches backend string values', () => {
    expect(Expansion.PRELUDE).toBe('Prelude')
    expect(Expansion.COLONIES).toBe('Colonies')
    expect(Expansion.TURMOIL).toBe('Turmoil')
    expect(Expansion.VENUS_NEXT).toBe('Venus next')
  })

  it('has exactly 4 expansions', () => {
    expect(Object.keys(Expansion)).toHaveLength(4)
  })
})

describe('Milestone enum values', () => {
  it('has exactly 26 milestones (5 per map + 1 Venus Next)', () => {
    expect(Object.keys(Milestone)).toHaveLength(26)
  })

  it('all values are non-empty strings', () => {
    Object.values(Milestone).forEach((v) => {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    })
  })
})

describe('Award enum values', () => {
  it('has exactly 26 awards (5 per map + 1 Venus Next)', () => {
    expect(Object.keys(Award)).toHaveLength(26)
  })

  it('all values are non-empty strings', () => {
    Object.values(Award).forEach((v) => {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    })
  })
})

describe('Corporation enum values', () => {
  it('has exactly 44 corporations (12 base + 9 Prelude + 5 VenusNext + 6 Colonies + 6 Turmoil + 6 Prelude2)', () => {
    expect(Object.keys(Corporation)).toHaveLength(44)
  })

  it('includes base game corporations', () => {
    expect(Corporation.CREDICOR).toBe('Credicor')
    expect(Corporation.ECOLINE).toBe('Ecoline')
    expect(Corporation.THARSIS_REPUBLIC).toBe('Tharsis Republic')
  })

  it('includes Prelude 2 corporations', () => {
    expect(Corporation.CHEUNG_SHING_MARS).toBe('Cheung Shing Mars')
    expect(Corporation.SAGITTA).toBe('Sagitta')
  })
})
