import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlanetContext } from '@/fx/planet/context'
import { PlanetSlot } from '@/fx/planet'
import type { PlanetStage } from '@/fx/planet/stage'

const stageOf = (supported: boolean) => {
  const handle = { update: vi.fn(), remove: vi.fn() }
  const stage: PlanetStage = { supported, addSlot: vi.fn(() => handle), destroy: vi.fn() }
  return { stage, handle }
}

const renderWith = (stage: PlanetStage | null, ui: React.ReactElement) =>
  render(<PlanetContext.Provider value={{ stage, setStage: () => {} }}>{ui}</PlanetContext.Provider>)

describe('PlanetSlot', () => {
  it('registers with the stage, follows its params and leaves on unmount', () => {
    const { stage, handle } = stageOf(true)
    const { rerender, unmount } = renderWith(stage, <PlanetSlot region="Hellas" />)
    expect(stage.addSlot).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({ region: 'Hellas', terra: 0.15 }))
    rerender(<PlanetContext.Provider value={{ stage, setStage: () => {} }}><PlanetSlot region="Elysium" /></PlanetContext.Provider>)
    expect(handle.update).toHaveBeenLastCalledWith(expect.objectContaining({ region: 'Elysium' }))
    unmount()
    expect(handle.remove).toHaveBeenCalled()
  })

  it('without WebGL2 it paints the CSS globe', () => {
    const { stage } = stageOf(false)
    const { container } = renderWith(stage, <PlanetSlot label="Marte, Hellas" />)
    expect(stage.addSlot).not.toHaveBeenCalled()
    expect(screen.getByRole('img', { name: 'Marte, Hellas' })).toBeInTheDocument()
    expect(container.querySelector('[data-planet-slot] span[aria-hidden="true"]')).not.toBeNull()
  })

  it('while the engine loads it is an empty slot', () => {
    const { container } = renderWith(null, <PlanetSlot />)
    expect(container.querySelector('[data-planet-slot]')?.childElementCount).toBe(0)
  })
})
