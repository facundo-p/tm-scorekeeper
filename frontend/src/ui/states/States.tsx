import type { ReactNode } from 'react'
import { Icon } from '../icons'
import { Button } from '../atoms/Button'
import { Empty } from '../atoms/Empty'
import { cx } from '../cx'
import styles from './States.module.css'

/** Carga: radar, texto y esqueleto de placas. */
export function LoadingState() {
  return (
    <div className={cx(styles.state, styles['state--loading'])} role="status" aria-live="polite">
      <div className={styles.state__scan} aria-hidden="true"><span /></div>
      <p className={styles.state__title}>Sincronizando con el archivo</p>
      <p className={styles.state__body}>Descargando partidas y recalculando el ranking.</p>
      <div className={styles.skel} aria-hidden="true">
        <span className={cx(styles.skel__plate, styles['skel__plate--hero'])} />
        <span className={styles.skel__plate} /><span className={styles.skel__plate} /><span className={styles.skel__plate} />
      </div>
    </div>
  )
}

/** Error de red con reintento; el servidor gratuito puede estar despertando. */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={cx(styles.state, styles['state--error'])} role="alert">
      <span className={styles.state__icon}><Icon name="info" size={28} /></span>
      <p className={styles.state__title}>Se perdió el enlace con el archivo</p>
      <p className={styles.state__body}>El servidor no respondió en 15 segundos. Puede estar despertando: los servicios gratuitos se apagan cuando nadie los usa. Reintentá en unos segundos.</p>
      <Button variant="primary" icon="generation" onClick={onRetry}>Reintentar</Button>
    </div>
  )
}

interface EmptyStateProps {
  icon?: string
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
}

/** Estado vacío de una pantalla o de un filtro sin resultados. */
export function EmptyState(props: EmptyStateProps) {
  return <Empty {...props} />
}
