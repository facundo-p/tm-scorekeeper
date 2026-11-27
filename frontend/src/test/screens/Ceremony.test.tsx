import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
const apiWith = (report: unknown) => (url: string) => ok(url.includes('/players') ? PLAYERS : report)
const api = apiWith(REPORT)

/** Partida con Turmoil, empate en puntos resuelto por M€, un récord y un logro. */
const TIED = {
  ...REPORT,
  game: { ...REPORT.game, expansions: ['Turmoil'] },
  results: [
    { ...REPORT.results[0], total_points: 85, mc_total: 12, scores: { terraform_rating: 30, card_points: 50, turmoil_points: 5, milestones: [] } },
    { ...REPORT.results[1], total_points: 85, mc_total: 4, scores: { terraform_rating: 28, card_points: 52, turmoil_points: 5, milestones: [] } },
  ],
  margin: 0, decided_by_mc: true,
  records_broken: [{ code: 'max_greenery', title: 'Rey de los bosques', description: '', player_id: 'a', holders: ['a'], value: 23, previous: { value: 20, player_id: 'b', holders: ['b'] } }],
  achievements_by_player: { a: [{ code: 'metropolis', title: 'Metrópolis', glyph: 'city', tier: 2, max_tier: 3, is_new: true, levels: 1 }] },
}

/** Avanza `n` fases de 950 ms, de a una: cada temporizador se arma después de renderizar. */
const steps = (n: number) => { for (let i = 0; i < n; i++) act(() => { vi.advanceTimersByTime(950) }) }

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

  it('walks the sequence on its own: one step per category (Turmoil included), then the winner by M€, records and achievements', async () => {
    vi.stubGlobal('fetch', vi.fn(apiWith(TIED)))
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      renderAt('/partidas/g-1/ceremonia')
      expect(await screen.findByRole('heading', { level: 1, name: 'Puntaje final' })).toBeInTheDocument()
      act(() => { vi.advanceTimersByTime(700) })
      expect(screen.getByText('Sumando Terraform Rating')).toBeInTheDocument()
      steps(7)
      expect(screen.getByText('Sumando Turmoil')).toBeInTheDocument()
      steps(1)
      expect(screen.getByText('Helion, 85 puntos, por desempate de M€')).toBeInTheDocument()
      steps(4)
    } finally {
      vi.useRealTimers()
    }
    expect(screen.getByRole('region', { name: 'Récords' })).toHaveTextContent('Rey de los bosques')
    expect(screen.getByRole('region', { name: 'Logros' })).toHaveTextContent('Ana, nivel 2')
    expect(screen.getByRole('heading', { level: 1, name: 'Puntaje final' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Saltar animación' })).toBeNull()
  })

  it('after skipping, focus lands on the winner', async () => {
    renderAt('/partidas/g-1/ceremonia')
    fireEvent.click(await screen.findByRole('button', { name: 'Saltar animación' }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Ana' })))
  })

  it('an unknown game says so', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => (url.includes('/players') ? api(url) : Promise.resolve(new Response('{}', { status: 404 })))))
    renderAt('/partidas/nada/ceremonia')
    expect(await screen.findByText('Esta partida no está en el archivo')).toBeInTheDocument()
  })
})
