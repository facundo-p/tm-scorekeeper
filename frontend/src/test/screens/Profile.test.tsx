import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { createQueryClient } from '@/data/query'
import Profile from '@/screens/Profile/Profile'

const equity = { expected: 1.5, wins_vs_expected: 0.5, wins_ratio: 1.33, rel_pos: 0.6 }
const comp = { avg: { terraform_rating: 30, card_points: 12 }, share: { terraform_rating: 0.5, card_points: 0.2 } }
const insights = (games: number) => ({
  view: 'all', games, wins: 2, win_rate: 0.5, podium_rate: 0.75, avg_points: 82, avg_pos: 1.8, best: 101, best_game: 'g2',
  avg_milestones: 1.2, avg_awards: 0.8, points_per_gen: 8.1,
  favorites: { milestone: { names: ['Mayor'], count: 3 }, award: null }, composition: comp,
  archetype: { key: 'city_points', name: 'Urbanista', desc: 'Ciudades rodeadas de verde.', share: 0.2, group: 0.1, ratio: 2 },
  corps: [{ name: 'Helion', games: 3, wins: 2, avg: 85, avg_pos: 1.5 }], maps: [{ name: 'Tharsis', games: 4, wins: 2, avg: 82, avg_pos: 1.8 }],
  streak: { best: 2, current: 1 }, form: [{ position: 1, n: 3, game_id: 'g2' }],
  nemesis: { player_id: 'b', games: 4, ahead: 1, behind: 3, even: 0 }, victim: null, records_held: ['max_points'],
  rank: 1, rank_total: 2, equity, by_table: [{ n: 3, games, wins: 2, avg_points: 82, ...equity }], elo: 1050, peak: 1060, last_delta: 12,
  elo_series: [{ date: '2026-01-10', game_id: 'g1', elo: 1020, delta: 20 }, { date: '2026-02-10', game_id: 'g2', elo: 1050, delta: 30 }],
  history: [{ game_id: 'g2', date: '2026-02-10', map: 'Tharsis', position: 1, n: 3, total: 101, corporation: 'Helion', delta: 30 }],
})
const PLAYERS = [
  { player_id: 'a', name: 'Ana', color: 'rojo', is_active: true, elo: 1050, since: '2025-03-08', seq: 1 },
  { player_id: 'b', name: 'Beto', color: 'azul', is_active: true, elo: 990, since: '2025-04-01', seq: 2 },
]
const CATALOG = { achievements: [
  { code: 'metropolis', description: 'Ciudades en una partida', tiers: [{ level: 1, threshold: 3, title: 'Pueblo' }, { level: 2, threshold: 5, title: 'Ciudad' }], holders: [], kind: 'tiered', glyph: 'city', flavor: '' },
  { code: 'pioneer', description: 'Primera partida', tiers: [{ level: 1, threshold: 1, title: 'Pionero' }], holders: [], kind: 'single', glyph: 'spark', flavor: '' },
] }
const MINE = { achievements: [
  { code: 'metropolis', title: 'Pueblo', description: '', tier: 1, max_tier: 2, unlocked: true, progress: { current: 4, target: 5 }, kind: 'tiered', glyph: 'city', flavor: '' },
  { code: 'pioneer', title: 'Pionero', description: '', tier: 0, max_tier: 1, unlocked: false, progress: null, kind: 'single', glyph: 'spark', flavor: '' },
] }
const RECORDS = [{ code: 'max_points', title: 'Mayor puntaje', description: 'Puntos en una partida', scope: 'game', unit: 'pts', lower_is_better: false, value: 101, holders: [] }]

let games = 4
let calls: string[] = []
const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
function api(url: string) {
  calls.push(url)
  if (url.includes('/insights')) return ok(insights(url.includes('player_count=2') ? 0 : games))
  if (url.includes('/achievements/catalog')) return ok(CATALOG)
  if (url.includes('/achievements')) return ok(MINE)
  if (url.includes('/stats/summary')) return ok({ composition: comp })
  if (url.includes('/records')) return ok(RECORDS)
  return ok(PLAYERS)
}

function Where() {
  const { pathname, search } = useLocation()
  return <span data-testid="where">{pathname + search}</span>
}

const renderAt = (url: string) => render(
  <QueryClientProvider client={createQueryClient()}>
    <MemoryRouter initialEntries={[url]}>
      <Routes><Route path="/jugadores/:playerId" element={<Profile />} /><Route path="*" element={<p>otra</p>} /></Routes>
      <Where />
    </MemoryRouter>
  </QueryClientProvider>,
)

describe('Perfil', () => {
  beforeEach(() => { games = 4; calls = []; vi.stubGlobal('fetch', vi.fn(api)) })
  afterEach(() => vi.unstubAllGlobals())

  it('the hero shows identity, ELO and favorites; the summary its panels', async () => {
    renderAt('/jugadores/a')
    expect(await screen.findByRole('heading', { level: 1, name: 'Ana' })).toBeInTheDocument()
    expect(screen.getByText('Juega desde 8 de marzo de 2025')).toBeInTheDocument()
    expect(screen.getByText('Urbanista.')).toBeInTheDocument()
    expect(screen.getByText('Alcalde')).toBeInTheDocument()
    expect(screen.getByText('3 veces')).toBeInTheDocument()
    expect(screen.getByText('Todavía no ganó ninguna recompensa.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Némesis Beto Le ganó a Ana en 3 de 4 partidas/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tabla por tamaño de mesa de Ana' })).toBeInTheDocument()
    const tabs = screen.getByRole('tablist', { name: 'Secciones del perfil' })
    expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Resumen', 'Partidas4', 'Récords1', 'Logros1'])
  })

  it('tabs: games open the report, records and achievements with their progress', async () => {
    renderAt('/jugadores/a')
    fireEvent.click(await screen.findByRole('tab', { name: /Récords/ }))
    expect(screen.getByText('Mayor puntaje')).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent('/jugadores/a?tab=records')
    fireEvent.click(screen.getByRole('tab', { name: /Logros/ }))
    expect(screen.getByText('4/5 para Ciudad')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Partidas/ }))
    fireEvent.click(screen.getByRole('button', { name: /Tharsis/ }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/partidas/g2'))
  })

  it('with a table size the player never played, says so and offers every table', async () => {
    renderAt('/jugadores/a?mesa=2')
    expect(await screen.findByText('Ana no jugó partidas de 2 jugadores')).toBeInTheDocument()
    expect(calls.some((c) => c.includes('/players/a/insights?player_count=2'))).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Ver todas las mesas' }))
    expect(await screen.findByRole('tab', { name: /Resumen/ })).toBeInTheDocument()
  })

  it('an unknown player says so', async () => {
    renderAt('/jugadores/nadie')
    expect(await screen.findByText('Este jugador no está en el archivo')).toBeInTheDocument()
  })
})
