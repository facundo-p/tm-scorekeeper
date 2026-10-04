import { describe, it, expect, vi, afterEach } from 'vitest'
import { advance, burst, makePieces } from '@/fx/confetti'

describe('confeti', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('pieces start at the origin, upwards, in the given colours', () => {
    let n = 0
    const random = () => ((n += 0.37) % 1)
    const pieces = makePieces(200, 100, { x: 0.5, y: 0.5, colors: ['#a', '#b'], count: 20, random })
    expect(pieces).toHaveLength(20)
    expect(pieces.every((p) => p.x === 100 && p.y === 50 && p.vy < 0)).toBe(true)
    expect(new Set(pieces.map((p) => p.c))).toEqual(new Set(['#a', '#b']))
  })

  it('a piece falls and fades out', () => {
    const [p] = makePieces(100, 100, { count: 1, random: () => 0.5 })
    let frames = 0
    while (advance(p, 1, 100)) frames++
    expect(frames).toBeGreaterThan(10)
    expect(frames).toBeLessThan(200)
  })

  it('does nothing with reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const raf = vi.fn()
    vi.stubGlobal('requestAnimationFrame', raf)
    burst(document.createElement('canvas'))()
    expect(raf).not.toHaveBeenCalled()
  })
})
