import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { HelpTip } from '@/ui/atoms'

describe('HelpTip', () => {
  it('opens the description on tap and closes on a second tap, outside or with Escape', () => {
    render(<><HelpTip title="Ecologista" text="Ganar con 30 puntos de vegetación"><span>medalla</span></HelpTip><p>afuera</p></>)
    const trigger = screen.getByRole('button', { name: 'Qué es «Ecologista»' })
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    fireEvent.click(trigger)
    expect(screen.getByRole('note')).toHaveTextContent('EcologistaGanar con 30 puntos de vegetación')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(trigger)
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    fireEvent.click(trigger)
    fireEvent.pointerDown(screen.getByText('afuera'))
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it('without a description it is just the icon, not a button', () => {
    render(<HelpTip title="X" text=""><span>medalla</span></HelpTip>)
    expect(screen.getByText('medalla')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
