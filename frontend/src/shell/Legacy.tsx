import type { ReactNode } from 'react'
import styles from './Legacy.module.css'

/** Pantalla de antes de v2.0 dentro del shell nuevo, hasta que su fase la reemplace (D-69). */
export function Legacy({ children }: { children: ReactNode }) {
  return <div className={styles.legacy}>{children}</div>
}
