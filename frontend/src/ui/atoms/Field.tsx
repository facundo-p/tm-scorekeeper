import { useId, type ChangeEvent, type ReactNode } from 'react'
import { cx } from '../cx'
import styles from './Field.module.css'

/** Clase del control de texto o lista, para usarla fuera de los campos armados. */
export const inputClass = styles.input

interface FieldProps {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  /** `label` envuelve un control nativo; `div` cuando el control se rotula con aria-labelledby. */
  as?: 'label' | 'div'
  labelId?: string
}

/** Rótulo, control y ayuda opcional. */
export function Field({ label, hint, children, as: Tag = 'label', labelId }: FieldProps) {
  return (
    <Tag className={styles.field}>
      <span className={styles.field__label} id={labelId}>{label}</span>
      {children}
      {hint && <span className={styles.field__hint}>{hint}</span>}
    </Tag>
  )
}

interface TextFieldProps {
  label: ReactNode
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'date' | 'password' | 'search'
  hint?: ReactNode
  invalid?: boolean
  name?: string
  autoComplete?: string
}

export function TextField({ label, value, onChange, type = 'text', hint, invalid, name, autoComplete }: TextFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <input className={cx(styles.input, invalid && styles['is-bad'])} type={type} value={value} name={name}
        autoComplete={autoComplete} aria-invalid={invalid || undefined}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} />
    </Field>
  )
}

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label: ReactNode
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  hint?: ReactNode
}

export function SelectField({ label, value, onChange, options, hint }: SelectFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <select className={styles.input} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

/** Id estable para rotular un control con aria-labelledby. */
export const useFieldId = () => useId()
