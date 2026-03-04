import { usePlayers } from '@/hooks/usePlayers'
import Spinner from '@/components/Spinner/Spinner'
import { MIN_PLAYERS, MAX_PLAYERS } from '@/constants/gameRules'
import type { GameFormState } from '../GameForm.types'
import styles from '../GameForm.module.css'

interface Props {
  state: GameFormState
  onChange: (patch: Partial<GameFormState>) => void
}

export default function StepPlayerSelection({ state, onChange }: Props) {
  const { players, loading, error } = usePlayers({ activeOnly: true })

  const toggle = (id: string) => {
    const selected = state.selectedPlayerIds
    const next = selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id]
    if (next.length > MAX_PLAYERS) return
    onChange({ selectedPlayerIds: next })
  }

  if (loading) return <Spinner />
  if (error) return <p className={styles.textError}>{error}</p>

  return (
    <div className={styles.stepContent}>
      <p className={styles.hintText}>
        Seleccioná entre {MIN_PLAYERS} y {MAX_PLAYERS} jugadores ({state.selectedPlayerIds.length} seleccionados)
      </p>
      {players.length === 0 && (
        <p className={styles.textMuted}>No hay jugadores activos. Creá jugadores primero.</p>
      )}
      {players.map((player) => {
        const selected = state.selectedPlayerIds.includes(player.player_id)
        const disabled = !selected && state.selectedPlayerIds.length >= MAX_PLAYERS
        return (
          <div
            key={player.player_id}
            className={`${styles.playerCard} ${selected ? styles.cardActive : ''} ${disabled ? styles.cardDisabled : ''}`}
            onClick={() => { if (!disabled) toggle(player.player_id) }}
          >
            <span className={selected ? styles.accentBold : styles.textMuted}>
              {selected ? '✓' : '○'}
            </span>
            <span>{player.name}</span>
          </div>
        )
      })}
    </div>
  )
}
