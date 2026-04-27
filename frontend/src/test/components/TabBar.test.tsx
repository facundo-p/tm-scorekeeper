import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TabBar from '@/components/TabBar/TabBar'

describe('TabBar', () => {
  it('renders 3 tabs with text Stats, Records, Logros', () => {
    render(
      <TabBar activeTab="stats" onTabChange={() => {}} />,
    )
    expect(screen.getByText('Stats')).toBeInTheDocument()
    expect(screen.getByText('Records')).toBeInTheDocument()
    expect(screen.getByText('Logros')).toBeInTheDocument()
  })

  it('active tab has aria-selected="true"', () => {
    render(<TabBar activeTab="records" onTabChange={() => {}} />)
    const recordsTab = screen.getByText('Records').closest('button')
    expect(recordsTab?.getAttribute('aria-selected')).toBe('true')
  })

  it('inactive tabs have aria-selected="false"', () => {
    render(<TabBar activeTab="stats" onTabChange={() => {}} />)
    const recordsTab = screen.getByText('Records').closest('button')
    const logrosTab = screen.getByText('Logros').closest('button')
    expect(recordsTab?.getAttribute('aria-selected')).toBe('false')
    expect(logrosTab?.getAttribute('aria-selected')).toBe('false')
  })

  it('clicking inactive tab calls onTabChange with the tab id', () => {
    const onTabChange = vi.fn()
    render(<TabBar activeTab="stats" onTabChange={onTabChange} />)
    fireEvent.click(screen.getByText('Logros'))
    expect(onTabChange).toHaveBeenCalledWith('logros')
  })

  it('active tab has "active" CSS class', () => {
    render(<TabBar activeTab="stats" onTabChange={() => {}} />)
    const statsTab = screen.getByText('Stats').closest('button')
    expect(statsTab?.className).toMatch(/active/)
  })
})
