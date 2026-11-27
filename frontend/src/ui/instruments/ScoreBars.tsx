// Barras apiladas por categoría (con vista de tabla) y su leyenda.
import { CATEGORIES } from '@/domain/catalog'
import type { CategoryInfo } from '@/domain/catalog'
import { cssVars } from '@/domain/cssVars'
import { Cube } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import type { ResultRow, ScoredGame, ScoreKey } from './types'
import { TableWrap } from './TableWrap'
import styles from './instruments.module.css'

export const catClass = (key: string) => cx(styles.catkey, styles[`catkey--${key}`])
const scoreOf = (r: ResultRow, key: string) => r.scores[key as ScoreKey] ?? 0

/** Categorías de una partida: Turmoil solo si se jugó con esa expansión. */
export const categoriesOf = (expansions: string[]) =>
  CATEGORIES.filter((c) => c.key !== 'turmoil_points' || expansions.includes('Turmoil'))

export function CategoryLegend({ categories = CATEGORIES }: { categories?: CategoryInfo[] }) {
  return (
    <ul className={styles.catlegend} aria-label="Categorías de puntaje">
      {categories.map((c) => <li key={c.key}><span className={catClass(c.key)} aria-hidden="true" />{c.label}</li>)}
    </ul>
  )
}

function ScoreTable({ results, cats }: { results: ResultRow[]; cats: CategoryInfo[] }) {
  return (
    <TableWrap>
      <table className={styles.dtable}>
        <thead><tr><th>Jugador</th>{cats.map((c) => <th key={c.key} className={styles.n}>{c.label}</th>)}<th className={styles.n}>Total</th><th className={styles.n}>M€</th></tr></thead>
        <tbody>{results.map((r) => (
          <tr key={r.player.id}>
            <td>{r.position}. {r.player.name}</td>
            {cats.map((c) => <td key={c.key} className={styles.n}>{scoreOf(r, c.key)}</td>)}
            <td className={styles.n}><b>{r.total}</b></td><td className={styles.n}>{r.mc}</td>
          </tr>
        ))}</tbody>
      </table>
    </TableWrap>
  )
}

function BarRow({ r, row, top, cats }: { r: ResultRow; row: number; top: number; cats: CategoryInfo[] }) {
  return (
    <div className={cx(styles.sbars__row, r.position === 1 && styles['is-win'])} style={cssVars({ row })}>
      <span className={styles.sbars__pos}><span className="vh">Posición </span>{r.position}</span>
      <span className={styles.sbars__who}><Cube color={r.player.color} size={15} /><span>{r.player.name}</span></span>
      <div className={styles.sbars__track} style={cssVars({ w: ((r.total / top) * 100).toFixed(2) })}>
        {cats.map((c) => {
          const v = scoreOf(r, c.key)
          return v ? (
            <span key={c.key} className={cx(styles.sbars__seg, styles[`catkey--${c.key}`])} style={cssVars({ v })}
              data-tip={`${c.long}: ${v}`} tabIndex={0} role="img" aria-label={`${c.long} ${v}`} />
          ) : null
        })}
      </div>
      <span className={styles.sbars__total}>{r.total}</span>
    </div>
  )
}

interface ScoreBarsProps { game: ScoredGame; maxTotal?: number; showTable?: boolean }

/** Puntaje por categoría de cada jugador; `showTable` muestra los mismos datos como tabla. */
export function ScoreBars({ game, maxTotal, showTable }: ScoreBarsProps) {
  const cats = categoriesOf(game.expansions)
  if (showTable) return <ScoreTable results={game.results} cats={cats} />
  const top = maxTotal ?? Math.max(1, ...game.results.map((r) => r.total))
  return <div className={styles.sbars}>{game.results.map((r, row) => <BarRow key={r.player.id} r={r} row={row} top={top} cats={cats} />)}</div>
}
