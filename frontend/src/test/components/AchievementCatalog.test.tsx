import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import AchievementCatalog from '@/pages/AchievementCatalog/AchievementCatalog'

vi.mock('@/api/achievements', () => ({
  getAchievementsCatalog: vi.fn(),
}))

import { getAchievementsCatalog } from '@/api/achievements'

const mockCatalog = {
  achievements: [
    {
      code: 'high_score',
      title: 'Gran Terraformador',
      description: 'Alcanzar X puntos en una partida',
      icon: null,
      fallback_icon: 'trophy',
      tiers: [
        { level: 1, threshold: 50, title: 'Colono' },
        { level: 2, threshold: 75, title: 'Joven Promesa' },
        { level: 3, threshold: 100, title: 'Gran Terraformador' },
      ],
      holders: [
        { player_id: 'p1', player_name: 'Alice', tier: 2, unlocked_at: '2026-01-15' },
        { player_id: 'p2', player_name: 'Bob', tier: 1, unlocked_at: '2026-02-10' },
      ],
    },
    {
      code: 'games_played',
      title: 'Habitué',
      description: 'Jugar partidas',
      icon: null,
      fallback_icon: 'gamepad',
      tiers: [
        { level: 1, threshold: 5, title: 'Novato' },
        { level: 2, threshold: 10, title: 'Habitué' },
      ],
      holders: [],
    },
  ],
}

function renderCatalog() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/achievements']}>
        <AchievementCatalog />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('AchievementCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading spinner initially', () => {
    vi.mocked(getAchievementsCatalog).mockReturnValue(new Promise(() => {}))
    renderCatalog()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders achievement descriptions after fetch resolves', async () => {
    vi.mocked(getAchievementsCatalog).mockResolvedValue(mockCatalog)
    renderCatalog()
    await waitFor(() => {
      expect(screen.getByText('Alcanzar X puntos en una partida')).toBeInTheDocument()
      expect(screen.getByText('Jugar partidas')).toBeInTheDocument()
    })
  })

  it('shows max tier level for achievements with holders', async () => {
    vi.mocked(getAchievementsCatalog).mockResolvedValue(mockCatalog)
    renderCatalog()
    await waitFor(() => {
      expect(screen.getByText('Nivel 2: Joven Promesa')).toBeInTheDocument()
    })
  })

  it('clicking a multi-tier achievement shows tier breakdown with holders', async () => {
    vi.mocked(getAchievementsCatalog).mockResolvedValue(mockCatalog)
    renderCatalog()
    await waitFor(() => {
      expect(screen.getByText('Alcanzar X puntos en una partida')).toBeInTheDocument()
    })
    const card = screen.getByText('Alcanzar X puntos en una partida').closest('[role="button"]')
    fireEvent.click(card!)
    await waitFor(() => {
      // Tier titles in the modal
      expect(screen.getByText('Colono')).toBeInTheDocument()
      expect(screen.getByText('Joven Promesa')).toBeInTheDocument()
      expect(screen.getByText('Gran Terraformador')).toBeInTheDocument()
      // Alice (tier 2) shown at Nivel 2, Bob (tier 1) at Nivel 1
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
  })

  it('clicking an achievement with no holders shows empty message', async () => {
    vi.mocked(getAchievementsCatalog).mockResolvedValue(mockCatalog)
    renderCatalog()
    await waitFor(() => {
      expect(screen.getByText('Jugar partidas')).toBeInTheDocument()
    })
    const card = screen.getByText('Jugar partidas').closest('[role="button"]')
    fireEvent.click(card!)
    await waitFor(() => {
      expect(
        screen.getByText('Ningun jugador ha desbloqueado este logro todavia.'),
      ).toBeInTheDocument()
    })
  })

  it('shows error message on fetch failure', async () => {
    vi.mocked(getAchievementsCatalog).mockRejectedValue(new Error('Network error'))
    renderCatalog()
    await waitFor(() => {
      expect(
        screen.getByText('No se pudo cargar el catalogo. Intenta de nuevo.'),
      ).toBeInTheDocument()
    })
  })
})
