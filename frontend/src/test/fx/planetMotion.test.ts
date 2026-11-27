import { describe, it, expect } from 'vitest'
import { initialPose, parkedTarget, settling, slotTarget, step, type Spin } from '@/fx/planet/motion'

const ctx = (over: Partial<Parameters<typeof step>[2]> = {}) => ({
  dt: 0.016, still: false, first: false, spin: { angle: 0, vel: 0, dragging: false } as Spin, pointer: { x: 0, y: 0 }, ...over,
})

describe('motor del planeta (lo puro)', () => {
  it('without a slot the planet parks low on the right, dimmed', () => {
    const t = parkedTarget(1000, 800)
    expect(t).toMatchObject({ parked: true, x: 720, r: 620, bright: 0.42, glow: 0.8 })
    expect(t.y).toBeCloseTo(800 + 620 * 0.52)
  })

  it('a slot target is its centre and radius in unscaled frame px', () => {
    const t = slotTarget({ left: 110, top: 60, width: 200, height: 100 }, { left: 10, top: 10, width: 500, height: 500 }, 0.5, { region: 'Hellas' })
    expect(t).toMatchObject({ x: 400, y: 200, r: 100, region: 'Hellas', terra: 0.15 })
  })

  it('reduced motion (and the first frame) lands on the target at once', () => {
    const cur = initialPose()
    const t = parkedTarget(1000, 800)
    step(cur, t, ctx({ still: true }))
    expect(settling(cur, t)).toBe(false)
    expect(cur.bright).toBe(t.bright)
  })

  it('otherwise it eases towards the target', () => {
    const cur = initialPose()
    const t = parkedTarget(1000, 800)
    step(cur, t, ctx())
    expect(cur.x).toBeGreaterThan(0)
    expect(cur.x).toBeLessThan(t.x)
    expect(settling(cur, t)).toBe(true)
  })

  it('a region turns the globe to show it; without one it keeps rotating unless still', () => {
    const toHellas = initialPose()
    step(toHellas, { ...parkedTarget(10, 10), region: 'Hellas' }, ctx({ first: true }))
    expect(toHellas.fLon).toBeCloseTo((70 * Math.PI) / 180)
    expect(toHellas.yaw).toBeCloseTo((-70 * Math.PI) / 180)
    const free = initialPose()
    step(free, parkedTarget(10, 10), ctx())
    expect(free.yaw).not.toBe(initialPose().yaw)
    const still = initialPose()
    step(still, parkedTarget(10, 10), ctx({ still: true }))
    expect(still.yaw).toBeCloseTo(initialPose().yaw, 12)
  })

  it('a released spin loses speed', () => {
    const spin: Spin = { angle: 0, vel: 2, dragging: false }
    step(initialPose(), parkedTarget(10, 10), ctx({ spin, dt: 0.05 }))
    expect(spin.vel).toBeLessThan(2)
    expect(spin.angle).not.toBe(0)
  })
})
