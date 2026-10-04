import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { createQueryClient } from '@/data/query'
import Home from '@/screens/Home/Home'

const race = { category: 'total', games: 12, qualified: [{ player_id: 'p-facu', games: 5, avg: 92.4, best: 110 }], pending: [{ player_id: 'p-nico', games: 1, avg: 80, best: 80, missing: 2 }] }
const season = { number: 3, start: '2026-05-01', end: null, games: [], temp: 0, oxygen: 0, oceans: 0, temperature: -4, oxygen_pct: 9, ocean_count: 6, pct: 0.57, race, champion: null }
const API: Record<string, unknown> = {
  '/seasons/current': season,
  '/stats/summary': { view: 'all', games: 63, generations: 640, avg_winner: 98, avg_generations: 10, first: null, last: null, top_corp: { name: 'Helion', games: 9, wins: 3, avg: 90, avg_pos: 2 }, corps_used: 20, top_map: null },
  '/games/summaries': [{ id: 'g-063', date: '2026-09-27' }],
  '/games/g-063/report': {
    game: { id: 'g-063', date: '2026-09-27', map: 'Tharsis', expansions: [], draft: true, generations: 10 },
    results: [{ player_id: 'p-facu', player_name: 'Facu', corporation: 'Helion', position: 1, tied: false, total_points: 98, mc_total: 20, scores: {} }],
    winners: ['p-facu'], margin: 7, decided_by_mc: false, elo: [], records_broken: [{ code: 'x', title: 'X', player_id: 'p-facu' }], achievements_by_player: {},
  },
  '/ranking': { view: 'all', lead_changes: [], players: [{ player_id: 'p-facu', name: 'Facu', color: 'rojo', rank: 1, elo: 1172, peak: 1200, last_delta: 10, games: 30, wins: 10, win_rate: 0.3, form: [], archetype: null, elo_series: [] }] },
  '/feed': [{ date: '2026-09-27', type: 'record', game_id: 'g-063', player_id: 'p-facu', text: 'Facu rompió «X»' }],
  '/players': [{ player_id: 'p-facu', name: 'Facu', color: 'rojo', is_active: true, elo: 1172, since: '2025-03-08' }, { player_id: 'p-nico', name: 'Nico', color: 'azul', is_active: true, elo: 1100, since: '2025-03-08' }],
  '/seasons': { seasons: [{ ...season, number: 2, start: '2026-01-01', end: '2026-04-30', champion: 'p-nico' }], champions: [] },
}

function api(url: string) {
  const path = new URL(url, 'http://x').pathname.replace(/\/$/, '').replace(/^\/api/, '')
  return Promise.resolve(new Response(JSON.stringify(API[path] ?? {}), { status: 200 }))
}

function Where() {
  const { search } = useLocation()
  return <span data-testid="search">{search}</span>
}

const renderHome = (url = '/') => render(
  <QueryClientProvider client={createQueryClient()}>
    <MemoryRouter initialEntries={[url]}><Home /><Where /></MemoryRouter>
  </QueryClientProvider>,
)

describe('Inicio', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn(api)))
  afterEach(() => vi.unstubAllGlobals())

  it('shows the season, the last game, the logbook, the council and the race', async () => {
    renderHome()
    expect(await screen.findByRole('heading', { name: 'Marte, temporada 3' })).toBeInTheDocument()
    expect(screen.getByText('57 % terraformado.')).toBeInTheDocument()
    expect(screen.getByText('Helion, por 7 puntos')).toBeInTheDocument()
    expect(screen.getByText('1 récords rotos')).toBeInTheDocument()
    expect(screen.getByText('Facu rompió «X»')).toBeInTheDocument()
    expect(screen.getByText('1172')).toBeInTheDocument()
    expect(screen.getByText('92,4')).toBeInTheDocument()
    expect(screen.getByText('le faltan 2 partidas')).toBeInTheDocument()
  })

  it('the race category and table size live in the URL', async () => {
    renderHome('/?mesa=3')
    fireEvent.click(await screen.findByRole('button', { name: 'Cartas' }))
    expect(screen.getByTestId('search')).toHaveTextContent('?mesa=3&cat=card_points')
    expect(screen.getByRole('status')).toHaveTextContent('Solo partidas de 3 jugadores')
    const calls = vi.mocked(fetch).mock.calls.map(([u]) => String(u))
    expect(calls.some((u) => u.includes('/seasons/current?player_count=3'))).toBe(true)
  })

  it('the rules sheet lists past champions', async () => {
    renderHome()
    fireEvent.click(await screen.findByRole('button', { name: 'Cómo avanza la temporada' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(await screen.findByText('Temporada 2')).toBeInTheDocument()
    expect(screen.getAllByText('Nico').length).toBeGreaterThan(0)
  })
})

describe('Inicio sin partidas', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows empty states instead of blank panels', async () => {
    const empty: Record<string, unknown> = {
      ...API, '/games/summaries': [], '/feed': [], '/ranking': { view: 'all', lead_changes: [], players: [] },
      '/seasons/current': { ...season, race: { category: 'total', games: 0, qualified: [], pending: [] } },
    }
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      const path = new URL(url, 'http://x').pathname.replace(/\/$/, '').replace(/^\/api/, '')
      return Promise.resolve(new Response(JSON.stringify(empty[path] ?? {}), { status: 200 }))
    }))
    renderHome()
    expect(await screen.findByText(/Todavía no hay partidas en el archivo/)).toBeInTheDocument()
    expect(screen.getByText('Todavía no hay novedades en el archivo.')).toBeInTheDocument()
    expect(screen.getByText('El ranking aparece con la primera partida.')).toBeInTheDocument()
    expect(screen.getByText('Todavía no hay partidas para esta carrera.')).toBeInTheDocument()
  })
})
