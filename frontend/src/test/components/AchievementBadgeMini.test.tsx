import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AchievementBadgeMini from '@/components/AchievementBadgeMini/AchievementBadgeMini'

const baseProps = {
  title: 'Gran Terraformador',
  tier: 3,
  fallback_icon: 'trophy',
  is_new: true,
}

describe('AchievementBadgeMini', () => {
  it('renders title text', () => {
    render(<AchievementBadgeMini {...baseProps} />)
    expect(screen.getByText('Gran Terraformador')).toBeInTheDocument()
  })

  it('renders AchievementIcon at size 20 (SVG present)', () => {
    const { container } = render(<AchievementBadgeMini {...baseProps} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg?.getAttribute('width')).toBe('20')
    expect(svg?.getAttribute('height')).toBe('20')
  })

  it('shows "NIVEL 3" tier pill', () => {
    render(<AchievementBadgeMini {...baseProps} tier={3} />)
    expect(screen.getByText('NIVEL 3')).toBeInTheDocument()
  })

  it('uses data-type="new" when is_new=true', () => {
    const { container } = render(
      <AchievementBadgeMini {...baseProps} is_new={true} />,
    )
    const badge = container.firstChild as HTMLElement
    expect(badge.getAttribute('data-type')).toBe('new')
  })

  it('uses data-type="upgrade" when is_new=false', () => {
    const { container } = render(
      <AchievementBadgeMini {...baseProps} is_new={false} />,
    )
    const badge = container.firstChild as HTMLElement
    expect(badge.getAttribute('data-type')).toBe('upgrade')
  })
})
