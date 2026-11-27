import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState, ErrorState, LoadingState } from '@/ui/states'

describe('estados', () => {
  it('carga anuncia su estado', () => {
    render(<LoadingState />)
    expect(screen.getByRole('status')).toHaveTextContent('Sincronizando con el archivo')
  })

  it('error alerta y reintenta', async () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Se perdió el enlace')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('vacío con título, texto y acción', () => {
    render(<EmptyState title="Ninguna partida coincide" action={<button type="button">Quitar filtros</button>}>Probá con otro filtro.</EmptyState>)
    expect(screen.getByText('Ninguna partida coincide')).toBeInTheDocument()
    expect(screen.getByText('Probá con otro filtro.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quitar filtros' })).toBeInTheDocument()
  })
})
