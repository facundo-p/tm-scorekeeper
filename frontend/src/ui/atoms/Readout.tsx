import type { ReactNode } from 'react'
import { Icon } from '../icons'
import { cx } from '../cx'
import styles from './Readout.module.css'

interface ReadoutProps {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  icon?: string
  accent?: boolean
}

/** Lectura de instrumento: rótulo, valor grande y aclaración. */
export function Readout({ label, value, sub, icon, accent }: ReadoutProps) {
  return (
    <div className={cx(styles.readout, accent && styles['readout--accent'])}>
      <span className={styles.readout__label}>{icon && <Icon name={icon} size={15} />}{label}</span>
      <span className={styles.readout__value}>{value}</span>
      {sub && <span className={styles.readout__sub}>{sub}</span>}
    </div>
  )
}
