import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AchievementModal from '@/components/AchievementModal/AchievementModal'
import type { AchievementsByPlayerDTO } from '@/types'

const mockPlayerNames = new Map([['p1', 'Alice'], ['p2', 'Bob']])

const mockAchievements: AchievementsByPlayerDTO = {
  achievements_by_player: {
    'p1': [{ code: 'ACH1', title: 'First Win', tier: 1, is_new: true, is_upgrade: false, icon: null, fallback_icon: 'trophy' }],
    'p2': [{ code: 'ACH2', title: 'Streak Master', tier: 2, is_new: false, is_upgrade: true, icon: null, fallback_icon: 'flame' }],
    'p3': [],  // empty — should be filtered
  }
}

describe('AchievementModal', () => {
  it('renders player group headers using player names from map', () => {
    const onClose = vi.fn()
    render(
      <AchievementModal
        achievements={mockAchievements}
        playerNames={mockPlayerNames}
        onClose={onClose}
      />
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders AchievementBadgeMini for each achievement', () => {
    const onClose = vi.fn()
    render(
      <AchievementModal
        achievements={mockAchievements}
        playerNames={mockPlayerNames}
        onClose={onClose}
      />
    )
    expect(screen.getByText('First Win')).toBeInTheDocument()
    expect(screen.getByText('Streak Master')).toBeInTheDocument()
  })

  it('calls onClose when Continuar button is clicked', () => {
    const onClose = vi.fn()
    render(
      <AchievementModal
        achievements={mockAchievements}
        playerNames={mockPlayerNames}
        onClose={onClose}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('filters out players with empty achievement arrays', () => {
    const onClose = vi.fn()
    render(
      <AchievementModal
        achievements={mockAchievements}
        playerNames={mockPlayerNames}
        onClose={onClose}
      />
    )
    // Only p1 and p2 should have headings — p3 is empty and filtered out
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(2)
  })

  it('falls back to player ID when name not in playerNames map', () => {
    const onClose = vi.fn()
    // Map without 'p1' entry
    const partialMap = new Map([['p2', 'Bob']])
    render(
      <AchievementModal
        achievements={mockAchievements}
        playerNames={partialMap}
        onClose={onClose}
      />
    )
    // p1 should show as 'p1' (fallback to player ID)
    expect(screen.getByText('p1')).toBeInTheDocument()
  })
})
