import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { createQueryClient } from '@/data/query'
import Games from '@/screens/Games/Games'

const row = (id: string, date: string, map: string, winner: string) => ({
  id, date, map, expansions: [], generations: 10, draft: false, player_count: 2, winners: [winner], margin: 3, decided_by_mc: false,
  scores: [{ player_id: winner, position: 1, total_points: 90, corporation: 'Helion' }, { player_id: winner === 'a' ? 'b' : 'a', position: 2, total_points: 87, corporation: 'Ecoline' }],
})
const SUMMARIES = [row('g3', '2026-02-10', 'Hellas', 'b'), row('g2', '2026-01-20', 'Tharsis', 'a'), row('g1', '2026-01-05', 'Hellas', 'a')]
const API: Record<string, unknown> = {
  '/games/summaries': SUMMARIES,
  '/stats/summary': { view: 'all', games: 3, generations: 30, avg_winner: 90, avg_generations: 10, first: '2026-01-05', last: '2026-02-10', top_corp: null, corps_used: 2, top_map: null },
  '/players': [{ player_id: 'b', name: 'Beto', color: 'azul', is_active: true, elo: 1000, since: '2026-01-05', seq: 2 },
    { player_id: 'a', name: 'Ana', color: 'rojo', is_active: true, elo: 1000, since: '2026-01-05', seq: 1 }],
}

describe('Partidas', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn((url: string) => {
    const path = new URL(url, 'http://x').pathname.replace(/\/$/, '').replace(/^\/api/, '')
    return Promise.resolve(new Response(JSON.stringify(API[path] ?? {}), { status: 200 }))
  })))
  afterEach(() => vi.unstubAllGlobals())

  const renderGames = () => render(<QueryClientProvider client={createQueryClient()}><MemoryRouter><Games /></MemoryRouter></QueryClientProvider>)

  it('groups by month, newest first', async () => {
    renderGames()
    expect(await screen.findByText('3 misiones archivadas desde enero de 2026.')).toBeInTheDocument()
    expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))).toEqual(['febrero 2026', 'enero 2026'])
  })

  it('filters by map and offers to clear', async () => {
    renderGames()
    const maps = await screen.findAllByRole('group', { name: 'Mapa' })
    fireEvent.click(within(maps[0]).getByRole('button', { name: /Tharsis/ }))
    expect(screen.getByText('1 de 3 partidas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.queryByText('1 de 3 partidas')).toBeNull()
  })

  it('players in the filter follow signup order; sorting by winner flattens the list', async () => {
    renderGames()
    const who = await screen.findAllByRole('group', { name: 'Jugadores en la mesa' })
    expect(within(who[0]).getAllByRole('button').map((b) => b.textContent)).toEqual(['Ana', 'Beto'])
    fireEvent.click(screen.getAllByRole('button', { name: 'Ordenar por Ganador' })[0])
    expect(screen.getByRole('region', { name: 'Partidas ordenadas por Ganador' })).toBeInTheDocument()
  })
})
