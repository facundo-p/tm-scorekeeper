import type { ReactNode } from 'react'
import styles from './NewBadge.module.css'

export function NewBadge({ children = 'Nuevo' }: { children?: ReactNode }) {
  return <span className={styles.newbadge} title="Nuevo en v2.0">{children}</span>
}
