import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { EloChart, EloShift, FormStrip, H2HMatrix, OceanSlots, OxygenArc, ScoreBars, Sparkline, Thermometer } from '@/ui/instruments'
import type { ScoredGame } from '@/ui/instruments'

const facu = { id: 'p-facu', name: 'Facu', color: 'rojo' }
const nico = { id: 'p-nico', name: 'Nico', color: 'azul' }
const game: ScoredGame = {
  expansions: [],
  results: [
    { player: facu, position: 1, total: 98, mc: 40, scores: { terraform_rating: 41, card_points: 25, turmoil_points: null } },
    { player: nico, position: 2, total: 80, mc: 12, scores: { terraform_rating: 40, city_points: 0 } },
  ],
}

describe('instrumentos', () => {
  it('gauges announce their reading', () => {
    const { container } = render(<><Thermometer value={-4} /><OxygenArc value={9} /><OceanSlots value={6} /></>)
    expect(screen.getByRole('img', { name: 'Temperatura -4 grados, 13 de 19 pasos' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Oxígeno 9 de 14 por ciento' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '6 de 9 océanos' })).toBeInTheDocument()
    expect(container.textContent).toContain('Temperatura−4 °C')
  })

  it('score bars draw only non-zero categories; the table shows them all', () => {
    const { rerender } = render(<ScoreBars game={game} />)
    expect(screen.getAllByRole('img').map((e) => e.getAttribute('aria-label'))).toEqual(['Terraform Rating 41', 'Puntos de cartas 25', 'Terraform Rating 40'])
    rerender(<ScoreBars game={game} showTable />)
    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getAllByRole('cell').map((c) => c.textContent)).toEqual(['1. Facu', '41', '0', '0', '0', '25', '0', '0', '98', '40'])
  })

  it('ELO shift shows before → after with a signed delta', () => {
    render(<EloShift changes={[{ player: facu, before: 1000, after: 1012, delta: 12 }, { player: nico, before: 1000, after: 994, delta: -6 }]} />)
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Facu1000→1012▲+12', 'Nico1000→994▼−6'])
  })

  it('form, sparkline and the head-to-head matrix', () => {
    render(<>
      <FormStrip form={[{ position: 1, n: 4 }, { position: 4, n: 4 }]} />
      <Sparkline values={[1]} />
      <H2HMatrix players={[facu, nico]} matrix={{ 'p-facu': { 'p-nico': { games: 4, ahead: 3 } }, 'p-nico': { 'p-facu': { games: 1, ahead: 1 } } }} />
    </>)
    expect(screen.getByRole('list', { name: /Últimas partidas/ }).textContent).toBe('14')
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('75')).toHaveAttribute('data-tip', 'Facu terminó delante de Nico en 3 de 4')
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })

  it('the ELO chart can be read as a table', () => {
    render(<EloChart showTable series={[{ player: facu, points: [{ date: '2025-01-01', elo: 1010 }] }, { player: nico, points: [{ date: '2025-01-02', elo: 990 }] }]} />)
    const rows = screen.getAllByRole('row')
    expect(rows.map((r) => r.textContent)).toEqual(['FechaFacuNico', '2025-01-011010—', '2025-01-02—990'])
  })
})
