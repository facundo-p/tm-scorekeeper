import type { ReactNode } from 'react'
import styles from './instruments.module.css'

/**
 * Contenedor de las tablas de datos: en pantallas angostas se desplaza de costado, así que recibe
 * foco para poder moverlo con el teclado (axe: scrollable-region-focusable; el mockup no lo tiene).
 */
export function TableWrap({ children }: { children: ReactNode }) {
  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- región desplazable, necesita foco
  return <div className={styles['dtable-wrap']} tabIndex={0}>{children}</div>
}
