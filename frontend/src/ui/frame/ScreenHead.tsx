import type { ReactNode } from 'react'
import styles from './ScreenHead.module.css'

interface ScreenHeadProps {
  title: ReactNode
  sub?: ReactNode
  children?: ReactNode
}

/** Título de la pantalla, bajada y acciones a la derecha. */
export function ScreenHead({ title, sub, children }: ScreenHeadProps) {
  return (
    <header className={styles['screen-head']}>
      <div>
        <h1 className={styles['screen-head__title']}>{title}</h1>
        {sub && <p className={styles['screen-head__sub']}>{sub}</p>}
      </div>
      {children && <div className={styles['screen-head__aside']}>{children}</div>}
    </header>
  )
}
