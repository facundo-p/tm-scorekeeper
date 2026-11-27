import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { createQueryClient } from '@/data/query'
import Ranking from '@/screens/Ranking/Ranking'

const equity = { expected: 2, wins_vs_expected: 1, wins_ratio: 1.5, rel_pos: 0.6 }
const row = (player_id: string, name: string, color: string, rank: number, elo: number) => ({
  player_id, name, color, rank, elo, peak: elo + 10, last_delta: 5, games: 6, wins: 3, win_rate: 0.5, equity,
  form: [{ position: 1, n: 3, game_id: 'g1' }], archetype: 'Urbanista', elo_series: [{ date: '2026-01-10', game_id: 'g1', elo, delta: 5 }],
})
const RANKING = { view: 'all', players: [row('a', 'Ana', 'rojo', 1, 1100), row('b', 'Beto', 'azul', 2, 1000)], lead_changes: [] }
const H2H = { view: 'all', matrix: { a: { b: { games: 4, ahead: 3, behind: 1, even: 0 } }, b: { a: { games: 4, ahead: 1, behind: 3, even: 0 } } } }
const PLAYERS = [
  { player_id: 'a', name: 'Ana', color: 'rojo', is_active: true, elo: 1100, since: '2025-03-08', seq: 1 },
  { player_id: 'b', name: 'Beto', color: 'azul', is_active: true, elo: 1000, since: '2025-04-01', seq: 2 },
  { player_id: 'c', name: 'Ceci', color: 'verde', is_active: false, elo: 990, since: '2025-05-01', seq: 3 },
]
const INSIGHTS = { by_table: [{ n: 3, games: 6, wins: 3, avg_points: 80, ...equity }, { n: 4, games: 2, wins: 0, avg_points: 70, ...equity }], equity }

let calls: { url: string; init?: RequestInit }[] = []
let writeStatus = 200
let ranking: unknown = RANKING
const ok = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }))
function api(url: string, init?: RequestInit) {
  calls.push({ url, init })
  if (init?.method === 'POST' || init?.method === 'PATCH') return ok(writeStatus === 200 ? { player_id: 'n' } : { detail: 'Color taken' }, writeStatus)
  if (url.includes('/ranking')) return ok(ranking)
  if (url.includes('/head-to-head')) return ok(H2H)
  if (url.includes('/insights')) return ok(INSIGHTS)
  if (url.includes('/seasons/current')) return ok({ number: 3, start: '2026-05-01' })
  return ok(PLAYERS)
}

function Where() {
  const { pathname, search } = useLocation()
  return <span data-testid="where">{pathname + search}</span>
}

const renderAt = (url = '/ranking') => render(
  <QueryClientProvider client={createQueryClient()}>
    <MemoryRouter initialEntries={[url]}>
      <Routes><Route path="/ranking" element={<Ranking />} /><Route path="*" element={<p>otra</p>} /></Routes>
      <Where />
    </MemoryRouter>
  </QueryClientProvider>,
)
const bodyOf = (method: string) => JSON.parse(String(calls.find((c) => c.init?.method === method)!.init!.body))

describe('Ranking', () => {
  beforeEach(() => { calls = []; writeStatus = 200; ranking = RANKING; vi.stubGlobal('fetch', vi.fn(api)) })
  afterEach(() => vi.unstubAllGlobals())

  it('lists the ranking with fairness readings; each row leads to the profile', async () => {
    renderAt()
    const table = await screen.findByRole('table', { name: 'Clasificación por ELO' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.map((r) => r.getAttribute('href'))).toEqual(['/jugadores/a', '/jugadores/b'])
    expect(rows[0]).toHaveTextContent('Urbanista')
    expect(rows[0]).toHaveTextContent('+1,0150 %')
    await waitFor(() => expect(screen.getByRole('region', { name: 'Tabla por tamaño de mesa de Ana' })).toHaveTextContent('3 jugadores63+1,0150 %8060 %4 jugadores'))
    expect(screen.getByText('1 inactivo: no aparece en el ranking ni al registrar partidas, pero conserva su historial.')).toBeInTheDocument()
  })

  it('the table-size filter replays everything on those games and keeps it in the profile links', async () => {
    renderAt()
    fireEvent.click(await screen.findByRole('button', { name: 'Mesas de 5 jugadores' }))
    await waitFor(() => expect(calls.some((c) => c.url.includes('/ranking?player_count=5'))).toBe(true))
    expect(calls.some((c) => c.url.includes('/stats/head-to-head?player_count=5'))).toBe(true)
    expect(await screen.findByRole('table', { name: 'Clasificación por ELO de mesa 5' })).toBeInTheDocument()
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('href', '/jugadores/a?mesa=5')
    expect(screen.getByRole('status')).toHaveTextContent('Solo partidas de 5 jugadores')
  })

  it('by table size: another player from the picker; with a table filter, only that row', async () => {
    renderAt('/ranking?mesa=4')
    fireEvent.change(await screen.findByRole('combobox', { name: /Jugador/ }), { target: { value: 'b' } })
    await waitFor(() => expect(calls.some((c) => c.url.includes('/players/b/insights'))).toBe(true))
    const region = await screen.findByRole('region', { name: 'Tabla por tamaño de mesa de Beto' })
    await waitFor(() => expect(within(region).getAllByRole('row')).toHaveLength(2))
    expect(region).toHaveTextContent('4 jugadores')
    expect(region).not.toHaveTextContent('3 jugadores')
  })

  it('a table size nobody played leaves an empty ranking without breaking', async () => {
    ranking = { ...RANKING, players: [] }
    renderAt('/ranking?mesa=2')
    expect(await screen.findByText('0 jugadores activos')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Jugador/ })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Cara a cara' })).toBeInTheDocument()
  })

  it('adds a player with a name and a free cube color', async () => {
    renderAt()
    fireEvent.click(await screen.findByRole('button', { name: 'Agregar jugador' }))
    const sheet = screen.getByRole('dialog', { name: 'Nuevo jugador' })
    expect(within(sheet).getByRole('radio', { name: /rojo \(en uso\)/ })).toBeInTheDocument()
    expect(within(sheet).getByRole('radio', { name: /^verde/ })).toBeChecked()
    fireEvent.change(within(sheet).getByRole('textbox', { name: 'Nombre' }), { target: { value: '  Dani ' } })
    fireEvent.click(within(sheet).getByRole('radio', { name: /^naranja/ }))
    fireEvent.click(within(sheet).getByRole('button', { name: 'Agregar jugador' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(bodyOf('POST')).toEqual({ name: 'Dani', color: 'naranja' })
  })

  it('a taken color is explained and the sheet stays open', async () => {
    writeStatus = 409
    renderAt()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar a Beto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ese color ya lo usa otro jugador activo.')
    expect(screen.getByRole('dialog', { name: 'Editar a Beto' })).toBeInTheDocument()
  })

  it('deactivates and reactivates from the edit sheet', async () => {
    renderAt()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar a Ceci' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reactivar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(bodyOf('PATCH')).toEqual({ is_active: true })
    expect(calls.find((c) => c.init?.method === 'PATCH')!.url).toMatch(/\/players\/c$/)
  })
})
