import styles from './MultiSelect.module.css'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  label?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}

export default function MultiSelect({ label, options, value, onChange, error }: MultiSelectProps) {
  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue))
    } else {
      onChange([...value, optValue])
    }
  }

  return (
    <div className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      {options.length === 0 ? (
        <span className={styles.empty}>Sin opciones disponibles</span>
      ) : (
        <div className={styles.options}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={[styles.option, value.includes(opt.value) ? styles.selected : ''].join(' ')}
              onClick={() => toggle(opt.value)}
            >
              {value.includes(opt.value) ? '✓ ' : ''}
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  )
}
