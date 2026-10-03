import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Icon, MapGlyph, ICONS } from '@/ui/icons'

describe('Icon', () => {
  it('sin label es decorativo y con label es una imagen', () => {
    const { container } = render(<><Icon name="plus" /><Icon name="close" label="Cerrar" /></>)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('img', { name: 'Cerrar' })).toBeInTheDocument()
  })

  it('un nombre desconocido dibuja el punto', () => {
    const { container } = render(<Icon name="no-existe" />)
    expect(container.querySelector('svg circle')).toHaveAttribute('r', '4')
    expect(ICONS.dot).toContain('<circle')
  })

  it('table es la tabla y la medalla de mesa completa es fullTable (D-46)', () => {
    expect(ICONS.table).toContain('M4 5h16v14H4z')
    expect(ICONS.fullTable).toContain('g-metal')
  })
})

describe('MapGlyph', () => {
  it('marca el mapa y lo nombra cuando no hay label', () => {
    render(<MapGlyph glyph="hellas" map="Hellas" />)
    const svg = screen.getByRole('img', { name: 'Hellas' })
    expect(svg).toHaveAttribute('data-map', 'hellas')
    expect(svg.innerHTML).toContain('m-hex')
  })

  it('sin mapa ni label es decorativo', () => {
    const { container } = render(<MapGlyph glyph="tharsis" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
