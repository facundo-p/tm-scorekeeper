import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { createQueryClient } from '@/data/query'
import Records from '@/screens/Records/Records'
import Achievements from '@/screens/Achievements/Achievements'

const PLAYERS = [
  { player_id: 'a', name: 'Ana', color: 'rojo', is_active: true, elo: 1050, since: '2025-03-08', seq: 1 },
  { player_id: 'b', name: 'Beto', color: 'azul', is_active: true, elo: 990, since: '2025-04-01', seq: 2 },
]
const hist = (value: number, player_id: string, date: string) => ({ value, player_id, player_name: player_id, holders: [player_id], game_id: `g-${date}`, date, kind: 'set' })
const RECORDS = [
  { code: 'highest_single_game_score', title: 'Mayor puntaje', description: 'Más puntos en una partida', scope: 'game', unit: 'pts', lower_is_better: false, value: 120,
    holders: [{ player_id: 'a', player_name: 'Ana', game_id: 'g2', date: '2026-02-01', map: 'Tharsis' }], history: [hist(100, 'b', '2026-01-01'), hist(120, 'a', '2026-02-01')] },
  { code: 'most_games_won', title: 'Estratega', description: 'Más partidas ganadas', scope: 'career', unit: 'victorias', lower_is_better: false, value: 3,
    holders: [{ player_id: 'b', player_name: 'Beto' }, { player_id: 'a', player_name: 'Ana' }], history: [] },
]
const CATALOG = { achievements: [
  { code: 'high_score', description: 'Alcanzar X puntos en una partida', tiers: [{ level: 1, threshold: 50, title: 'Colono' }, { level: 2, threshold: 75, title: 'Joven Promesa' }],
    holders: [{ player_id: 'a', player_name: 'Ana', tier: 2, unlocked_at: '2026-02-01' }], kind: 'max', glyph: 'trophy', flavor: 'Los números no mienten.' },
] }
const MINE = { achievements: [{ code: 'high_score', title: 'Colono', description: '', tier: 1, max_tier: 2, unlocked: true, progress: { current: 60, target: 75 }, kind: 'max', glyph: 'trophy', flavor: '' }] }
const RANKING = { view: 'all', players: [{ player_id: 'a' }, { player_id: 'b' }], lead_changes: [] }

let calls: string[] = []
let summaries: unknown[] = [{ id: 'g1' }, { id: 'g2' }]
const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
function api(url: string) {
  calls.push(url)
  if (url.includes('/records')) return ok(RECORDS)
  if (url.includes('/games/summaries')) return ok(summaries)
  if (url.includes('/stats/summary')) return ok({ first: '2026-01-01', last: '2026-03-01', composition: { avg: {}, share: {} } })
  if (url.includes('/achievements/catalog')) return ok(CATALOG)
  if (url.includes('/achievements')) return ok(MINE)
  if (url.includes('/ranking')) return ok(RANKING)
  return ok(PLAYERS)
}

function Where() {
  const { pathname, search } = useLocation()
  return <span data-testid="where">{pathname + search}</span>
}

const renderAt = (url: string) => render(
  <QueryClientProvider client={createQueryClient()}>
    <MemoryRouter initialEntries={[url]}>
      <Routes><Route path="/records" element={<Records />} /><Route path="/logros" element={<Achievements />} /><Route path="*" element={<p>otra</p>} /></Routes>
      <Where />
    </MemoryRouter>
  </QueryClientProvider>,
)

describe('Trofeos', () => {
  beforeEach(() => { calls = []; summaries = [{ id: 'g1' }, { id: 'g2' }]; vi.stubGlobal('fetch', vi.fn(api)) })
  afterEach(() => vi.unstubAllGlobals())

  it('records: the monument with its history; career co-holders in signup order', async () => {
    renderAt('/records')
    expect(await screen.findByRole('heading', { level: 2, name: 'Mayor puntaje' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Historia: 100 (Beto), 120 (Ana)' })).toBeInTheDocument()
    const plaque = screen.getByText('Estratega').closest('li')!
    expect(within(plaque).getAllByRole('button').map((l) => l.textContent)).toEqual(['Ana', 'Beto'])
    fireEvent.click(screen.getByRole('button', { name: 'Ver la partida' }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/partidas/g2'))
  })

  it('records: map and expansion filters go to the URL and the API; with no games, says so', async () => {
    renderAt('/records')
    fireEvent.click(await screen.findByRole('button', { name: /Hellas/ }))
    await waitFor(() => expect(calls.some((c) => c.includes('/records?map=Hellas'))).toBe(true))
    expect(screen.getByTestId('where')).toHaveTextContent('/records?mapa=Hellas')
    expect(await screen.findByText('2 partidas con este filtro')).toBeInTheDocument()
    summaries = []
    fireEvent.click(screen.getByRole('button', { name: /Turmoil/ }))
    expect(await screen.findByText('Sin partidas con este filtro')).toBeInTheDocument()
    expect(calls.some((c) => c.includes('expansion=Turmoil') && c.includes('map=Hellas'))).toBe(true)
  })

  it('achievements: the group view, a player progress and the ladder sheet', async () => {
    renderAt('/logros')
    const tile = await screen.findByRole('button', { name: /Alcanzar X puntos en una partida/ })
    expect(tile).toHaveTextContent('Joven Promesa')
    expect(tile).toHaveTextContent('1 jugador')
    fireEvent.click(screen.getByRole('button', { name: 'Beto' }))
    expect(await screen.findByText(/tiene 1 de 1 logros/)).toBeInTheDocument()
    expect(calls.some((c) => c.includes('/players/b/achievements'))).toBe(true)
    await waitFor(() => expect(screen.getByRole('button', { name: /Alcanzar X/ })).toHaveTextContent('60/75'))
    fireEvent.click(screen.getByRole('button', { name: /Alcanzar X/ }))
    const sheet = screen.getByRole('dialog', { name: 'Joven Promesa' })
    expect(sheet).toHaveTextContent('Beto va 60 de 75 para el siguiente nivel.')
    expect(sheet).toHaveTextContent('Umbral: 75 (Titanio)')
  })

  it('achievements by table size are a computed view', async () => {
    renderAt('/logros?mesa=3')
    expect(await screen.findByText(/vista calculada: los logros oficiales no cambian/)).toBeInTheDocument()
    expect(calls.some((c) => c.includes('/achievements/catalog?player_count=3'))).toBe(true)
  })
})
