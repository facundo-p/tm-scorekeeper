// Cambio de ELO de una partida: barras divergentes desde el centro.
import { cssVars } from '@/domain/cssVars'
import { fmt } from '@/domain/format'
import { Cube } from '@/ui/atoms'
import deltaStyles from '@/ui/atoms/Delta.module.css'
import { cx } from '@/ui/cx'
import type { EloShiftRow } from './types'
import styles from './instruments.module.css'

const tone = (d: number) => (d > 0 ? 'up' : d < 0 ? 'down' : 'flat')
const ARROW = { up: '▲', down: '▼', flat: '■' }

function Row({ c, max }: { c: EloShiftRow; max: number }) {
  const t = tone(c.delta)
  return (
    <li className={styles.eloshift__row}>
      <span className={styles.eloshift__who}><Cube color={c.player.color} size={14} />{c.player.name}</span>
      <span className={styles.eloshift__pair}>{c.before}<span aria-hidden="true">→</span><b>{c.after}</b></span>
      <span className={styles.eloshift__bar} aria-hidden="true">
        <i className={c.delta >= 0 ? styles['is-up'] : styles['is-down']} style={cssVars({ w: ((Math.abs(c.delta) / max) * 50).toFixed(1) })} />
      </span>
      <span className={cx(styles.eloshift__delta, deltaStyles[`delta--${t}`])}>
        <span aria-hidden="true">{ARROW[t]}</span>{fmt.signed(c.delta)}
      </span>
    </li>
  )
}

/** Filas en el orden de la partida; la barra más larga es el mayor cambio (mínimo 20). */
export function EloShift({ changes }: { changes: EloShiftRow[] }) {
  const max = Math.max(20, ...changes.map((c) => Math.abs(c.delta)))
  return <ul className={styles.eloshift}>{changes.map((c) => <Row key={c.player.id} c={c} max={max} />)}</ul>
}
