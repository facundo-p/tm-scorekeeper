import Input from '@/components/Input/Input'
import type { GameFormState, PlayerFormData } from '../GameForm.types'
import styles from '../GameForm.module.css'

interface Props {
  state: GameFormState
  field: keyof Pick<PlayerFormData, 'card_resource_points' | 'card_points' | 'greenery_points' | 'city_points' | 'turmoil_points'>
  label: string
  onChange: (patch: Partial<GameFormState>) => void
}

export default function StepScoreField({ state, field, label, onChange }: Props) {
  const updatePlayer = (playerId: string, value: number) => {
    const updated = state.players.map((p) =>
      p.player_id === playerId ? { ...p, [field]: value } : p,
    )
    onChange({ players: updated })
  }

  return (
    <div className={styles.stepContent}>
      {state.players.map((player) => (
        <div
          key={player.player_id}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius)',
            padding: 'var(--spacing-md)',
          }}
        >
          <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-accent)' }}>
            {player.name}
          </h3>
          <Input
            label={label}
            type="number"
            value={player[field] ?? 0}
            min={0}
            onChange={(e) => updatePlayer(player.player_id, parseInt(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            required
          />
        </div>
      ))}
    </div>
  )
}
