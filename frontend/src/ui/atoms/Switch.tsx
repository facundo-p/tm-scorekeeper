import type { ReactNode } from 'react'
import { cx } from '../cx'
import styles from './Switch.module.css'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  /** `s`: la variante chica de las recompensas del registro. */
  size?: 's'
  disabled?: boolean
}

/** Interruptor sobre un checkbox nativo; el texto acompaña al estado. */
export function Switch({ checked, onChange, children, size, disabled }: SwitchProps) {
  return (
    <label className={cx(styles.switch, size && styles[`switch--${size}`])}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.switch__track} />
      <span>{children}</span>
    </label>
  )
}
