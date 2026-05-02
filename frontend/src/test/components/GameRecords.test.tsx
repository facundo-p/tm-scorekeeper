import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GameRecords from '@/pages/GameRecords/GameRecords'
import type {
  AchievementsByPlayerDTO,
  EloChangeDTO,
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
vi.mock('@/api/elo', () => ({
  getEloChanges: vi.fn(),
}))

import { getGameRecords, getGameResults } from '@/api/games'
import { getPlayers } from '@/api/players'
import { triggerAchievements } from '@/api/achievements'
import { getEloChanges } from '@/api/elo'

const mockGetGameRecords = vi.mocked(getGameRecords)
const mockGetGameResults = vi.mocked(getGameResults)
const mockGetPlayers = vi.mocked(getPlayers)
const mockTriggerAchievements = vi.mocked(triggerAchievements)
const mockGetEloChanges = vi.mocked(getEloChanges)

const PLAYERS: PlayerResponseDTO[] = [
  { player_id: 'p1', name: 'Alice', is_active: true, elo: 1523 },
  { player_id: 'p2', name: 'Bob', is_active: true, elo: 1477 },
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

const ACHIEVEMENTS_EMPTY: AchievementsByPlayerDTO = {
  achievements_by_player: { p1: [], p2: [] },
}

const ACHIEVEMENTS_WITH_UNLOCKS: AchievementsByPlayerDTO = {
  achievements_by_player: {
    p1: [{ code: 'high_score', title: 'Alcanzar X puntos', tier: 1, is_new: true, is_upgrade: false, icon: null, fallback_icon: 'trophy' }],
    p2: [],
  },
}

const ELO_CHANGES: EloChangeDTO[] = [
  { player_id: 'p1', player_name: 'Alice', elo_before: 1500, elo_after: 1523, delta: 23 },
  { player_id: 'p2', player_name: 'Bob', elo_before: 1500, elo_after: 1477, delta: -23 },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/games/game-123/records']}>
      <Routes>
        <Route path="/games/:gameId/records" element={<GameRecords />} />
      </Routes>
    </MemoryRouter>,
  )
}

const ELO_RETRY_WARN = 'Failed to load ELO changes after retry'

describe('GameRecords — EndOfGameSummaryModal integration (Phase 10 POST-01/POST-02)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockGetGameRecords.mockReset().mockResolvedValue(RECORDS)
    mockGetGameResults.mockReset().mockResolvedValue(RESULT)
    mockGetPlayers.mockReset().mockResolvedValue(PLAYERS)
    mockTriggerAchievements.mockReset().mockResolvedValue(ACHIEVEMENTS_EMPTY)
    mockGetEloChanges.mockReset().mockResolvedValue(ELO_CHANGES)
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('renders the modal on mount even when achievements are all empty (D-03 — modal always opens)', async () => {
    renderPage()
    // Modal title from EndOfGameSummaryModal
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /resumen de partida/i })).toBeInTheDocument()
    })
  })

  it('renders all 4 section headings inside the modal', async () => {
    mockTriggerAchievements.mockResolvedValueOnce(ACHIEVEMENTS_WITH_UNLOCKS)
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /resultados/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: /records/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: /logros/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: /^ELO$/ })).toBeInTheDocument()
    })
  })

  it('renders ELO row content when getEloChanges resolves (POST-02)', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/1500\s*→\s*1523/)).toBeInTheDocument()
    })
    expect(screen.getByText('+23')).toBeInTheDocument()
    expect(screen.getByText('-23')).toBeInTheDocument()
  })

  it('omits the ELO section when getEloChanges fails twice; Records and Logros still render (POST-02 SC-4)', async () => {
    mockGetEloChanges
      .mockRejectedValueOnce(new Error('offline 1'))
      .mockRejectedValueOnce(new Error('offline 2'))
    mockTriggerAchievements.mockResolvedValueOnce(ACHIEVEMENTS_WITH_UNLOCKS)
    renderPage()

    // Wait for retry chain to complete
    await waitFor(() => {
      expect(mockGetEloChanges).toHaveBeenCalledTimes(2)
    })

    // ELO heading must NOT be present (section omitted entirely)
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: /^ELO$/ })).not.toBeInTheDocument()
    })

    // But Records and Logros sections still render
    expect(screen.getByRole('heading', { level: 3, name: /records/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /logros/i })).toBeInTheDocument()
    // Achievement content still shown
    expect(screen.getByText('Alcanzar X puntos')).toBeInTheDocument()

    // Warn was logged exactly once for ELO failure
    const eloWarns = warnSpy.mock.calls.filter((args) => args[0] === ELO_RETRY_WARN)
    expect(eloWarns).toHaveLength(1)
  })

  it('Continuar button is always present (not gated by achievement data)', async () => {
    mockTriggerAchievements.mockResolvedValueOnce(ACHIEVEMENTS_EMPTY)
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument()
    })
  })

  it('clicking Continuar closes the modal — only header + "Volver al inicio" remain on the page', async () => {
    renderPage()
    const continuar = await screen.findByRole('button', { name: /continuar/i })
    fireEvent.click(continuar)

    // Modal title gone
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 2, name: /resumen de partida/i })).not.toBeInTheDocument()
    })
    // Page header + Volver button remain
    expect(screen.getByRole('heading', { level: 1, name: /¡partida guardada!/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /volver al inicio/i })).toBeInTheDocument()
  })

  it('renders the page even when getPlayers fails silently', async () => {
    mockGetPlayers.mockRejectedValueOnce(new Error('players unavailable'))
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /¡partida guardada!/i })).toBeInTheDocument()
    })
    // Modal still opens (eloChanges has player_name fallback already)
    expect(screen.getByRole('heading', { level: 2, name: /resumen de partida/i })).toBeInTheDocument()
  })

  it('does NOT render inline Resultados or Records sections on the page outside the modal (D-01)', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /¡partida guardada!/i })).toBeInTheDocument()
    })
    // Close modal
    fireEvent.click(await screen.findByRole('button', { name: /continuar/i }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 2, name: /resumen de partida/i })).not.toBeInTheDocument()
    })
    // Page must NOT show Resultados or Records section headings now
    expect(screen.queryByRole('heading', { name: /resultados/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /records/i })).not.toBeInTheDocument()
  })
})
