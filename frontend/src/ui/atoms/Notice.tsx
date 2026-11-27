import type { ReactNode } from 'react'
import { Icon } from '../icons'
import styles from './Notice.module.css'

/** Aviso de algo que acaba de pasar (partida editada o eliminada): `.notice` del mockup. */
export function Notice({ children }: { children: ReactNode }) {
  return <p className={styles.notice} role="status"><Icon name="check" size={16} />{children}</p>
}
