import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RankingFilters from '@/components/RankingFilters/RankingFilters'
import type { MultiSelectOption } from '@/components/MultiSelect/MultiSelect'

const playerOptions: MultiSelectOption[] = [
  { value: 'p1', label: 'Alice' },
  { value: 'p2', label: 'Bob' },
]

const defaultProps = {
  players: [] as string[],
  fromDate: null as string | null,
  activePlayersOptions: playerOptions,
  onPlayersChange: vi.fn(),
  onFromDateChange: vi.fn(),
  onClear: vi.fn(),
}

describe('RankingFilters', () => {
  it('renders MultiSelect with provided options and marks selected value', () => {
    render(<RankingFilters {...defaultProps} players={['p1']} />)
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
    expect(screen.getByText(/Bob/)).toBeInTheDocument()
    // MultiSelect marks selected items with "✓ " prefix
    expect(screen.getByText('✓ Alice')).toBeInTheDocument()
  })

  it('MultiSelect change propagates via onPlayersChange', () => {
    const onPlayersChange = vi.fn()
    render(
      <RankingFilters
        {...defaultProps}
        players={['p1']}
        onPlayersChange={onPlayersChange}
      />,
    )
    // Click Bob to toggle it ON
    fireEvent.click(screen.getByText('Bob'))
    expect(onPlayersChange).toHaveBeenCalledTimes(1)
    const called = onPlayersChange.mock.calls[0][0] as string[]
    expect(called).toContain('p1')
    expect(called).toContain('p2')
  })

  it('date input renders with value reflecting fromDate prop', () => {
    const { rerender } = render(
      <RankingFilters {...defaultProps} fromDate="2026-01-15" />,
    )
    const input = screen.getByLabelText(/desde/i) as HTMLInputElement
    expect(input.value).toBe('2026-01-15')

    rerender(<RankingFilters {...defaultProps} fromDate={null} />)
    expect((screen.getByLabelText(/desde/i) as HTMLInputElement).value).toBe('')
  })

  it('date change calls onFromDateChange with raw string', () => {
    const onFromDateChange = vi.fn()
    render(<RankingFilters {...defaultProps} onFromDateChange={onFromDateChange} />)
    const input = screen.getByLabelText(/desde/i)
    fireEvent.change(input, { target: { value: '2026-03-01' } })
    expect(onFromDateChange).toHaveBeenCalledTimes(1)
    expect(onFromDateChange).toHaveBeenCalledWith('2026-03-01')
    // Must be a string, not a Date object
    expect(typeof onFromDateChange.mock.calls[0][0]).toBe('string')
  })

  it('date clear calls onFromDateChange with null', () => {
    const onFromDateChange = vi.fn()
    render(
      <RankingFilters {...defaultProps} fromDate="2026-01-15" onFromDateChange={onFromDateChange} />,
    )
    const input = screen.getByLabelText(/desde/i)
    fireEvent.change(input, { target: { value: '' } })
    expect(onFromDateChange).toHaveBeenCalledTimes(1)
    expect(onFromDateChange).toHaveBeenCalledWith(null)
  })

  it('Limpiar filtros button calls onClear', () => {
    const onClear = vi.fn()
    render(<RankingFilters {...defaultProps} onClear={onClear} />)
    const button = screen.getByRole('button', { name: /limpiar filtros/i })
    fireEvent.click(button)
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('rendered DOM has zero elements with a style attribute', () => {
    const { container } = render(<RankingFilters {...defaultProps} />)
    expect(container.querySelectorAll('[style]').length).toBe(0)
  })

  it('exports default RankingFilters and RankingFiltersProps interface', async () => {
    const mod = await import('@/components/RankingFilters/RankingFilters')
    expect(typeof mod.default).toBe('function')
    expect(mod.default.name).toBe('RankingFilters')
  })
})
