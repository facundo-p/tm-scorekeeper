// Marcador provisorio de los pasos de puntos: como el conteo de la ceremonia, pero mientras se carga.
// Muestra el cubo, el nombre y la corporación de cada uno (así se sabe de quién es cada cubo) y se
// reordena por puntos a medida que se suman categorías.
import type { PlayerIndex } from '@/data/instruments'
import { cssVars } from '@/domain/cssVars'
import { CorpEmblem, Cube } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import instruments from '@/ui/instruments/instruments.module.css'
import { scoreboard, type BoardRow, type WizardState } from './model'
import styles from './Register.module.css'

interface RowProps { row: BoardRow; rank: number; scale: number; plus: boolean; corp: string; players: PlayerIndex }

function Row({ row, rank, scale, plus, corp, players }: RowProps) {
  const p = players.get(row.id)
  return (
    <li className={cx(styles.marcador__row, rank === 0 && row.total > 0 && styles['is-lead'])} style={cssVars({ rank })}>
      <span className={styles.marcador__rank}>{rank + 1}<span className="vh">.º</span></span>
      <span className={styles.marcador__who}><Cube color={p?.color} size={18} /><b>{p?.name}</b>{corp && <CorpEmblem name={corp} size="s" />}</span>
      <span className={styles.marcador__bar} aria-hidden="true">
        {row.parts.map(({ key, v }) => v > 0 && <i key={key} className={instruments[`catkey--${key}`]} style={cssVars({ w: (v / scale) * 100 })} />)}
      </span>
      <span className={styles.marcador__total}>{row.total}<span className="vh"> puntos</span></span>
      {plus && row.add > 0 && <span className={styles.marcador__plus} key={`${row.parts.length}-${row.add}`}>+{row.add}</span>}
    </li>
  )
}

/** Suma las categorías `cats` (las de los pasos hechos y la del actual); `+N` es lo que suma el paso actual. */
export function Scoreboard({ s, cats, players }: { s: WizardState; cats: string[]; players: PlayerIndex }) {
  const { rows, order, scale } = scoreboard(s, cats)
  const corp = (id: string) => s.players.find((p) => p.id === id)?.corp ?? ''
  return (
    <section className={styles.marcador} aria-label="Marcador provisorio">
      <p className={styles.marcador__head}>Marcador provisorio <span>{cats.length === 1 ? '1 categoría sumada' : `${cats.length} categorías sumadas`}</span></p>
      <ul className={styles.marcador__rows} style={cssVars({ rows: rows.length })}>
        {rows.map((row) => <Row key={row.id} row={row} rank={order.indexOf(row)} scale={scale} plus={cats.length > 1} corp={corp(row.id)} players={players} />)}
      </ul>
    </section>
  )
}
