import { useId, type ReactNode } from 'react'
import { useDismissable } from '../hooks/useDismissable'
import { Icon } from '../icons'
import styles from './HelpTip.module.css'

interface HelpTipProps {
  /** Nombre del logro o récord (encabeza la burbuja). */
  title: string
  /** Qué significa. */
  text: string
  /** El ícono que se toca; sin él, un «i» chico. */
  children?: ReactNode
}

/** Ícono que, al tocarlo, abre una burbuja con qué significa (logros y récords). Sin texto, solo el ícono. */
export function HelpTip({ title, text, children }: HelpTipProps) {
  const { open, toggle, ref } = useDismissable<HTMLSpanElement>()
  const id = useId()
  const trigger = children ?? <Icon name="info" size={14} />
  if (!text) return <>{children}</>
  return (
    <span ref={ref} className={styles.helptip}>
      <button type="button" className={styles.helptip__trigger} onClick={toggle}
        aria-expanded={open} aria-controls={id} aria-label={`Qué es «${title}»`}>{trigger}</button>
      {open && <span id={id} role="note" className={styles.helptip__bubble}><b>{title}</b>{text}</span>}
    </span>
  )
}
