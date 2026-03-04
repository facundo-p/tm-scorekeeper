import Input from '@/components/Input/Input'
import Select from '@/components/Select/Select'
import { MapName, Expansion } from '@/constants/enums'
import type { GameFormState } from '../GameForm.types'
import styles from '../GameForm.module.css'

interface Props {
  state: GameFormState
  onChange: (patch: Partial<GameFormState>) => void
}

const MAP_OPTIONS = Object.values(MapName).map((v) => ({ value: v, label: v }))

const EXPANSION_LIST = [
  { value: Expansion.PRELUDE, label: 'Prelude' },
  { value: Expansion.COLONIES, label: 'Colonies' },
  { value: Expansion.TURMOIL, label: 'Turmoil' },
  { value: Expansion.VENUS_NEXT, label: 'Venus Next' },
]

export default function StepGameSetup({ state, onChange }: Props) {
  const toggleExpansion = (exp: Expansion) => {
    const next = state.expansions.includes(exp)
      ? state.expansions.filter((e) => e !== exp)
      : [...state.expansions, exp]
    onChange({ expansions: next })
  }

  return (
    <div className={styles.stepContent}>
      <Input
        label="Fecha"
        type="date"
        value={state.date}
        onChange={(e) => onChange({ date: e.target.value })}
        required
      />
      <Select
        label="Mapa"
        options={MAP_OPTIONS}
        value={state.map}
        onChange={(e) => onChange({ map: e.target.value as MapName })}
        placeholder="Seleccionar mapa..."
        required
      />
      <div>
        <p className={styles.hintTextMb}>
          Expansiones
        </p>
        <div className={styles.expansionGroup}>
          {EXPANSION_LIST.map((exp) => (
            <label
              key={exp.value}
              className={`${styles.expansionTag} ${state.expansions.includes(exp.value as Expansion) ? styles.expansionTagActive : ''}`}
            >
              <input
                type="checkbox"
                checked={state.expansions.includes(exp.value as Expansion)}
                onChange={() => toggleExpansion(exp.value as Expansion)}
                className={styles.checkboxInputSm}
              />
              {exp.label}
            </label>
          ))}
        </div>
      </div>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={state.draft}
          onChange={(e) => onChange({ draft: e.target.checked })}
          className={styles.checkboxInputPrimary}
        />
        <span>Draft activado</span>
      </label>
      <Input
        label="Generaciones jugadas"
        type="number"
        value={state.generations}
        min={1}
        onChange={(e) => onChange({ generations: parseInt(e.target.value) || 1 })}
        required
      />
    </div>
  )
}
