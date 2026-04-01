import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AchievementCard from '@/components/AchievementCard/AchievementCard'

const baseProps = {
  title: 'Test Achievement',
  description: 'Test description',
  fallback_icon: 'trophy',
  tier: 2,
  max_tier: 5,
  unlocked: true,
  progress: null,
}

describe('AchievementCard', () => {
  it('renders title text', () => {
    render(<AchievementCard {...baseProps} />)
    expect(screen.getByText('Test Achievement')).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<AchievementCard {...baseProps} />)
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('renders AchievementIcon with correct props (SVG present)', () => {
    const { container } = render(<AchievementCard {...baseProps} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('shows "NIVEL 2" when tier=2 and unlocked=true', () => {
    render(<AchievementCard {...baseProps} tier={2} unlocked={true} />)
    expect(screen.getByText('NIVEL 2')).toBeInTheDocument()
  })

  it('shows "NIVEL 0" when unlocked=false', () => {
    render(<AchievementCard {...baseProps} unlocked={false} />)
    expect(screen.getByText('NIVEL 0')).toBeInTheDocument()
  })

  it('shows ProgressBar when progress is not null', () => {
    render(
      <AchievementCard
        {...baseProps}
        progress={{ current: 2, target: 5 }}
      />,
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows counter "2/5" when progress={current:2, target:5}', () => {
    render(
      <AchievementCard
        {...baseProps}
        progress={{ current: 2, target: 5 }}
      />,
    )
    expect(screen.getByText('2/5')).toBeInTheDocument()
  })

  it('hides progress bar and counter when progress is null', () => {
    render(<AchievementCard {...baseProps} progress={null} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText(/\//)).not.toBeInTheDocument()
  })

  it('applies unlocked CSS class when unlocked=true', () => {
    const { container } = render(
      <AchievementCard {...baseProps} unlocked={true} />,
    )
    const card = container.firstChild as HTMLElement
    expect(card.className).toMatch(/unlocked/)
  })

  it('applies locked CSS class when unlocked=false', () => {
    const { container } = render(
      <AchievementCard {...baseProps} unlocked={false} />,
    )
    const card = container.firstChild as HTMLElement
    expect(card.className).toMatch(/locked/)
  })
})
