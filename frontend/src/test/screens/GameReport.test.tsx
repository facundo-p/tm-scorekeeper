import { describe, it, expect, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { createQueryClient } from '@/data/query'
import GameReport from '@/screens/GameReport/GameReport'

const REPORT = {
  game: { id: 'g-1', date: '2026-01-10', map: 'Tharsis', expansions: [], draft: false, generations: 10, awards: [] },
  results: [
    { player_id: 'a', player_name: 'Ana', corporation: 'Helion', position: 1, tied: false, total_points: 90, mc_total: 10, scores: { terraform_rating: 30, milestones: [] } },
    { player_id: 'b', player_name: 'Beto', corporation: 'Ecoline', position: 2, tied: false, total_points: 80, mc_total: 5, scores: { terraform_rating: 28, milestones: [] } },
  ],
  winners: ['a'], margin: 10, decided_by_mc: false, elo: [], records_broken: [], near: [], achievements_by_player: {},
}
const PLAYERS = [{ player_id: 'a', name: 'Ana', color: 'rojo', is_active: true, elo: 1000, since: '2026-01-10', seq: 1 },
  { player_id: 'b', name: 'Beto', color: 'azul', is_active: true, elo: 1000, since: '2026-01-10', seq: 2 }]

function Where() {
  const { pathname, search } = useLocation()
  return <span data-testid="where">{pathname + search}</span>
}

function setup(responses: (url: string, init?: RequestInit) => Response) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => Promise.resolve(responses(url, init)))
  vi.stubGlobal('fetch', fetchMock)
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/partidas/g-1']}>
        <Routes><Route path="/partidas/:gameId" element={<GameReport />} /><Route path="/partidas" element={<p>archivo</p>} /></Routes>
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return fetchMock
}

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
const api = (url: string, init?: RequestInit) => {
  if (init?.method === 'DELETE') return new Response(null, { status: 204 })
  return url.includes('/players') ? ok(PLAYERS) : ok(REPORT)
}

describe('Informe de partida', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows the winner, the score and the board', async () => {
    setup(api)
    expect(await screen.findByRole('heading', { name: 'Tharsis', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Helion, 10 puntos sobre Beto')).toBeInTheDocument()
    expect(screen.getByText('Esta partida no rompió récords.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver tabla' }))
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('deleting asks first, calls the API and goes back to the archive with a notice', async () => {
    const fetchMock = setup(api)
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('No se puede deshacer')
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar partida' }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/partidas?aviso=eliminada'))
    expect(fetchMock.mock.calls.some(([u, i]) => String(u).endsWith('/games/g-1') && i?.method === 'DELETE')).toBe(true)
  })

  it('an unknown game says so', async () => {
    setup((url) => (url.includes('/players') ? ok(PLAYERS) : new Response(JSON.stringify({ detail: 'Game not found' }), { status: 404 })))
    expect(await screen.findByText('Esta partida no está en el archivo')).toBeInTheDocument()
  })

  it('after deleting, the gone report (404) does not stop the way back to the archive', async () => {
    let deleted = false
    setup((url, init) => {
      if (init?.method === 'DELETE') { deleted = true; return new Response(null, { status: 204 }) }
      if (url.includes('/players')) return ok(PLAYERS)
      return deleted ? new Response(JSON.stringify({ detail: 'Game not found' }), { status: 404 }) : ok(REPORT)
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar partida' }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/partidas?aviso=eliminada'))
    expect(screen.getByText('archivo')).toBeInTheDocument()
  })
})
