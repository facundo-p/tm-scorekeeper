import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GameRecords from '@/pages/GameRecords/GameRecords'
import type {
  AchievementsByPlayerDTO,
  GameResultDTO,
  PlayerResponseDTO,
  RecordComparisonDTO,
} from '@/types'

vi.mock('@/api/games', () => ({
  getGameRecords: vi.fn(),
  getGameResults: vi.fn(),
}))
vi.mock('@/api/players', () => ({
  getPlayers: vi.fn(),
}))
vi.mock('@/api/achievements', () => ({
  triggerAchievements: vi.fn(),
}))

import { getGameRecords, getGameResults } from '@/api/games'
import { getPlayers } from '@/api/players'
import { triggerAchievements } from '@/api/achievements'

const mockGetGameRecords = vi.mocked(getGameRecords)
const mockGetGameResults = vi.mocked(getGameResults)
const mockGetPlayers = vi.mocked(getPlayers)
const mockTriggerAchievements = vi.mocked(triggerAchievements)

const PLAYERS: PlayerResponseDTO[] = [
  { player_id: 'p1', name: 'Alice', is_active: true, elo: 1000 },
  { player_id: 'p2', name: 'Bob', is_active: true, elo: 1000 },
]

const RECORDS: RecordComparisonDTO[] = []

const RESULT: GameResultDTO = {
  game_id: 'game-123',
  date: '2026-04-01',
  results: [
    { player_id: 'p1', total_points: 95, mc_total: 80, position: 1, tied: false },
    { player_id: 'p2', total_points: 70, mc_total: 50, position: 2, tied: false },
  ],
}

const ACHIEVEMENTS_WITH_UNLOCKS: AchievementsByPlayerDTO = {
  achievements_by_player: {
    p1: [
      { code: 'high_score', title: 'Alcanzar X puntos', tier: 1, is_new: true, is_upgrade: false, icon: null, fallback_icon: 'trophy' },
    ],
    p2: [],
  },
}

const ACHIEVEMENTS_EMPTY: AchievementsByPlayerDTO = {
  achievements_by_player: { p1: [], p2: [] },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/games/game-123/records']}>
      <Routes>
        <Route path="/games/:gameId/records" element={<GameRecords />} />
      </Routes>
    </MemoryRouter>,
  )
}

const RETRY_WARN_MSG = 'Failed to load achievements after retry'

describe('GameRecords — achievements modal integration with useGames retry', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  function retryWarnCalls() {
    return warnSpy.mock.calls.filter((args) => args[0] === RETRY_WARN_MSG)
  }

  beforeEach(() => {
    mockGetGameRecords.mockReset().mockResolvedValue(RECORDS)
    mockGetGameResults.mockReset().mockResolvedValue(RESULT)
    mockGetPlayers.mockReset().mockResolvedValue(PLAYERS)
    mockTriggerAchievements.mockReset()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('shows AchievementModal when there are unlocks (Caso A — happy path)', async () => {
    mockTriggerAchievements.mockResolvedValueOnce(ACHIEVEMENTS_WITH_UNLOCKS)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Alcanzar X puntos')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument()
    expect(mockTriggerAchievements).toHaveBeenCalledTimes(1)
    expect(retryWarnCalls()).toHaveLength(0)
  })

  it('shows modal when first call fails and second succeeds (Caso B — retry exitoso)', async () => {
    mockTriggerAchievements
      .mockRejectedValueOnce(new Error('transient network error'))
      .mockResolvedValueOnce(ACHIEVEMENTS_WITH_UNLOCKS)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Alcanzar X puntos')).toBeInTheDocument()
    })
    expect(mockTriggerAchievements).toHaveBeenCalledTimes(2)
    expect(retryWarnCalls()).toHaveLength(0)
  })

  it('does NOT show modal when both retries fail (Caso C — retry agotado)', async () => {
    mockTriggerAchievements
      .mockRejectedValueOnce(new Error('offline 1'))
      .mockRejectedValueOnce(new Error('offline 2'))
    renderPage()

    // Wait for the page to settle (records section renders)
    await waitFor(() => {
      expect(screen.getByText(/records/i)).toBeInTheDocument()
    })
    // Give the retry chain time to complete (microtask drain)
    await waitFor(() => {
      expect(mockTriggerAchievements).toHaveBeenCalledTimes(2)
    })
    expect(screen.queryByRole('button', { name: /continuar/i })).not.toBeInTheDocument()
    expect(retryWarnCalls()).toHaveLength(1)
  })

  it('does NOT show modal when achievements_by_player has only empty lists (Caso D — sin regresión)', async () => {
    mockTriggerAchievements.mockResolvedValueOnce(ACHIEVEMENTS_EMPTY)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/records/i)).toBeInTheDocument()
    })
    // Confirm the achievements promise resolved
    await waitFor(() => {
      expect(mockTriggerAchievements).toHaveBeenCalledTimes(1)
    })
    expect(screen.queryByRole('button', { name: /continuar/i })).not.toBeInTheDocument()
    expect(retryWarnCalls()).toHaveLength(0)
  })

  it('renders the page without modal when triggerAchievements returns no unlocks and getPlayers fails silently', async () => {
    mockGetPlayers.mockRejectedValueOnce(new Error('players unavailable'))
    mockTriggerAchievements.mockResolvedValueOnce(ACHIEVEMENTS_EMPTY)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/¡partida guardada!/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /continuar/i })).not.toBeInTheDocument()
  })
})
