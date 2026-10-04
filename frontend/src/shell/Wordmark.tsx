import { cx } from '@/ui/cx'
import styles from './Chrome.module.css'

/** El símbolo de la marca: hexágono con Marte y su luna (también lo usa el acceso). */
export function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 2l15.6 9v18L20 38 4.4 29V11z" className={styles['wm-hex']} />
      <path d="M8.5 25.5a14 14 0 0 1 23 0" className={styles['wm-arc']} />
      <circle cx="20" cy="26" r="6.2" className={styles['wm-planet']} />
      <circle cx="29.5" cy="13.5" r="1.6" className={styles['wm-moon']} />
    </svg>
  )
}

/** Marca: símbolo y nombre; compacta en el rail. */
export function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <span className={cx(styles.wordmark, compact && styles['wordmark--compact'])}>
      <Mark className={styles.wordmark__mark} />
      {!compact && <span className={styles.wordmark__text}><b>Archivo</b><span>de Terraformación</span></span>}
    </span>
  )
}
