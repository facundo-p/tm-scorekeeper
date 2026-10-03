import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { onActivateKey } from '@/utils/a11y'

describe('onActivateKey', () => {
  it('Enter y Espacio activan y cancelan la acción por defecto; otras teclas no', () => {
    const action = vi.fn()
    render(<div role="button" tabIndex={0} onKeyDown={onActivateKey(action)}>x</div>)
    const el = screen.getByRole('button')
    expect(fireEvent.keyDown(el, { key: 'Enter' })).toBe(false)
    fireEvent.keyDown(el, { key: ' ' })
    expect(fireEvent.keyDown(el, { key: 'a' })).toBe(true)
    expect(action).toHaveBeenCalledTimes(2)
  })

  it('ignora las teclas que suben desde un control hijo', () => {
    const action = vi.fn()
    const edit = vi.fn()
    render(
      <div role="link" tabIndex={0} onKeyDown={onActivateKey(action)}>
        <button type="button" onClick={edit}>Editar</button>
      </div>,
    )
    expect(fireEvent.keyDown(screen.getByRole('button', { name: 'Editar' }), { key: 'Enter' })).toBe(true)
    expect(action).not.toHaveBeenCalled()
  })
})
