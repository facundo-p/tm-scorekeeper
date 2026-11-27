import { describe, it, expect, vi, afterEach } from 'vitest'
import { createPlanetStage } from '@/fx/planet/stage'

/** WebGL2 de mentira: todo método devuelve algo verdadero; lo justo para crear y destruir el motor. */
function fakeGl() {
  const loseContext = vi.fn()
  const special: Record<string, unknown> = {
    ACTIVE_UNIFORMS: 'ACTIVE_UNIFORMS', isContextLost: () => false, getExtension: () => ({ loseContext }),
    getProgramParameter: (_p: unknown, key: unknown) => (key === 'ACTIVE_UNIFORMS' ? 0 : true),
  }
  const gl = new Proxy({}, { get: (_t, key: string) => special[key] ?? (() => ({})) })
  return { gl, loseContext }
}

function setup() {
  const host = document.createElement('div')
  const canvas = document.createElement('canvas')
  host.appendChild(canvas)
  document.body.appendChild(host)
  const { gl, loseContext } = fakeGl()
  canvas.getContext = (() => gl) as unknown as typeof canvas.getContext
  return { host, canvas, loseContext }
}

describe('motor del planeta', () => {
  afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })

  it('without WebGL2 it is a fallback stage', () => {
    const canvas = document.createElement('canvas')
    canvas.getContext = (() => null) as typeof canvas.getContext
    const stage = createPlanetStage(document.createElement('div'), canvas)
    expect(stage.supported).toBe(false)
    expect(document.documentElement.dataset.planet).toBe('fallback')
    stage.destroy()
    expect(document.documentElement.dataset.planet).toBeUndefined()
  })

  it('destroy() stops the loop and lets go of everything', () => {
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const { host, canvas, loseContext } = setup()
    const offHost = vi.spyOn(host, 'removeEventListener')
    const offDoc = vi.spyOn(document, 'removeEventListener')
    const stage = createPlanetStage(host, canvas)
    expect(stage.supported).toBe(true)
    expect(window.__TM_PLANET__).toBeDefined()
    stage.destroy()
    expect(cancel).toHaveBeenCalled()
    expect(offHost).toHaveBeenCalledWith('pointermove', expect.any(Function))
    expect(offDoc).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(window.__TM_PLANET__).toBeUndefined()
    expect(loseContext).toHaveBeenCalled()
  })

  it('a slot gains and loses dragging when `interactive` changes', () => {
    const { host, canvas } = setup()
    const stage = createPlanetStage(host, canvas)
    const el = document.createElement('div')
    const on = vi.spyOn(el, 'addEventListener')
    const off = vi.spyOn(el, 'removeEventListener')
    const slot = stage.addSlot(el, { interactive: false })
    expect(on).not.toHaveBeenCalled()
    slot.update({ interactive: true })
    expect(on).toHaveBeenCalledWith('pointerdown', expect.any(Function))
    slot.update({ interactive: false })
    expect(off).toHaveBeenCalledWith('pointerdown', expect.any(Function))
    stage.destroy()
  })
})
