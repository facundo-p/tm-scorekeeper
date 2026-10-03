import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet, SheetActions } from '@/ui/sheet'
import { Button } from '@/ui/atoms'

function Host({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  const close = () => { onClose(); setOpen(false) }
  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir hoja</Button>
      {open && (
        <Sheet title="Hoja de ejemplo" onClose={close}>
          <p>Texto</p>
          <SheetActions><Button onClick={close}>Cancelar</Button><Button variant="primary">Aceptar</Button></SheetActions>
        </Sheet>
      )}
    </>
  )
}

describe('Sheet', () => {
  it('es un diálogo modal rotulado por su título, con el foco en el primer control', async () => {
    render(<Host />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir hoja' }))
    const dialog = screen.getByRole('dialog', { name: 'Hoja de ejemplo' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus()
  })

  it('atrapa el foco con Tab y Shift+Tab', async () => {
    render(<Host />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir hoja' }))
    await userEvent.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Aceptar' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus()
  })

  it('Escape cierra y devuelve el foco al botón que la abrió', async () => {
    const onClose = vi.fn()
    render(<Host onClose={onClose} />)
    const opener = screen.getByRole('button', { name: 'Abrir hoja' })
    await userEvent.click(opener)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('el clic en el fondo cierra; dentro del diálogo no', async () => {
    const onClose = vi.fn()
    render(<Host onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir hoja' }))
    fireEvent.click(screen.getByText('Texto'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('se monta en #overlays si existe', async () => {
    const layer = document.createElement('div')
    layer.id = 'overlays'
    document.body.appendChild(layer)
    render(<Host />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir hoja' }))
    expect(layer.querySelector('[role="dialog"]')).not.toBeNull()
    layer.remove()
  })
})
