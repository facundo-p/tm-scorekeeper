import { describe, it, expect } from 'vitest'
import { cssVars } from '@/domain/cssVars'

describe('cssVars', () => {
  it('prefija las claves con -- y conserva números y textos', () => {
    expect(cssVars({ w: '40%', hue: 120 })).toEqual({ '--w': '40%', '--hue': 120 })
  })

  it('omite null y undefined', () => {
    expect(cssVars({ a: null, b: undefined, c: 0 })).toEqual({ '--c': 0 })
  })
})
