import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LAYERS, twinkles } from '@/fx/stars'
import { Sky } from '@/shell/Sky'

describe('cielo', () => {
  it('draws one canvas per layer and the 14 twinkling stars, hidden from assistive tech', () => {
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
    const { container } = render(<Sky />)
    expect(container.querySelectorAll('canvas')).toHaveLength(LAYERS.length)
    expect(container.querySelectorAll('i')).toHaveLength(15) // 14 titileos + el meteoro
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('twinkles are deterministic (same sky on every load, like the mockup)', () => {
    expect(twinkles()).toEqual(twinkles())
    expect(twinkles()[0].left).toMatch(/^\d+(\.\d+)?%$/)
  })
})
