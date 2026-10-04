// Matriz cara a cara: color divergente (océano = delante, óxido = detrás).
import { cssVars } from '@/domain/cssVars'
import { Cube, type PlayerLike } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import type { H2HMatrixData } from './types'
import styles from './instruments.module.css'

/** Celda de `a` contra `b`: tasa de partidas por delante, tono e intensidad; null con menos de 2 partidas. */
export function h2hCell(matrix: H2HMatrixData, a: string, b: string) {
  const c = matrix[a]?.[b]
  if (!c || c.games < 2) return null
  const rate = c.ahead / c.games
  return { ...c, rate, tone: rate >= 0.5 ? 'a' : 'b', strength: Math.min(1, Math.abs(rate - 0.5) * 2.2) }
}

function Cell({ a, b, matrix }: { a: PlayerLike; b: PlayerLike; matrix: H2HMatrixData }) {
  if (a.id === b.id) return <td className={styles.h2h__self} aria-hidden="true" />
  const c = h2hCell(matrix, a.id, b.id)
  if (!c) return <td className={styles.h2h__na}><span className="vh">Sin datos</span></td>
  return (
    <td className={cx(styles.h2h__cell, styles[`h2h__cell--${c.tone}`])} style={cssVars({ s: c.strength.toFixed(2) })}
      data-tip={`${a.name} terminó delante de ${b.name} en ${c.ahead} de ${c.games}`} tabIndex={0}>
      {Math.round(c.rate * 100)}
    </td>
  )
}

export function H2HMatrix({ players, matrix }: { players: PlayerLike[]; matrix: H2HMatrixData }) {
  return (
    <div className={styles['h2h-wrap']} tabIndex={0} role="region" aria-label="Matriz cara a cara (se desplaza horizontalmente)">
      <table className={styles.h2h}>
        <caption className="vh">Porcentaje de partidas en que el jugador de la fila terminó por delante del de la columna</caption>
        <thead><tr><th />{players.map((p) => (
          <th key={p.id} scope="col"><span className={styles.h2h__col}><Cube color={p.color} size={13} />{p.name}</span></th>
        ))}</tr></thead>
        <tbody>{players.map((a) => (
          <tr key={a.id}>
            <th scope="row"><span className={styles.h2h__row}><Cube color={a.color} size={13} />{a.name}</span></th>
            {players.map((b) => <Cell key={b.id} a={a} b={b} matrix={matrix} />)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
