import type { ReactNode } from 'react'
import { Icon } from '../icons'
import styles from './Empty.module.css'

interface EmptyProps {
  icon?: string
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
}

/** Estado vacío: ícono en hexágono, título, explicación y acción opcional. */
export function Empty({ icon = 'search', title, children, action }: EmptyProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.empty__icon}><Icon name={icon} size={26} /></span>
      <p className={styles.empty__title}>{title}</p>
      {children && <p className={styles.empty__body}>{children}</p>}
      {action}
    </div>
  )
}
