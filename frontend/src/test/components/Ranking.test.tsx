import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('@/api/elo', () => ({
  getEloHistory: vi.fn(),
  getEloSummary: vi.fn(),
}))
vi.mock('@/hooks/usePlayers', () => ({
  usePlayers: vi.fn(),
}))

import Ranking from '@/pages/Ranking/Ranking'
import { getEloHistory } from '@/api/elo'
import { usePlayers } from '@/hooks/usePlayers'
import type { PlayerEloHistoryDTO, PlayerResponseDTO } from '@/types'

const fixturePlayers: PlayerResponseDTO[] = [
  { player_id: 'p1', name: 'Alice', is_active: true, elo: 1500 },
  { player_id: 'p2', name: 'Bob', is_active: true, elo: 1450 },
]

const fixtureHistory: PlayerEloHistoryDTO[] = [
  {
    player_id: 'p1',
    player_name: 'Alice',
    points: [{ recorded_at: '2025-06-01', game_id: 'g1', elo_after: 1510, delta: 10 }],
  },
  {
    player_id: 'p2',
    player_name: 'Bob',
    points: [{ recorded_at: '2025-06-02', game_id: 'g2', elo_after: 1460, delta: 10 }],
  },
]

function renderAt(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/ranking" element={<Ranking />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Ranking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePlayers).mockReturnValue({
      players: fixturePlayers,
      loading: false,
      error: null,
      refetch: vi.fn(),
      addPlayer: vi.fn(),
      editPlayer: vi.fn(),
    })
    vi.mocked(getEloHistory).mockResolvedValue(fixtureHistory)
  })

  it('shows Spinner while loading', () => {
    vi.mocked(usePlayers).mockReturnValue({
      players: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
      addPlayer: vi.fn(),
      editPlayer: vi.fn(),
    })
    vi.mocked(getEloHistory).mockReturnValue(new Promise(() => {})) // never resolves
    renderAt('/ranking')
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows chart when data loads with at least one point', async () => {
    renderAt('/ranking')
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
    expect(screen.queryByText(/sin partidas/i)).not.toBeInTheDocument()
    const chart = screen.queryByRole('img', { name: 'Gráfico de evolución de ELO por jugador' })
    expect(chart).toBeInTheDocument()
  })

  it('shows empty state "Sin partidas en este rango" when from filter excludes all data', async () => {
    // All data points are in 2025; filter from 2026 excludes everything
    renderAt('/ranking?from=2026-01-01')
    await waitFor(() => {
      expect(screen.getByText('Sin partidas en este rango')).toBeInTheDocument()
    })
    // Multiple "Limpiar filtros" buttons may exist (RankingFilters + empty state)
    const clearButtons = screen.getAllByRole('button', { name: /limpiar filtros/i })
    expect(clearButtons.length).toBeGreaterThan(0)
  })

  it('shows empty state "Selecciona al menos un jugador" when ?players= is empty', async () => {
    renderAt('/ranking?players=')
    await waitFor(() => {
      expect(screen.getByText(/selecciona al menos un jugador/i)).toBeInTheDocument()
    })
    const clearButtons = screen.getAllByRole('button', { name: /limpiar filtros/i })
    expect(clearButtons.length).toBeGreaterThan(0)
  })

  it('shows error state and Reintentar button when getEloHistory rejects', async () => {
    vi.mocked(getEloHistory).mockRejectedValue(new Error('boom'))
    renderAt('/ranking')
    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar el ranking/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('clicking Reintentar triggers a second getEloHistory call', async () => {
    vi.mocked(getEloHistory).mockRejectedValue(new Error('boom'))
    renderAt('/ranking')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })
    const callsBefore = vi.mocked(getEloHistory).mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    await waitFor(() => {
      expect(vi.mocked(getEloHistory).mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })

  it('default URL clean shows chart (all-active selected)', async () => {
    renderAt('/ranking')
    await waitFor(() => {
      expect(
        screen.queryByRole('img', { name: 'Gráfico de evolución de ELO por jugador' }),
      ).toBeInTheDocument()
    })
    expect(screen.queryByText(/sin partidas/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/selecciona al menos/i)).not.toBeInTheDocument()
  })

  it('clicking Limpiar filtros from empty state clears URL and shows chart', async () => {
    // Start filtered-out: all data is in 2025, filter from 2026 gives empty
    renderAt('/ranking?from=2026-01-01')
    await waitFor(() => {
      expect(screen.getByText('Sin partidas en este rango')).toBeInTheDocument()
    })
    // Click the last "Limpiar filtros" button (the one in the empty state block)
    const clearButtons = screen.getAllByRole('button', { name: /limpiar filtros/i })
    fireEvent.click(clearButtons[clearButtons.length - 1])
    await waitFor(() => {
      expect(
        screen.queryByRole('img', { name: 'Gráfico de evolución de ELO por jugador' }),
      ).toBeInTheDocument()
    })
    expect(screen.queryByText(/sin partidas/i)).not.toBeInTheDocument()
  })

  it('shows single-point hint when filtered dataset has exactly one point', async () => {
    // Override mock so only Alice has data, with 1 point
    vi.mocked(getEloHistory).mockResolvedValue([
      {
        player_id: 'p1',
        player_name: 'Alice',
        points: [
          { recorded_at: '2025-06-01', game_id: 'g1', elo_after: 1510, delta: 10 },
        ],
      },
    ])
    renderAt('/ranking?players=p1')
    await waitFor(() => {
      expect(
        screen.getByText('Solo hay una partida en este rango'),
      ).toBeInTheDocument()
    })
  })

  it('does not show single-point hint when more than one point is in range', async () => {
    // fixtureHistory has 2 total points (one per player) — both selected by default
    renderAt('/ranking')
    await waitFor(() => {
      expect(
        screen.queryByRole('img', { name: 'Gráfico de evolución de ELO por jugador' }),
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByText('Solo hay una partida en este rango'),
    ).not.toBeInTheDocument()
  })
})
