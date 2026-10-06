import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CountUp } from '@/ui/atoms'

afterEach(() => { vi.unstubAllGlobals() })

describe('CountUp', () => {
  it('con reduced-motion muestra el valor final de entrada', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q }))
    render(<CountUp value={12345} />)
    expect(screen.getByText('12.345')).toBeInTheDocument()
  })

  it('sin reduced-motion arranca desde `from` y usa decimales', () => {
    render(<CountUp value={3.5} from={1} decimals={1} />)
    expect(screen.getByText('1,0')).toBeInTheDocument()
  })
})
