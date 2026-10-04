// La pista de TR del tablero: casilleros numerados (cada cinco, amarillo) con los cubos encima.
import { cssVars } from '@/domain/cssVars'
import { Cube } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import type { ResultRow } from './types'
import styles from './instruments.module.css'

/** Casilleros de la pista: de 6 por debajo del menor a 4 por encima del mayor, en múltiplos de 5. */
export function trSquares(totals: number[]) {
  if (!totals.length) return []
  const lo = Math.max(0, Math.floor((Math.min(...totals) - 6) / 5) * 5)
  const hi = Math.ceil((Math.max(...totals) + 4) / 5) * 5
  return Array.from({ length: hi - lo + 1 }, (_, k) => lo + k)
}

function Stack({ rows }: { rows: ResultRow[] }) {
  return (
    <span className={styles.trtrack__stack}>
      {rows.map((r, k) => (
        <span key={r.player.id} className={cx(styles.trtrack__cube, r.position === 1 && styles['is-win'])} style={cssVars({ k })}
          data-tip={`${r.player.name}: ${r.total}`}><Cube color={r.player.color} size={r.position === 1 ? 22 : 18} /></span>
      ))}
    </span>
  )
}

export function TRTrack({ results }: { results: ResultRow[] }) {
  const squares = trSquares(results.map((r) => r.total))
  const at = new Map<number, ResultRow[]>()
  results.forEach((r) => at.set(r.total, [...(at.get(r.total) ?? []), r]))
  return (
    <div className={styles.trtrack} style={cssVars({ n: squares.length })} role="img"
      aria-label={`Pista de puntaje: ${results.map((r) => `${r.player.name} ${r.total}`).join(', ')}`}>
      {squares.map((v) => (
        <span key={v} className={cx(styles.trtrack__sq, v % 5 === 0 && styles['is-five'], at.has(v) && styles['is-occupied'])}>
          {v % 5 === 0 && <b>{v}</b>}
          {at.has(v) && <Stack rows={at.get(v)!} />}
        </span>
      ))}
    </div>
  )
}
