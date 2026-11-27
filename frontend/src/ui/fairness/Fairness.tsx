// Lecturas de equidad (owner's points 6 y 7): victorias contra lo que predice el tamaño de mesa,
// posición relativa y el desglose por tamaño de mesa. Port de docs/redesign/mockup/js/ui/fairness.js.
import type { ReactNode } from 'react'
import type { Equity, TableSizeStat } from '@/data/types'
import { fmt, MINUS } from '@/domain/format'
import { Plate, SectionHead } from '@/ui/atoms'
import delta from '@/ui/atoms/Delta.module.css'
import { cx } from '@/ui/cx'
import reveal from '@/ui/reveal.module.css'
import styles from './Fairness.module.css'

export const TIPS = {
  expected: 'Victorias vs. esperado: victorias menos las que tocarían por azar (1/n en cada mesa de n jugadores). El porcentaje es victorias ÷ esperado.',
  relPos: 'Posición relativa: 100 % es salir siempre primero y 0 % siempre último, sin importar el tamaño de la mesa.',
}

/** «+1,3», «−0,4» o «±0,0». */
export const signedDec = (x: number) => `${x > 0 ? '+' : x < 0 ? MINUS : '±'}${fmt.dec(Math.abs(x))}`

/** Tono de «vs. esperado»: arriba o abajo desde 0,05 victorias de diferencia. */
export const expectedTone = (x: number) => (x >= 0.05 ? 'up' : x <= -0.05 ? 'down' : 'flat')

const Dash = () => <span className="faint">—</span>

export function InfoTip({ text }: { text: string }) {
  return <button type="button" className={styles.infotip} data-tip={text} aria-label={text}>?</button>
}

export function VsExpected({ e }: { e: Equity }) {
  if (e.wins_ratio == null) return <Dash />
  return (
    <span className={cx(styles.vsexp, delta[`delta--${expectedTone(e.wins_vs_expected)}`])}>
      <b>{signedDec(e.wins_vs_expected)}</b><small>{fmt.pct(e.wins_ratio)}</small>
    </span>
  )
}

export const RelPos = ({ e }: { e: Equity }) => (e.rel_pos == null ? <Dash /> : <b>{fmt.pct(e.rel_pos)}</b>)

function ByTableRow({ r }: { r: TableSizeStat }) {
  return (
    <tr className={cx(!r.games && styles['is-empty'])}>
      <th scope="row">{r.n} jugadores</th><td className={styles.n}>{r.games}</td><td className={styles.n}>{r.wins}</td>
      <td className={styles.n}><VsExpected e={r} /></td><td className={styles.n}>{r.avg_points ?? '—'}</td><td className={styles.n}><RelPos e={r} /></td>
    </tr>
  )
}

interface ByTableProps { name: string; rows: TableSizeStat[]; mesa: number | null; className?: string; children?: ReactNode }

/** Rendimiento de un jugador por cantidad de jugadores (con filtro de mesa, solo esa fila). */
export function ByTablePanel({ name, rows, mesa, className, children }: ByTableProps) {
  const shown = rows.filter((r) => !mesa || r.n === mesa)
  return (
    <Plate className={cx(reveal.reveal, className)} label="Por tamaño de mesa">
      <SectionHead title="Por tamaño de mesa">{children}</SectionHead>
      <div className={styles.bytable__wrap} tabIndex={0} role="region" aria-label={`Tabla por tamaño de mesa de ${name}`}>
        <table className={styles.bytable__t}>
          <caption className="vh">Rendimiento de {name} por cantidad de jugadores</caption>
          <thead><tr><th scope="col">Mesa</th><th scope="col" className={styles.n}>Partidas</th><th scope="col" className={styles.n}>Victorias</th>
            <th scope="col" className={styles.n}>Vs. esperado <InfoTip text={TIPS.expected} /></th><th scope="col" className={styles.n}>Promedio</th>
            <th scope="col" className={styles.n}>Posición relativa <InfoTip text={TIPS.relPos} /></th></tr></thead>
          <tbody>{shown.map((r) => <ByTableRow key={r.n} r={r} />)}</tbody>
        </table>
      </div>
    </Plate>
  )
}
