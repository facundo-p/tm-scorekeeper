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
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
          Expansiones
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
          {EXPANSION_LIST.map((exp) => (
            <label
              key={exp.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                cursor: 'pointer',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                background: state.expansions.includes(exp.value as Expansion)
                  ? 'var(--color-surface-hover)'
                  : 'var(--color-surface)',
                border: `1px solid ${state.expansions.includes(exp.value as Expansion) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--border-radius-sm)',
              }}
            >
              <input
                type="checkbox"
                checked={state.expansions.includes(exp.value as Expansion)}
                onChange={() => toggleExpansion(exp.value as Expansion)}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              {exp.label}
            </label>
          ))}
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={state.draft}
          onChange={(e) => onChange({ draft: e.target.checked })}
          style={{ accentColor: 'var(--color-primary)', width: 18, height: 18 }}
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
