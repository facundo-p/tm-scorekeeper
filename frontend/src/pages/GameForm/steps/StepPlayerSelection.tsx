import { usePlayers } from '@/hooks/usePlayers'
import Spinner from '@/components/Spinner/Spinner'
import { MIN_PLAYERS, MAX_PLAYERS } from '@/constants/gameRules'
import type { GameFormState } from '../GameForm.types'
import styles from '../GameForm.module.css'

interface Props {
  state: GameFormState
  onChange: (patch: Partial<GameFormState>) => void
}

const cardStyle = (selected: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--spacing-sm)',
  padding: 'var(--spacing-md)',
  background: selected ? 'var(--color-surface-hover)' : 'var(--color-surface)',
  border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
  borderRadius: 'var(--border-radius)',
  cursor: 'pointer',
  userSelect: 'none',
})

export default function StepPlayerSelection({ state, onChange }: Props) {
  const { players, loading, error } = usePlayers({ activeOnly: true })

  const toggle = (id: string) => {
    const selected = state.selectedPlayerIds
    const next = selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id]
    if (next.length > MAX_PLAYERS) return
    onChange({ selectedPlayerIds: next })
  }

  if (loading) return <Spinner />
  if (error) return <p style={{ color: 'var(--color-error)' }}>{error}</p>

  return (
    <div className={styles.stepContent}>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        Seleccioná entre {MIN_PLAYERS} y {MAX_PLAYERS} jugadores ({state.selectedPlayerIds.length} seleccionados)
      </p>
      {players.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>No hay jugadores activos. Creá jugadores primero.</p>
      )}
      {players.map((player) => {
        const selected = state.selectedPlayerIds.includes(player.player_id)
        const disabled = !selected && state.selectedPlayerIds.length >= MAX_PLAYERS
        return (
          <div
            key={player.player_id}
            style={{ ...cardStyle(selected), opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            onClick={() => { if (!disabled) toggle(player.player_id) }}
          >
            <span style={{ color: selected ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: 'bold' }}>
              {selected ? '✓' : '○'}
            </span>
            <span>{player.name}</span>
          </div>
        )
      })}
    </div>
  )
}
