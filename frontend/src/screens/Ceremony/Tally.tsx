import type { PlayerIndex } from '@/data/instruments'
import type { ReportResult } from '@/data/types'
import type { CategoryInfo } from '@/domain/catalog'
import { cssVars } from '@/domain/cssVars'
import { CorpEmblem, CountUp, Cube } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import instruments from '@/ui/instruments/instruments.module.css'
import { ROW_H, tally } from './model'
import styles from './Ceremony.module.css'

interface TallyProps { results: ReportResult[]; cats: CategoryInfo[]; shown: number; players: PlayerIndex }

/** Conteo por categoría: las filas se reordenan a medida que cambian los totales. */
export function Tally({ results, cats, shown, players }: TallyProps) {
  const { rows, order, done } = tally(results, cats, shown)
  const top = Math.max(1, ...results.map((r) => r.total_points))
  const cur = cats[shown - 1]
  return (
    <div className={styles.tally} style={cssVars({ rows: rows.length })}>
      {rows.map((row) => {
        const rank = order.indexOf(row)
        const p = players.get(row.r.player_id)
        const add = cur ? Number(row.r.scores[cur.key as keyof ReportResult['scores']] ?? 0) : 0
        return (
          <div key={row.r.player_id} className={cx(styles.tally__row, done && rank === 0 && styles['is-win'])} style={cssVars({ y: `${rank * ROW_H}px` })}>
            <span className={styles.tally__rank}>{rank + 1}</span>
            <span className={styles.tally__who}><Cube color={p?.color} size={20} /><b>{p?.name}</b><CorpEmblem name={row.r.corporation} size="s" /></span>
            <span className={styles.tally__bar}>{row.parts.map(({ c, v }) => v > 0 && <i key={c.key} className={instruments[`catkey--${c.key}`]} style={cssVars({ w: (v / top) * 100 })} />)}</span>
            <span className={styles.tally__total}><CountUp value={row.total} duration={600} from={Math.max(0, row.total - add)} /></span>
            {cur && add > 0 && !done && <span className={styles.tally__plus} key={shown}>+{add}</span>}
          </div>
        )
      })}
    </div>
  )
}
