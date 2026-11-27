import type { ReactNode } from 'react'
import { cssVars } from '@/domain/cssVars'
import { cx } from '../cx'
import reveal from '../reveal.module.css'
import styles from './ScreenHead.module.css'

interface ScreenHeadProps {
  title: ReactNode
  sub?: ReactNode
  children?: ReactNode
  /** Orden en la entrada orquestada de la pantalla (`reveal` con `--i`). */
  revealAt?: number
  asideClassName?: string
}

/** Título de la pantalla, bajada y acciones a la derecha. */
export function ScreenHead({ title, sub, children, revealAt, asideClassName }: ScreenHeadProps) {
  return (
    <header className={cx(styles['screen-head'], revealAt !== undefined && reveal.reveal)} style={cssVars({ i: revealAt })}>
      <div>
        <h1 className={styles['screen-head__title']}>{title}</h1>
        {sub && <p className={styles['screen-head__sub']}>{sub}</p>}
      </div>
      {/* Como el mockup: si la pantalla pasa acciones (aunque hoy no muestre ninguna), el contenedor queda. */}
      {children !== undefined && <div className={cx(styles['screen-head__aside'], asideClassName)}>{children}</div>}
    </header>
  )
}
