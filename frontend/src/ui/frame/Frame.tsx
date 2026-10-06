import { useEffect, useRef, type ReactNode } from 'react'
import '@/styles/index.css'
import { cx } from '../cx'
import styles from './Frame.module.css'

interface FrameProps {
  /** Nombre de la pantalla (`data-screen`); en el mockup es la clase `screen--<nombre>`. */
  screen: string
  /** `plain`: sin navegación, cielo ni planeta (galería, D-42); `bare`: sin navegación (acceso, ceremonia). */
  variant?: 'plain' | 'bare'
  /** Cielo de fondo (lo pinta el shell). */
  sky?: ReactNode
  rail?: ReactNode
  topbar?: ReactNode
  dock?: ReactNode
  children: ReactNode
}

/** El brillo de las placas (`data-sheen`) sigue al puntero. */
function useSheen(host: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = host.current
    if (!el) return undefined
    const onMove = (e: PointerEvent) => {
      const plate = (e.target as Element).closest?.<HTMLElement>('[data-sheen]')
      if (!plate) return
      const r = plate.getBoundingClientRect()
      plate.style.setProperty('--mx', `${e.clientX - r.left}px`)
      plate.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    el.addEventListener('pointermove', onMove, { passive: true })
    return () => el.removeEventListener('pointermove', onMove)
  }, [host])
}

/**
 * Marco de la app nueva (D-43): escenario, dispositivo (raíz de las container queries), cielo,
 * rail, scroller con `data-scroll-root` (barra superior y pantalla), dock y capa de hojas
 * (#overlays). Carga los estilos del sistema visual; el shell (src/shell) le pasa las piezas.
 */
export function Frame({ screen, variant, sky, rail, topbar, dock, children }: FrameProps) {
  const device = useRef<HTMLDivElement>(null)
  useSheen(device)
  return (
    <div className={cx(styles.stage, styles['stage--desktop'])}>
      <div className={styles['device-fit']}>
        <div className={cx(styles.device, variant && styles[`device--${variant}`])} ref={device} data-device>
          <div className={styles.fx}>{sky}</div>
          {rail}
          <div className={styles.scroller} data-scroll-root>
            {topbar}
            <main className={cx(styles.screen, styles[`screen--${screen}`])} data-screen={screen}>{children}</main>
          </div>
          {dock}
          <div className={styles.overlays} id="overlays" />
        </div>
      </div>
    </div>
  )
}
