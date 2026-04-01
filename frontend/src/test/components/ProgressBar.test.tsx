import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgressBar from '@/components/ProgressBar/ProgressBar'

describe('ProgressBar', () => {
  it('renders fill at 0% width when value=0', () => {
    const { container } = render(<ProgressBar value={0} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('0%')
  })

  it('renders fill at 50% width when value=50', () => {
    const { container } = render(<ProgressBar value={50} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('50%')
  })

  it('renders fill at 100% width when value=100', () => {
    const { container } = render(<ProgressBar value={100} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('100%')
  })

  it('clamps value to 0 when negative', () => {
    const { container } = render(<ProgressBar value={-10} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('0%')
  })

  it('clamps value to 100 when over 100', () => {
    const { container } = render(<ProgressBar value={150} />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('100%')
  })

  it('has role="progressbar" with aria-valuenow', () => {
    render(<ProgressBar value={42} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeInTheDocument()
    expect(progressbar.getAttribute('aria-valuenow')).toBe('42')
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0')
    expect(progressbar.getAttribute('aria-valuemax')).toBe('100')
  })
})
