import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StepAwards from '@/pages/GameForm/steps/StepAwards'
import { INITIAL_GAME_STATE, type PlayerFormData } from '@/pages/GameForm/GameForm.types'
import { Expansion, MapName, Award } from '@/constants/enums'
import type { GameFormState } from '@/pages/GameForm/GameForm.types'

const basePlayers: PlayerFormData[] = [
  { player_id: 'p1', name: 'Alice', corporation: '', terraform_rating: 20, card_resource_points: 0, card_points: 0, greenery_points: 0, city_points: 0, turmoil_points: null },
  { player_id: 'p2', name: 'Bob', corporation: '', terraform_rating: 20, card_resource_points: 0, card_points: 0, greenery_points: 0, city_points: 0, turmoil_points: null },
]

const threePlayer: PlayerFormData[] = [
  ...basePlayers,
  { player_id: 'p3', name: 'Carol', corporation: '', terraform_rating: 20, card_resource_points: 0, card_points: 0, greenery_points: 0, city_points: 0, turmoil_points: null },
]

const stateWithHellas: GameFormState = {
  ...INITIAL_GAME_STATE,
  map: MapName.HELLAS,
  players: basePlayers,
  selectedPlayerIds: ['p1', 'p2'],
}

const stateThreePlayers: GameFormState = {
  ...INITIAL_GAME_STATE,
  map: MapName.HELLAS,
  players: threePlayer,
  selectedPlayerIds: ['p1', 'p2', 'p3'],
}

describe('StepAwards', () => {
  it('renders "Agregar recompensa" button when no awards added', () => {
    render(<StepAwards state={stateWithHellas} onChange={() => {}} />)
    expect(screen.getByText(/agregar recompensa/i)).toBeInTheDocument()
  })

  it('adds an award entry when clicking "Agregar recompensa"', () => {
    let captured: Partial<GameFormState> = {}
    const onChange = (patch: Partial<GameFormState>) => { captured = patch }
    render(<StepAwards state={stateWithHellas} onChange={onChange} />)
    fireEvent.click(screen.getByText(/agregar recompensa/i))
    expect(captured.awards).toHaveLength(1)
  })

  it('hides "Agregar recompensa" button when 3 awards are already added', () => {
    const fullAwards: GameFormState = {
      ...stateWithHellas,
      awards: [
        { name: '', opened_by: '', first_place: [], second_place: [] },
        { name: '', opened_by: '', first_place: [], second_place: [] },
        { name: '', opened_by: '', first_place: [], second_place: [] },
      ],
    }
    render(<StepAwards state={fullAwards} onChange={() => {}} />)
    expect(screen.queryByText(/agregar recompensa/i)).not.toBeInTheDocument()
  })

  it('multi-select shows player names for first place', () => {
    const withOneAward: GameFormState = {
      ...stateWithHellas,
      awards: [{ name: '', opened_by: '', first_place: [], second_place: [] }],
    }
    render(<StepAwards state={withOneAward} onChange={() => {}} />)
    // Players appear in select dropdown and multi-select buttons
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)
  })

  it('hides second place selector in a 2-player game', () => {
    const withOneAward: GameFormState = {
      ...stateWithHellas,
      awards: [{ name: Award.CULTIVATOR, opened_by: 'p1', first_place: ['p1'], second_place: [] }],
    }
    render(<StepAwards state={withOneAward} onChange={() => {}} />)
    expect(screen.queryByText(/2do puesto/i)).not.toBeInTheDocument()
  })

  it('shows second place selector in a 3-player game with 1 first-place winner', () => {
    const withOneAward: GameFormState = {
      ...stateThreePlayers,
      awards: [{ name: Award.CULTIVATOR, opened_by: 'p1', first_place: ['p1'], second_place: [] }],
    }
    render(<StepAwards state={withOneAward} onChange={() => {}} />)
    expect(screen.getByText(/2do puesto/i)).toBeInTheDocument()
  })

  it('hides second place selector when there are multiple first-place winners', () => {
    const withTiedFirst: GameFormState = {
      ...stateThreePlayers,
      awards: [{ name: Award.CULTIVATOR, opened_by: 'p1', first_place: ['p1', 'p2'], second_place: [] }],
    }
    render(<StepAwards state={withTiedFirst} onChange={() => {}} />)
    expect(screen.queryByText(/2do puesto/i)).not.toBeInTheDocument()
  })

  it('incluye VENUPHILE en opciones de recompensa cuando Venus Next está activo', () => {
    const stateWithVenus: GameFormState = {
      ...stateWithHellas,
      expansions: [Expansion.VENUS_NEXT],
      awards: [{ name: '', opened_by: '', first_place: [], second_place: [] }],
    }
    render(<StepAwards state={stateWithVenus} onChange={() => {}} />)
    expect(screen.getByText(Award.VENUPHILE)).toBeInTheDocument()
  })

  it('no incluye VENUPHILE cuando Venus Next no está activo', () => {
    const stateNoVenus: GameFormState = {
      ...stateWithHellas,
      awards: [{ name: '', opened_by: '', first_place: [], second_place: [] }],
    }
    render(<StepAwards state={stateNoVenus} onChange={() => {}} />)
    expect(screen.queryByText(Award.VENUPHILE)).not.toBeInTheDocument()
  })
})
