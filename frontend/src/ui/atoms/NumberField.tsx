import type { ReactNode } from 'react'
import { Icon } from '../icons'
import { cx } from '../cx'
import { Field, useFieldId } from './Field'
import styles from './NumberField.module.css'

/** Acota un número al rango; un texto que no es número cuenta como 0. */
export const clampInt = (raw: string | number, min: number, max: number) =>
  Math.max(min, Math.min(max, typeof raw === 'number' ? raw : parseInt(raw, 10) || 0))

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  labelledby?: string
  label?: string
  small?: boolean
  /** Ocupa todo el ancho disponible (el valor crece; los botones no). */
  fluid?: boolean
}

/** Restar, valor editable y sumar, dentro de [min, max]. */
export function Stepper({ value, onChange, min = 0, max = 999, labelledby, label, small, fluid }: StepperProps) {
  return (
    <span className={cx(styles.stepper, small && styles['stepper--s'], fluid && styles['stepper--fluid'])} role="group" aria-labelledby={labelledby} aria-label={label}>
      <button type="button" className={styles.stepper__btn} aria-label="Restar 1" onClick={() => onChange(clampInt(value - 1, min, max))}>
        <Icon name="minus" size={16} />
      </button>
      <input className={styles.stepper__val} type="number" inputMode="numeric" min={min} max={max} value={value}
        aria-label={label ?? 'Cantidad'} onFocus={(e) => e.target.select()}
        onChange={(e) => { if (e.target.value !== '') onChange(clampInt(e.target.value, min, max)) }} />
      <button type="button" className={styles.stepper__btn} aria-label="Sumar 1" onClick={() => onChange(clampInt(value + 1, min, max))}>
        <Icon name="plus" size={16} />
      </button>
    </span>
  )
}

interface NumberFieldProps extends Omit<StepperProps, 'labelledby' | 'label'> {
  label: ReactNode
  hint?: ReactNode
}

export function NumberField({ label, hint, ...stepper }: NumberFieldProps) {
  const id = useFieldId()
  return (
    <Field as="div" label={label} hint={hint} labelId={id}>
      <Stepper {...stepper} labelledby={id} />
    </Field>
  )
}
