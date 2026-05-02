import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import EloLineChart, { playerColor } from '@/components/EloLineChart/EloLineChart'
import type { PlayerEloHistoryDTO } from '@/types'

// Strategy for showLegend tests:
// Recharts processes <Legend /> as chart configuration before React reconciles it.
// ResponsiveContainer also skips rendering children in jsdom (needs real dimensions).
//
// Both ResponsiveContainer and LineChart are mocked:
// - ResponsiveContainer renders its children so LineChart actually mounts.
// - LineChart captures its children array so we can check if a Legend element is present.
// - Legend is replaced with mockLegend so child.type === mockLegend gives a reliable signal.
//
// This tests EloLineChart's JSX intent (does it include <Legend /> in the tree it passes
// to LineChart?) rather than Recharts' internal rendering behavior.

const { mockLegend, capturedChildren } = vi.hoisted(() => ({
  mockLegend: vi.fn(() => null),
  capturedChildren: { current: [] as React.ReactNode[] },
}))

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  const MockResponsiveContainer = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  )
  const MockLineChart = ({ children }: { children?: React.ReactNode }) => {
    capturedChildren.current = React.Children.toArray(children)
    return null
  }
  return {
    ...actual,
    Legend: mockLegend,
    ResponsiveContainer: MockResponsiveContainer,
    LineChart: MockLineChart,
  }
})

const fixture: PlayerEloHistoryDTO[] = [
  {
    player_id: 'p-alice',
    player_name: 'Alice',
    points: [
      { recorded_at: '2025-06-01', game_id: 'g1', elo_after: 1510, delta: 10 },
      { recorded_at: '2025-06-15', game_id: 'g2', elo_after: 1520, delta: 10 },
    ],
  },
  {
    player_id: 'p-bob',
    player_name: 'Bob',
    points: [
      { recorded_at: '2025-06-01', game_id: 'g3', elo_after: 1450, delta: -5 },
    ],
  },
]

describe('EloLineChart', () => {
  it('renders role=img wrapper with aria-label', () => {
    render(<EloLineChart data={fixture} />)
    expect(
      screen.getByRole('img', { name: 'Gráfico de evolución de ELO por jugador' }),
    ).toBeInTheDocument()
  })

  it('does not crash with empty data', () => {
    expect(() => render(<EloLineChart data={[]} />)).not.toThrow()
  })

  it('player color is stable across input ordering', () => {
    // Recharts does not render SVG in jsdom (ResponsiveContainer needs dimensions),
    // so we test color determinism via the exported pure function directly.
    // Same player_id must always map to the same hex color, regardless of render order.
    const aliceColor = playerColor('p-alice')
    const bobColor = playerColor('p-bob')

    // Colors must be valid hex strings from the palette
    expect(aliceColor).toMatch(/^#[0-9a-f]{6}$/i)
    expect(bobColor).toMatch(/^#[0-9a-f]{6}$/i)

    // Calling playerColor again (simulating a re-render with reversed input order)
    // must yield identical results — pure function, no external state.
    expect(playerColor('p-alice')).toBe(aliceColor)
    expect(playerColor('p-bob')).toBe(bobColor)

    // Different player_ids must not be forced to the same color (for these two IDs)
    // This validates the hash distributes the two players to different palette slots.
    expect(aliceColor).not.toBe(bobColor)
  })

  // showLegend prop tests — see mock strategy comment at top of file.
  describe('showLegend prop', () => {
    const hasLegendChild = () =>
      capturedChildren.current.some(
        (child) => React.isValidElement(child) && child.type === mockLegend,
      )

    beforeEach(() => {
      capturedChildren.current = []
    })

    it('renders Legend by default (showLegend not specified)', () => {
      render(<EloLineChart data={fixture} />)
      expect(hasLegendChild()).toBe(true)
    })

    it('omits Legend when showLegend={false}', () => {
      render(<EloLineChart data={fixture} showLegend={false} />)
      expect(hasLegendChild()).toBe(false)
    })

    it('renders Legend when showLegend={true} (explicit)', () => {
      render(<EloLineChart data={fixture} showLegend={true} />)
      expect(hasLegendChild()).toBe(true)
    })
  })
})
