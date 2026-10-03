import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { onActivateKey } from '@/utils/a11y'

describe('onActivateKey', () => {
  it('Enter y Espacio activan; otras teclas no', () => {
    const action = vi.fn()
    render(<div role="button" tabIndex={0} onKeyDown={onActivateKey(action)}>x</div>)
    const el = screen.getByRole('button')
    fireEvent.keyDown(el, { key: 'Enter' })
    fireEvent.keyDown(el, { key: ' ' })
    fireEvent.keyDown(el, { key: 'a' })
    expect(action).toHaveBeenCalledTimes(2)
  })
})
