import Select from '@/components/Select/Select'
import { MAP_MILESTONES, MAX_MILESTONES } from '@/constants/gameRules'
import { MapName, type Milestone } from '@/constants/enums'
import type { GameFormState, MilestoneEntry } from '../GameForm.types'
import styles from '../GameForm.module.css'

interface Props {
  state: GameFormState
  onChange: (patch: Partial<GameFormState>) => void
}

export default function StepMilestones({ state, onChange }: Props) {
  const availableMilestones: Milestone[] = state.map ? MAP_MILESTONES[state.map as MapName] ?? [] : []
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
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        Hasta {MAX_MILESTONES} hitos pueden ser reclamados en la partida ({claimedCount}/{MAX_MILESTONES})
      </p>

      {availableMilestones.map((milestone) => {
        const entry = getMilestoneEntry(milestone)
        const canClaim = entry.claimed || claimedCount < MAX_MILESTONES

        return (
          <div
            key={milestone}
            style={{
              background: entry.claimed ? 'var(--color-surface-hover)' : 'var(--color-surface)',
              border: `1px solid ${entry.claimed ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 'var(--border-radius)',
              padding: 'var(--spacing-md)',
              opacity: !canClaim ? 0.5 : 1,
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: canClaim ? 'pointer' : 'not-allowed' }}>
              <input
                type="checkbox"
                checked={entry.claimed}
                onChange={() => toggleClaimed(milestone)}
                disabled={!canClaim}
                style={{ accentColor: 'var(--color-accent)', width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{milestone}</span>
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
