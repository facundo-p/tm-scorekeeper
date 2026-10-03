import { useRef, type KeyboardEvent } from 'react'
import { Icon } from '../icons'
import { cx } from '../cx'
import styles from './Tabs.module.css'

export interface TabItem {
  id: string
  label: string
  icon?: string
  count?: number
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  label: string
}

/** Índice de la pestaña a la que lleva una tecla, o null si la tecla no navega. */
export function tabTarget(key: string, index: number, count: number): number | null {
  if (key === 'ArrowRight') return (index + 1) % count
  if (key === 'ArrowLeft') return (index - 1 + count) % count
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return null
}

/** Pestañas accesibles: flechas, Inicio y Fin; solo la activa entra en el orden de tabulación. */
export function Tabs({ items, value, onChange, label }: TabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    const next = tabTarget(e.key, i, items.length)
    if (next == null) return
    e.preventDefault()
    onChange(items[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {items.map((t, i) => (
        <button key={t.id} type="button" role="tab" className={cx(styles.tabs__tab, t.id === value && styles['is-on'])}
          aria-selected={t.id === value} tabIndex={t.id === value ? 0 : -1} ref={(el) => { refs.current[i] = el }}
          onClick={() => onChange(t.id)} onKeyDown={(e) => onKey(e, i)}>
          {t.icon && <Icon name={t.icon} size={16} />}<span>{t.label}</span>
          {t.count != null && <span className={styles.tabs__count}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
