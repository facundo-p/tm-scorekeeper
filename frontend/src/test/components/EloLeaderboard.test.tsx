import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EloLeaderboard from '@/components/EloLeaderboard/EloLeaderboard'
import type { PlayerEloHistoryDTO } from '@/types'

function p(
  id: string,
  name: string,
  points: { recorded_at: string; elo_after: number; delta: number }[],
): PlayerEloHistoryDTO {
  return {
    player_id: id,
    player_name: name,
    points: points.map((pt, i) => ({
      recorded_at: pt.recorded_at,
      game_id: `${id}-g${i}`,
      elo_after: pt.elo_after,
      delta: pt.delta,
    })),
  }
}

describe('EloLeaderboard', () => {
  it('returns null with empty data', () => {
    const { container } = render(<EloLeaderboard data={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the four column headers in order', () => {
    const data = [p('a', 'Alice', [{ recorded_at: '2025-06-01', elo_after: 1500, delta: 0 }])]
    render(<EloLeaderboard data={data} />)
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers).toEqual(['#', 'Jugador', 'ELO', 'Últ. delta'])
  })

  it('sorts by current_elo descending', () => {
    const data = [
      p('a', 'Alice', [{ recorded_at: '2025-06-01', elo_after: 1450, delta: 0 }]),
      p('b', 'Bob', [{ recorded_at: '2025-06-01', elo_after: 1600, delta: 0 }]),
      p('c', 'Carol', [{ recorded_at: '2025-06-01', elo_after: 1500, delta: 0 }]),
    ]
    render(<EloLeaderboard data={data} />)
    const rows = screen.getAllByRole('row').slice(1) // skip header
    expect(rows[0].textContent).toContain('Bob')
    expect(rows[1].textContent).toContain('Carol')
    expect(rows[2].textContent).toContain('Alice')
  })

  it('breaks ties alphabetically by player_name', () => {
    const data = [
      p('z', 'Zelda', [{ recorded_at: '2025-06-01', elo_after: 1500, delta: 0 }]),
      p('a', 'Alice', [{ recorded_at: '2025-06-01', elo_after: 1500, delta: 0 }]),
      p('m', 'Marco', [{ recorded_at: '2025-06-01', elo_after: 1500, delta: 0 }]),
    ]
    render(<EloLeaderboard data={data} />)
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0].textContent).toContain('Alice')
    expect(rows[1].textContent).toContain('Marco')
    expect(rows[2].textContent).toContain('Zelda')
  })

  it('positions are 1-based and contiguous', () => {
    const data = [
      p('a', 'Alice', [{ recorded_at: '2025-06-01', elo_after: 1450, delta: 0 }]),
      p('b', 'Bob', [{ recorded_at: '2025-06-01', elo_after: 1600, delta: 0 }]),
      p('c', 'Carol', [{ recorded_at: '2025-06-01', elo_after: 1500, delta: 0 }]),
    ]
    render(<EloLeaderboard data={data} />)
    // Positions appear as plain text in the first cell of each row
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('positive delta uses deltaPositive class and +N format', () => {
    const data = [p('a', 'Alice', [
      { recorded_at: '2025-06-01', elo_after: 1500, delta: 0 },
      { recorded_at: '2025-06-15', elo_after: 1523, delta: 23 },
    ])]
    render(<EloLeaderboard data={data} />)
    const cell = screen.getByText('+23')
    expect(cell.className).toMatch(/deltaPositive/)
  })

  it('negative delta uses deltaNegative class and -N format', () => {
    const data = [p('a', 'Alice', [
      { recorded_at: '2025-06-01', elo_after: 1500, delta: 0 },
      { recorded_at: '2025-06-15', elo_after: 1488, delta: -12 },
    ])]
    render(<EloLeaderboard data={data} />)
    const cell = screen.getByText('-12')
    expect(cell.className).toMatch(/deltaNegative/)
  })

  it('zero delta uses deltaZero class and ±0 format', () => {
    const data = [p('a', 'Alice', [{ recorded_at: '2025-06-01', elo_after: 1500, delta: 0 }])]
    render(<EloLeaderboard data={data} />)
    const cell = screen.getByText('±0')
    expect(cell.className).toMatch(/deltaZero/)
  })

  it('reads last point from each player by recorded_at, not array order', () => {
    // Earlier game appears later in the array — must still pick 1523 (newest by date)
    const data = [p('a', 'Alice', [
      { recorded_at: '2025-06-15', elo_after: 1523, delta: 23 },
      { recorded_at: '2025-06-01', elo_after: 1500, delta: 0 },
    ])]
    render(<EloLeaderboard data={data} />)
    expect(screen.getByText('1523')).toBeInTheDocument()
    expect(screen.queryByText('1500')).not.toBeInTheDocument()
    expect(screen.getByText('+23')).toBeInTheDocument()
  })

  it('skips players with zero points', () => {
    const data = [
      p('a', 'Alice', [{ recorded_at: '2025-06-01', elo_after: 1500, delta: 0 }]),
      p('b', 'Bob', []), // no games
    ]
    render(<EloLeaderboard data={data} />)
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })
})
