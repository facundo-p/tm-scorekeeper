import type { PlayerIndex } from '@/data/instruments'
import type { GameSummary } from '@/data/types'
import { cssVars } from '@/domain/cssVars'
import { SORTS, type GameSort } from '@/domain/sort'
import { cx } from '@/ui/cx'
import reveal from '@/ui/reveal.module.css'
import { GameRow } from './GameRow'
import { gamesText, groupByMonth, monthTitle } from './model'
import styles from './Games.module.css'

/** Por fecha, la lista se agrupa por mes; en otros órdenes es una sola lista. */
export function GameList({ list, sort, players }: { list: GameSummary[]; sort: GameSort; players: PlayerIndex }) {
  if (sort.by !== 'date') {
    const label = SORTS.find((o) => o.id === sort.by)!.label
    return (
      <section className={cx(styles.month, reveal.reveal)} style={cssVars({ i: 2 })} aria-label={`Partidas ordenadas por ${label}`}>
        <ol className={styles.mlist}>{list.map((g) => <GameRow key={g.id} g={g} players={players} flat />)}</ol>
      </section>
    )
  }
  return groupByMonth(list).map((grp, gi) => {
    const { month, year } = monthTitle(grp.key)
    return (
      <section key={grp.key} className={cx(styles.month, reveal.reveal)} style={cssVars({ i: Math.min(gi + 2, 6) })} aria-label={`${month} ${year}`}>
        <h2 className={styles.month__title}><span>{month}</span> {year}<small>{gamesText(grp.games.length)}</small></h2>
        <ol className={styles.mlist}>{grp.games.map((g) => <GameRow key={g.id} g={g} players={players} />)}</ol>
      </section>
    )
  })
}
