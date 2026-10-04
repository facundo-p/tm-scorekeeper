import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { MesaFilter, MesaNotice, useMesaParam } from '@/ui/MesaFilter'

function Probe() {
  const [mesa, setMesa] = useMesaParam()
  const { search } = useLocation()
  return (
    <>
      <MesaFilter value={mesa} onChange={setMesa} />
      <MesaNotice value={mesa} onClear={() => setMesa(null)}>12 partidas</MesaNotice>
      <span data-testid="search">{search}</span>
    </>
  )
}

const renderAt = (url: string) => render(<MemoryRouter initialEntries={[url]}><Probe /></MemoryRouter>)

describe('filtro de mesa', () => {
  it('reads the mesa from the URL and ignores invalid values', () => {
    renderAt('/ranking?mesa=7')
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('choosing a size writes ?mesa= and shows the notice; tapping it again clears it', () => {
    renderAt('/ranking?tab=x')
    fireEvent.click(screen.getByRole('button', { name: 'Mesas de 3 jugadores' }))
    expect(screen.getByRole('status')).toHaveTextContent('Solo partidas de 3 jugadores · 12 partidas')
    expect(screen.getByTestId('search')).toHaveTextContent('?tab=x&mesa=3')
    fireEvent.click(screen.getByRole('button', { name: 'Mesas de 3 jugadores' }))
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByTestId('search')).toHaveTextContent(/^\?tab=x$/)
  })

  it('the notice clears the filter', () => {
    renderAt('/?mesa=5')
    fireEvent.click(screen.getByRole('button', { name: 'Quitar' }))
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
  })
})
