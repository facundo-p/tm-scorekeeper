import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useConfetti } from '@/screens/Ceremony/useConfetti'

const cancel = vi.fn()
const burst = vi.fn((..._args: unknown[]) => cancel)
vi.mock('@/fx/confetti', () => ({ burst: (...args: unknown[]) => burst(...args) }))

const refs = () => ({ canvas: { current: document.createElement('canvas') }, target: { current: document.createElement('h2') } })

describe('useConfetti', () => {
  beforeEach(() => { burst.mockClear(); cancel.mockClear() })

  it('bursts once when it turns on, keeps going on later phases and stops only on unmount', () => {
    const { canvas, target } = refs()
    const { rerender, unmount } = renderHook(({ on }) => useConfetti(on, canvas, target, ['rojo', undefined]), { initialProps: { on: false } })
    expect(burst).not.toHaveBeenCalled()
    rerender({ on: true })
    expect(burst).toHaveBeenCalledTimes(1)
    expect(burst.mock.calls[0][1]).toMatchObject({ colors: expect.any(Array), x: 0.5, y: 0.3 })
    rerender({ on: false })
    rerender({ on: true })
    expect(burst).toHaveBeenCalledTimes(1)
    expect(cancel).not.toHaveBeenCalled()
    unmount()
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('never bursts when it never turns on (skipping the animation)', () => {
    const { canvas, target } = refs()
    renderHook(() => useConfetti(false, canvas, target, [])).unmount()
    expect(burst).not.toHaveBeenCalled()
  })
})
