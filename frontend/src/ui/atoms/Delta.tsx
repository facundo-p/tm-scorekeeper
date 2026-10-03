import { fmt } from '@/domain/format'
import { cx } from '../cx'
import type { Size } from './types'
import styles from './Delta.module.css'

const GLYPH = { up: '▲', down: '▼', flat: '■' } as const

/** Variación con signo y flecha; null se muestra como «—». */
export function Delta({ value, size = 'm' }: { value: number | null | undefined; size?: Size }) {
  if (value == null) return <span className={cx(styles.delta, styles['delta--none'])}>—</span>
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  return (
    <span className={cx(styles.delta, styles[`delta--${dir}`], styles[`delta--${size}`])}>
      <span aria-hidden="true" className={styles.delta__glyph}>{GLYPH[dir]}</span>{fmt.signed(value)}
    </span>
  )
}
