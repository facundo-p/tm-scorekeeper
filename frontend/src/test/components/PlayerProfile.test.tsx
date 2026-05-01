import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('@/api/players', () => ({
  getPlayerProfile: vi.fn(),
  getPlayers: vi.fn(),
}))
vi.mock('@/api/achievements', () => ({
  getPlayerAchievements: vi.fn(),
}))
vi.mock('@/api/elo', () => ({
  getEloSummary: vi.fn(),
}))

import PlayerProfile from '@/pages/PlayerProfile/PlayerProfile'
import { getPlayerProfile, getPlayers } from '@/api/players'
import { getEloSummary } from '@/api/elo'
import type { PlayerProfileDTO, PlayerResponseDTO } from '@/types'

const fixtureProfile: PlayerProfileDTO = {
  player_id: 'p1',
  elo: 1523,
  stats: { games_played: 5, games_won: 2, win_rate: 0.4 },
  games: [],
  records: {},
}

const fixturePlayers: PlayerResponseDTO[] = [
  { player_id: 'p1', name: 'Alice', is_active: true, elo: 1523 },
]

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/players/p1']}>
      <Routes>
        <Route path="/players/:playerId" element={<PlayerProfile />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PlayerProfile', () => {
  beforeEach(() => {
    vi.mocked(getPlayerProfile).mockResolvedValue(fixtureProfile)
    vi.mocked(getPlayers).mockResolvedValue(fixturePlayers)
  })

  it('summary failure does not block profile', async () => {
    // EloSummary fetch rejects — must NOT break the profile render (D-14)
    vi.mocked(getEloSummary).mockRejectedValue(new Error('elo summary 500'))

    renderRoute()

    // Profile content must be visible
    await waitFor(() => {
      expect(screen.getByText('Estadísticas')).toBeInTheDocument()
    })

    // Page-level error banner must NOT appear (it is reserved for profile/players failures)
    expect(
      screen.queryByText(/No se pudo cargar el perfil del jugador/),
    ).not.toBeInTheDocument()

    // The ELO card MUST be absent (queried by its aria-label landmark per UI-SPEC.md)
    expect(screen.queryByLabelText('Resumen de ELO')).not.toBeInTheDocument()

    // Confirm the page actually attempted the fetch (catches Task 4 wiring regression)
    expect(vi.mocked(getEloSummary)).toHaveBeenCalledWith('p1')
  })
})
