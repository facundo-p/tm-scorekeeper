import type { ReactNode } from 'react'
import { cx } from '../cx'
import styles from './Filters.module.css'

interface FilterGroupProps {
  label: string
  /** Nombre accesible del grupo (si difiere del rótulo visible). */
  ariaLabel?: string
  className?: string
  children: ReactNode
}

/** Grupo de filtros con rótulo y chips (`.fgroup` del mockup). */
export function FilterGroup({ label, ariaLabel, className, children }: FilterGroupProps) {
  return (
    <div className={cx(styles.fgroup, className)} role="group" aria-label={ariaLabel ?? label}>
      <span className={styles.fgroup__label}>{label}</span>
      <div className={styles.fchips}>{children}</div>
    </div>
  )
}

interface FilterChipProps {
  on: boolean
  onClick: () => void
  ariaLabel?: string
  children: ReactNode
}

/** Chip de filtro que se prende y apaga (`aria-pressed`). */
export function FilterChip({ on, onClick, ariaLabel, children }: FilterChipProps) {
  return (
    <button type="button" className={cx(styles.fchip, on && styles['is-on'])} aria-pressed={on}
      aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  )
}

/** Panel que apila grupos de filtros (`.filters` del mockup). */
export function FilterPanel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx(styles.filters, className)}>{children}</div>
}
