import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AchievementIcon from '@/components/AchievementIcon/AchievementIcon'

describe('AchievementIcon', () => {
  it('renders a trophy icon for fallback_icon="trophy"', () => {
    const { container } = render(
      <AchievementIcon fallback_icon="trophy" unlocked={true} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an icon for fallback_icon="flame"', () => {
    const { container } = render(
      <AchievementIcon fallback_icon="flame" unlocked={true} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an icon for fallback_icon="map"', () => {
    const { container } = render(
      <AchievementIcon fallback_icon="map" unlocked={true} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an icon for fallback_icon="gamepad-2"', () => {
    const { container } = render(
      <AchievementIcon fallback_icon="gamepad-2" unlocked={true} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an icon for fallback_icon="star"', () => {
    const { container } = render(
      <AchievementIcon fallback_icon="star" unlocked={true} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an icon for fallback_icon="zap"', () => {
    const { container } = render(
      <AchievementIcon fallback_icon="zap" unlocked={true} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('falls back to Trophy for unknown fallback_icon values', () => {
    const { container } = render(
      <AchievementIcon fallback_icon="unknown" unlocked={true} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('applies unlocked class when unlocked=true', () => {
    const { container } = render(
      <AchievementIcon fallback_icon="trophy" unlocked={true} />,
    )
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/unlocked/)
  })

  it('applies locked class when unlocked=false', () => {
    const { container } = render(
      <AchievementIcon fallback_icon="trophy" unlocked={false} />,
    )
    const div = container.firstChild as HTMLElement
    expect(div.className).toMatch(/locked/)
  })

  it('renders icon at default size 24', () => {
    const { container } = render(
      <AchievementIcon fallback_icon="trophy" unlocked={true} />,
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg?.getAttribute('width')).toBe('24')
    expect(svg?.getAttribute('height')).toBe('24')
  })

  it('renders icon at custom size when size prop provided', () => {
    const { container } = render(
      <AchievementIcon fallback_icon="trophy" unlocked={true} size={20} />,
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('20')
    expect(svg?.getAttribute('height')).toBe('20')
  })
})
