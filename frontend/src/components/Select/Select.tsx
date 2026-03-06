import type { SelectHTMLAttributes } from 'react'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  required?: boolean
}

export default function Select({
  label,
  options,
  placeholder,
  error,
  required,
  id,
  className,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label} htmlFor={selectId}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={[styles.select, error ? styles.error : '', className ?? ''].filter(Boolean).join(' ')}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  )
}
