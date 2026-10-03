import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../atoms/Button'
import { cx } from '../cx'
import { initialFocus, trapTab } from './focus'
import styles from './Sheet.module.css'

interface SheetProps {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

/** Capa de las hojas: la del marco (#overlays) o el body si no hay marco. */
const overlayRoot = () => document.getElementById('overlays') ?? document.body

/**
 * Hoja inferior en el teléfono y diálogo centrado en pantallas anchas. Lleva el foco al
 * control con `data-autofocus` (o al primero), lo mantiene adentro, cierra con Escape o con un clic en el fondo y
 * devuelve el foco al cerrarse.
 */
export function Sheet({ title, onClose, children, wide }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    if (ref.current) initialFocus(ref.current)?.focus()
    return () => prev?.focus?.()
  }, [])
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
    if (ref.current) trapTab(e, ref.current)
  }
  return createPortal(
    // El fondo cierra con el mouse; el teclado tiene Escape y el botón Cerrar.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className={styles['sheet-backdrop']} onClick={(e) => { if (e.target === e.currentTarget) onClose() }} onKeyDown={onKey}>
      <div className={cx(styles.sheet, wide && styles['sheet--wide'])} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <div className={styles.sheet__grip} aria-hidden="true" />
        <div className={styles.sheet__head}>
          <h2 className={styles.sheet__title} id={titleId}>{title}</h2>
          <span className={styles.sheet__close}><Button variant="ghost" icon="close" label="Cerrar" onClick={onClose} /></span>
        </div>
        {children}
      </div>
    </div>,
    overlayRoot(),
  )
}

/** Fila de acciones al pie de una hoja. */
export function SheetActions({ children }: { children: ReactNode }) {
  return <div className={styles['sheet-actions']}>{children}</div>
}
