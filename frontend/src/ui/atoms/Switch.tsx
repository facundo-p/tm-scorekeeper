import type { ReactNode } from 'react'
import styles from './Switch.module.css'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}

/** Interruptor sobre un checkbox nativo; el texto acompaña al estado. */
export function Switch({ checked, onChange, children }: SwitchProps) {
  return (
    <label className={styles.switch}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.switch__track} />
      <span>{children}</span>
    </label>
  )
}
