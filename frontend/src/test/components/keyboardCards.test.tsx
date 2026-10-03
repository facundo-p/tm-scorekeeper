import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { PlayerResponseDTO } from '@/types'

vi.mock('@/hooks/usePlayers', () => ({ usePlayers: vi.fn() }))

import { usePlayers } from '@/hooks/usePlayers'
import Players from '@/pages/Players/Players'
import StepPlayerSelection from '@/pages/GameForm/steps/StepPlayerSelection'
import { INITIAL_GAME_STATE } from '@/pages/GameForm/GameForm.types'
import { MAX_PLAYERS } from '@/constants/gameRules'

const players: PlayerResponseDTO[] = Array.from({ length: MAX_PLAYERS + 1 }, (_, i) => ({
  player_id: `p${i}`, name: `Jugador ${i}`, is_active: true, elo: 1000,
}))

function mockPlayers() {
  vi.mocked(usePlayers).mockReturnValue({
    players, loading: false, error: null, addPlayer: vi.fn(), editPlayer: vi.fn(),
  } as unknown as ReturnType<typeof usePlayers>)
}

describe('StepPlayerSelection con teclado', () => {
  it('cada jugador es una casilla; Espacio la marca', () => {
    mockPlayers()
    const onChange = vi.fn()
    render(<StepPlayerSelection state={INITIAL_GAME_STATE} onChange={onChange} />)
    const first = screen.getByRole('checkbox', { name: /Jugador 0/ })
    expect(first).toHaveAttribute('aria-checked', 'false')
    fireEvent.keyDown(first, { key: ' ' })
    expect(onChange).toHaveBeenCalledWith({ selectedPlayerIds: ['p0'] })
  })

  it('con la mesa llena, las demás quedan deshabilitadas y fuera del orden de tabulación', () => {
    mockPlayers()
    const onChange = vi.fn()
    const full = players.slice(0, MAX_PLAYERS).map((p) => p.player_id)
    render(<StepPlayerSelection state={{ ...INITIAL_GAME_STATE, selectedPlayerIds: full }} onChange={onChange} />)
    const extra = screen.getByRole('checkbox', { name: new RegExp(`Jugador ${MAX_PLAYERS}`) })
    expect(extra).toHaveAttribute('aria-disabled', 'true')
    expect(extra).toHaveAttribute('tabindex', '-1')
    fireEvent.keyDown(extra, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('Players con teclado', () => {
  function renderPlayers() {
    mockPlayers()
    render(<MemoryRouter initialEntries={['/players']}><Routes>
      <Route path="/players" element={<Players />} />
      <Route path="/players/:id/profile" element={<p>perfil</p>} />
    </Routes></MemoryRouter>)
  }

  it('Enter en la tarjeta abre el perfil', () => {
    renderPlayers()
    fireEvent.keyDown(screen.getByRole('link', { name: /Jugador 0/ }), { key: 'Enter' })
    expect(screen.getByText('perfil')).toBeInTheDocument()
  })

  it('Enter en «Editar» no navega', () => {
    renderPlayers()
    fireEvent.keyDown(screen.getAllByRole('button', { name: 'Editar' })[0], { key: 'Enter' })
    expect(screen.queryByText('perfil')).toBeNull()
  })
})
