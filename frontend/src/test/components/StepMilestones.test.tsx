import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StepMilestones from '@/pages/GameForm/steps/StepMilestones'
import { INITIAL_GAME_STATE, type PlayerFormData } from '@/pages/GameForm/GameForm.types'
import { Expansion, MapName, Milestone } from '@/constants/enums'
import type { GameFormState } from '@/pages/GameForm/GameForm.types'

const basePlayers: PlayerFormData[] = [
  { player_id: 'p1', name: 'Alice', corporation: '', terraform_rating: 20, mc_total: 0, card_resource_points: 0, card_points: 0, greenery_points: 0, city_points: 0, turmoil_points: null },
  { player_id: 'p2', name: 'Bob', corporation: '', terraform_rating: 20, mc_total: 0, card_resource_points: 0, card_points: 0, greenery_points: 0, city_points: 0, turmoil_points: null },
]

const stateWithTharsis: GameFormState = {
  ...INITIAL_GAME_STATE,
  map: MapName.THARSIS,
  players: basePlayers,
  selectedPlayerIds: ['p1', 'p2'],
}

describe('StepMilestones', () => {
  it('renders 5 milestones for Tharsis', () => {
    render(<StepMilestones state={stateWithTharsis} onChange={() => {}} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(5)
  })

  it('can claim a milestone', () => {
    const onChange = (patch: Partial<GameFormState>) => {
      expect(patch.milestones).toBeDefined()
      const claimed = patch.milestones!.find((m) => m.milestone === Milestone.TERRAFORMER)
      expect(claimed?.claimed).toBe(true)
    }
    render(<StepMilestones state={stateWithTharsis} onChange={onChange} />)
    fireEvent.click(screen.getAllByRole('checkbox')[0])
  })

  it('disables claiming a 4th milestone when 3 are already claimed', () => {
    const threeClaimedState: GameFormState = {
      ...stateWithTharsis,
      milestones: [
        { milestone: Milestone.TERRAFORMER, claimed: true, player_id: 'p1' },
        { milestone: Milestone.MAYOR, claimed: true, player_id: 'p1' },
        { milestone: Milestone.GARDENER, claimed: true, player_id: 'p2' },
      ],
    }
    render(<StepMilestones state={threeClaimedState} onChange={() => {}} />)

    // The 4th and 5th checkboxes (Builder and Planner) should be disabled
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[3]).toBeDisabled()
    expect(checkboxes[4]).toBeDisabled()
  })

  it('muestra HOVERLORD cuando Venus Next está en expansions', () => {
    const stateWithVenus: GameFormState = {
      ...stateWithTharsis,
      expansions: [Expansion.VENUS_NEXT],
    }
    render(<StepMilestones state={stateWithVenus} onChange={() => {}} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(6)
    expect(screen.getByText(Milestone.HOVERLORD)).toBeInTheDocument()
  })

  it('no muestra HOVERLORD cuando Venus Next no está en expansions', () => {
    render(<StepMilestones state={stateWithTharsis} onChange={() => {}} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(5)
    expect(screen.queryByText(Milestone.HOVERLORD)).not.toBeInTheDocument()
  })
})
