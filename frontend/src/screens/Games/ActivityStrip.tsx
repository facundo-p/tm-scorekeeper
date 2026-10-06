import { useMemo } from 'react'
import type { GameSummary } from '@/data/types'
import { cssVars } from '@/domain/cssVars'
import { NewBadge } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { activityWeeks, gamesText } from './model'
import styles from './Games.module.css'

/** Las últimas 52 semanas como una tira de hexágonos, más brillantes donde se jugó más. */
export function ActivityStrip({ games, last }: { games: GameSummary[]; last: string }) {
  const weeks = useMemo(() => activityWeeks(games, last), [games, last])
  const total = weeks.reduce((s, w) => s + w.n, 0)
  return (
    <div className={styles.activity} role="img" aria-label={`${total} partidas en las últimas 52 semanas`}>
      <span className={styles.activity__label}>Últimas 52 semanas <NewBadge /></span>
      <div className={styles.activity__strip}>
        {weeks.map((w, i) => (
          <i key={w.from} className={cx(styles.activity__wk, w.n > 0 && styles[`is-${Math.min(2, w.n)}`])} style={cssVars({ i })}
            data-tip={`Semana del ${w.from}: ${gamesText(w.n)}`} />
        ))}
      </div>
    </div>
  )
}
