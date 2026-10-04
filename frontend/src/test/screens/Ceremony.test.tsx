import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { createQueryClient } from '@/data/query'
import Ceremony from '@/screens/Ceremony/Ceremony'

const REPORT = {
  game: { id: 'g-1', date: '2026-01-10', map: 'Tharsis', expansions: [], draft: false, generations: 10, awards: [] },
  results: [
    { player_id: 'a', player_name: 'Ana', corporation: 'Helion', position: 1, tied: false, total_points: 90, mc_total: 10, scores: { terraform_rating: 30, card_points: 60, milestones: [] } },
    { player_id: 'b', player_name: 'Beto', corporation: 'Ecoline', position: 2, tied: false, total_points: 80, mc_total: 5, scores: { terraform_rating: 28, card_points: 52, milestones: [] } },
  ],
  winners: ['a'], margin: 10, decided_by_mc: false, records_broken: [], near: [], achievements_by_player: {},
  elo: [{ player_id: 'a', elo_before: 1000, elo_after: 1016, delta: 16 }, { player_id: 'b', elo_before: 1000, elo_after: 984, delta: -16 }],
}
const PLAYERS = [{ player_id: 'a', name: 'Ana', color: 'rojo', is_active: true, elo: 1016, since: '2026-01-10', seq: 1 },
  { player_id: 'b', name: 'Beto', color: 'azul', is_active: true, elo: 984, since: '2026-01-10', seq: 2 }]

function Where() {
  return <span data-testid="where">{useLocation().pathname}</span>
}

const api = (url: string) => Promise.resolve(new Response(JSON.stringify(url.includes('/players') ? PLAYERS : REPORT), { status: 200 }))

const renderAt = (url: string) => render(
  <QueryClientProvider client={createQueryClient()}>
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/partidas/:gameId/ceremonia" element={<Ceremony />} />
        <Route path="*" element={<p>otra</p>} />
      </Routes>
      <Where />
    </MemoryRouter>
  </QueryClientProvider>,
)

describe('Ceremonia', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
    vi.stubGlobal('fetch', vi.fn(api))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('skipping the animation lands on the winner, ELO, records and achievements', async () => {
    renderAt('/partidas/g-1/ceremonia')
    fireEvent.click(await screen.findByRole('button', { name: 'Saltar animación' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Ana' })).toBeInTheDocument()
    expect(screen.getByText('Helion, 90 puntos, 10 sobre Beto')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Cambios de ELO' })).toHaveTextContent('Beto')
    expect(screen.getByRole('region', { name: 'Récords' })).toHaveTextContent('Ningún récord nuevo esta vez.')
    expect(screen.getByRole('region', { name: 'Logros' })).toHaveTextContent('Nadie desbloqueó logros en esta partida.')
    expect(screen.queryByRole('button', { name: 'Saltar animación' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Ver informe completo' }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/partidas/g-1'))
  })

  it('with reduced motion it opens on the final results', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }))
    renderAt('/partidas/g-1/ceremonia')
    expect(await screen.findByText('Resultados finales')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Saltar animación' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/))
  })

  it('an unknown game says so', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => (url.includes('/players') ? api(url) : Promise.resolve(new Response('{}', { status: 404 })))))
    renderAt('/partidas/nada/ceremonia')
    expect(await screen.findByText('Esta partida no está en el archivo')).toBeInTheDocument()
  })
})
