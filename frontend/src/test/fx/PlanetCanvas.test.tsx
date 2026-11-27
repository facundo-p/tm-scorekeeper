import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render } from '@testing-library/react'
import { useContext } from 'react'
import { PlanetCanvas, PlanetProvider } from '@/fx/planet'
import { PlanetContext } from '@/fx/planet/context'

const create = vi.hoisted(() => vi.fn())
vi.mock('@/fx/planet/stage', () => ({ createPlanetStage: create }))

let seen: unknown = undefined
function Probe() {
  seen = useContext(PlanetContext).stage
  return null
}

const mount = () => render(<PlanetProvider><div data-device><div><PlanetCanvas /></div></div><Probe /></PlanetProvider>)

describe('PlanetCanvas', () => {
  beforeEach(() => { create.mockReset(); seen = undefined })
  afterEach(() => { delete document.documentElement.dataset.planet })

  it('creates the engine on the device and destroys it on unmount', async () => {
    const stage = { supported: true, addSlot: vi.fn(), destroy: vi.fn() }
    create.mockReturnValue(stage)
    const { unmount } = mount()
    await act(async () => {})
    const [host, canvas] = create.mock.calls[0]
    expect(host).toHaveAttribute('data-device')
    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
    expect(seen).toBe(stage)
    unmount()
    expect(stage.destroy).toHaveBeenCalled()
  })

  it('unmounting before the chunk arrives never creates the engine', async () => {
    const { unmount } = mount()
    unmount()
    await act(async () => {})
    expect(create).not.toHaveBeenCalled()
  })

  it('if the engine fails, the slots fall back to the CSS globe', async () => {
    create.mockImplementation(() => { throw new Error('chunk') })
    const { container } = mount()
    await act(async () => {})
    expect(seen).toMatchObject({ supported: false })
    expect(document.documentElement.dataset.planet).toBe('fallback')
    expect(container.querySelector('canvas')).toBeNull()
  })
})
