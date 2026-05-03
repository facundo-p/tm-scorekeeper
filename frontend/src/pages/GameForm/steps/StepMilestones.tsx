import Select from '@/components/Select/Select'
import { EXPANSION_MILESTONES, MAP_MILESTONES, MAX_MILESTONES } from '@/constants/gameRules'
import { MapName, type Milestone } from '@/constants/enums'
import type { GameFormState, MilestoneEntry } from '../GameForm.types'
import styles from '../GameForm.module.css'

interface Props {
  state: GameFormState
  onChange: (patch: Partial<GameFormState>) => void
}

export default function StepMilestones({ state, onChange }: Props) {
  const mapMilestones: Milestone[] = state.map ? MAP_MILESTONES[state.map as MapName] ?? [] : []
  const expansionMilestones: Milestone[] = state.expansions.flatMap(
    (exp) => EXPANSION_MILESTONES[exp] ?? []
  )
  const availableMilestones: Milestone[] = [...mapMilestones, ...expansionMilestones]
  const playerOptions = [
    { value: '', label: 'Nadie' },
    ...state.players.map((p) => ({ value: p.player_id, label: p.name })),
  ]

  const claimedCount = state.milestones.filter((m) => m.claimed).length

  const updateMilestone = (milestone: Milestone, patch: Partial<MilestoneEntry>) => {
    const updated = state.milestones.map((m) =>
      m.milestone === milestone ? { ...m, ...patch } : m,
    )
    onChange({ milestones: updated })
  }

  const getMilestoneEntry = (milestone: Milestone): MilestoneEntry =>
    state.milestones.find((m) => m.milestone === milestone) ?? {
      milestone,
      claimed: false,
      player_id: '',
    }

  const toggleClaimed = (milestone: Milestone) => {
    const entry = getMilestoneEntry(milestone)
    if (!entry.claimed && claimedCount >= MAX_MILESTONES) return
    const newClaimed = !entry.claimed
    const existing = state.milestones.find((m) => m.milestone === milestone)
    if (existing) {
      updateMilestone(milestone, { claimed: newClaimed, player_id: newClaimed ? existing.player_id : '' })
    } else {
      onChange({
        milestones: [...state.milestones, { milestone, claimed: newClaimed, player_id: '' }],
      })
    }
  }

  return (
    <div className={styles.stepContent}>
      <p className={styles.hintText}>
        Hasta {MAX_MILESTONES} hitos pueden ser reclamados en la partida ({claimedCount}/{MAX_MILESTONES})
      </p>

      {availableMilestones.map((milestone) => {
        const entry = getMilestoneEntry(milestone)
        const canClaim = entry.claimed || claimedCount < MAX_MILESTONES

        return (
          <div
            key={milestone}
            className={`${styles.card} ${entry.claimed ? styles.cardActive : ''} ${!canClaim ? styles.cardDisabled : ''}`}
          >
            <label className={`${styles.checkboxLabel} ${!canClaim ? styles.checkboxLabelDisabled : ''}`}>
              <input
                type="checkbox"
                checked={entry.claimed}
                onChange={() => toggleClaimed(milestone)}
                disabled={!canClaim}
                className={styles.checkboxInput}
              />
              <span className={styles.fontMedium}>{milestone}</span>
            </label>
            {entry.claimed && (
              <div style={{ marginTop: 'var(--spacing-sm)' }}>
                <Select
                  label="Reclamado por"
                  options={playerOptions}
                  value={entry.player_id}
                  onChange={(e) => updateMilestone(milestone, { player_id: e.target.value })}
                  required
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
