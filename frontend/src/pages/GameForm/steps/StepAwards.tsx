import Select from '@/components/Select/Select'
import MultiSelect from '@/components/MultiSelect/MultiSelect'
import Button from '@/components/Button/Button'
import { MAP_AWARDS, MAX_AWARDS } from '@/constants/gameRules'
import { Award, MapName } from '@/constants/enums'
import type { GameFormState, AwardEntry } from '../GameForm.types'
import styles from '../GameForm.module.css'

interface Props {
  state: GameFormState
  onChange: (patch: Partial<GameFormState>) => void
}

const EMPTY_AWARD: AwardEntry = { name: '', opened_by: '', first_place: [], second_place: [] }

export default function StepAwards({ state, onChange }: Props) {
  const availableAwards: Award[] = state.map ? MAP_AWARDS[state.map as MapName] ?? [] : []
  const playerOptions = state.players.map((p) => ({ value: p.player_id, label: p.name }))
  const twoPlayerGame = state.players.length === 2

  const usedAwardNames = state.awards.map((a) => a.name).filter(Boolean) as Award[]

  const awardOptions = availableAwards.map((a) => ({
    value: a,
    label: usedAwardNames.includes(a) ? `${a} (en uso)` : a,
  }))

  const updateAward = (index: number, patch: Partial<AwardEntry>) => {
    let entry = { ...state.awards[index], ...patch }
    // Auto-clear second place when rules prevent it
    const noSecond = entry.first_place.length > 1 || twoPlayerGame
    if (noSecond) entry = { ...entry, second_place: [] }
    const updated = state.awards.map((a, i) => (i === index ? entry : a))
    onChange({ awards: updated })
  }

  const addAward = () => {
    if (state.awards.length >= MAX_AWARDS) return
    onChange({ awards: [...state.awards, { ...EMPTY_AWARD }] })
  }

  const removeAward = (index: number) => {
    onChange({ awards: state.awards.filter((_, i) => i !== index) })
  }

  return (
    <div className={styles.stepContent}>
      <p className={styles.hintText}>
        Máximo {MAX_AWARDS} recompensas. Se pueden financiar 0 si nadie las abrió. ({state.awards.length}/{MAX_AWARDS})
      </p>

      {state.awards.map((award, i) => {
        const noSecond = award.first_place.length > 1 || twoPlayerGame
        const firstPlaceOptions = playerOptions.filter((p) => !award.second_place.includes(p.value))
        const secondPlaceOptions = playerOptions.filter((p) => !award.first_place.includes(p.value))

        return (
          <div
            key={i}
            className={styles.card}
          >
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recompensa {i + 1}</h3>
              <Button variant="ghost" size="sm" onClick={() => removeAward(i)}>✕</Button>
            </div>
            <div className={styles.colStack}>
              <Select
                label="Recompensa"
                options={awardOptions}
                value={award.name}
                onChange={(e) => updateAward(i, { name: e.target.value as Award | '' })}
                placeholder="Seleccionar recompensa..."
                required
              />
              <Select
                label="Abierto por"
                options={playerOptions}
                value={award.opened_by}
                onChange={(e) => updateAward(i, { opened_by: e.target.value })}
                placeholder="Seleccionar jugador..."
                required
              />
              <MultiSelect
                label="1er puesto (requerido, puede ser múltiple)"
                options={firstPlaceOptions}
                value={award.first_place}
                onChange={(v) => updateAward(i, { first_place: v })}
              />
              {!noSecond && (
                <MultiSelect
                  label="2do puesto (opcional, puede ser múltiple)"
                  options={secondPlaceOptions}
                  value={award.second_place}
                  onChange={(v) => updateAward(i, { second_place: v })}
                />
              )}
            </div>
          </div>
        )
      })}

      {state.awards.length < MAX_AWARDS && (
        <Button variant="secondary" onClick={addAward}>
          + Agregar recompensa
        </Button>
      )}
    </div>
  )
}
