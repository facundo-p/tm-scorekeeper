import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EloSummaryCard from '@/components/EloSummaryCard/EloSummaryCard'
import type { PlayerEloSummaryDTO } from '@/types'

const baseSummary: PlayerEloSummaryDTO = {
  current_elo: 1523,
  peak_elo: 1500,
  last_delta: 5,
  rank: { position: 3, total: 8 },
}

describe('EloSummaryCard', () => {
  it('renders current_elo', () => {
    render(<EloSummaryCard summary={baseSummary} />)
    expect(screen.getByText('1523')).toBeInTheDocument()
    expect(screen.getByText('ELO')).toBeInTheDocument()
  })

  it('renders em-dash for zero games', () => {
    const summary: PlayerEloSummaryDTO = {
      current_elo: 1000,
      peak_elo: null,
      last_delta: null,
      rank: null,
    }
    render(<EloSummaryCard summary={summary} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('1000')).not.toBeInTheDocument()
  })

  it('positive delta uses success class', () => {
    const summary = { ...baseSummary, last_delta: 23 }
    render(<EloSummaryCard summary={summary} />)
    const delta = screen.getByText('+23')
    expect(delta.className).toMatch(/deltaPositive/)
  })

  it('negative delta uses error class', () => {
    const summary = { ...baseSummary, last_delta: -12 }
    render(<EloSummaryCard summary={summary} />)
    const delta = screen.getByText('-12')
    expect(delta.className).toMatch(/deltaNegative/)
  })

  it('zero delta uses muted class', () => {
    const summary = { ...baseSummary, last_delta: 0 }
    render(<EloSummaryCard summary={summary} />)
    const delta = screen.getByText('±0')
    expect(delta.className).toMatch(/deltaZero/)
  })

  it('delta has aria-label', () => {
    const summary = { ...baseSummary, last_delta: 23 }
    render(<EloSummaryCard summary={summary} />)
    expect(
      screen.getByLabelText('Cambio de ELO en la última partida: +23'),
    ).toBeInTheDocument()
  })

  it('delta hidden when null', () => {
    const summary = { ...baseSummary, last_delta: null }
    render(<EloSummaryCard summary={summary} />)
    expect(screen.queryByText(/^[+\-±]/)).not.toBeInTheDocument()
  })

  it('peak equals current shows actual suffix', () => {
    const summary: PlayerEloSummaryDTO = {
      current_elo: 1612,
      peak_elo: 1612,
      last_delta: 5,
      rank: { position: 1, total: 5 },
    }
    render(<EloSummaryCard summary={summary} />)
    expect(screen.getByText(/Pico: 1612 · actual/)).toBeInTheDocument()
  })

  it('peak greater than current omits suffix', () => {
    const summary = { ...baseSummary, current_elo: 1500, peak_elo: 1612 }
    render(<EloSummaryCard summary={summary} />)
    expect(screen.getByText(/Pico: 1612/)).toBeInTheDocument()
    expect(screen.queryByText(/actual/)).not.toBeInTheDocument()
  })

  it('peak hidden when null', () => {
    const summary = { ...baseSummary, peak_elo: null }
    render(<EloSummaryCard summary={summary} />)
    expect(screen.queryByText(/Pico/)).not.toBeInTheDocument()
  })

  it('renders rank', () => {
    render(<EloSummaryCard summary={baseSummary} />)
    expect(screen.getByText('#3 de 8')).toBeInTheDocument()
  })

  it('rank hidden when null', () => {
    const summary = { ...baseSummary, rank: null }
    render(<EloSummaryCard summary={summary} />)
    expect(screen.queryByText(/^#\d+ de/)).not.toBeInTheDocument()
  })

  it('single active player renders #1 de 1', () => {
    const summary = { ...baseSummary, rank: { position: 1, total: 1 } }
    render(<EloSummaryCard summary={summary} />)
    expect(screen.getByText('#1 de 1')).toBeInTheDocument()
  })

  // --- Phase 14: history prop / embedded chart ---

  const historyFixture = [
    {
      player_id: 'p-alice',
      player_name: 'Alice',
      points: [
        { recorded_at: '2025-06-01', game_id: 'g1', elo_after: 1510, delta: 10 },
        { recorded_at: '2025-06-15', game_id: 'g2', elo_after: 1520, delta: 10 },
      ],
    },
  ]

  it('renders without history prop (backward compatible)', () => {
    const { container } = render(<EloSummaryCard summary={baseSummary} />)
    expect(container.querySelector('[class*="chartArea"]')).toBeNull()
  })

  it('renders chart container when history has 1+ players with 1+ points', () => {
    const { container } = render(
      <EloSummaryCard summary={baseSummary} history={historyFixture} />
    )
    expect(container.querySelector('[class*="chartArea"]')).not.toBeNull()
  })

  it('does NOT render chart when history is empty array (D-10)', () => {
    const { container } = render(
      <EloSummaryCard summary={baseSummary} history={[]} />
    )
    expect(container.querySelector('[class*="chartArea"]')).toBeNull()
  })

  it('does NOT render chart when history has only zero-point players (D-10)', () => {
    const emptyPointsHistory = [
      { player_id: 'p-alice', player_name: 'Alice', points: [] },
    ]
    const { container } = render(
      <EloSummaryCard summary={baseSummary} history={emptyPointsHistory} />
    )
    expect(container.querySelector('[class*="chartArea"]')).toBeNull()
  })
})
