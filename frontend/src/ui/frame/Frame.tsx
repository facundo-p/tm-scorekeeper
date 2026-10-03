import { useEffect, useRef, type ReactNode } from 'react'
import '@/styles/index.css'
import { cx } from '../cx'
import styles from './Frame.module.css'

interface FrameProps {
  /** Nombre de la pantalla, como en `screen--<nombre>` del mockup. */
  screen: string
  /** `plain`: sin navegación, cielo ni planeta (galería, D-42). */
  variant?: 'plain'
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
 * Marco de la app nueva (D-43): escenario, dispositivo (raíz de las container queries),
 * scroller con `data-scroll-root`, pantalla y capa de hojas (#overlays). Carga los estilos
 * del sistema visual. F26 le agrega el shell.
 */
export function Frame({ screen, variant, children }: FrameProps) {
  const device = useRef<HTMLDivElement>(null)
  useSheen(device)
  return (
    <div className={cx(styles.stage, styles['stage--desktop'])}>
      <div className={styles['device-fit']}>
        <div className={cx(styles.device, variant && styles[`device--${variant}`])} ref={device}>
          <div className={styles.fx} />
          <div className={styles.scroller} data-scroll-root>
            <main className={cx(styles.screen, styles[`screen--${screen}`])}>{children}</main>
          </div>
          <div className={styles.overlays} id="overlays" />
        </div>
      </div>
    </div>
  )
}
