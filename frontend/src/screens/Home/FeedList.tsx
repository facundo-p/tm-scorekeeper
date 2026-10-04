import { useNavigate } from 'react-router-dom'
import type { FeedItem } from '@/data/types'
import type { PlayerIndex } from '@/data/instruments'
import { fmtDate } from '@/domain/format'
import { PATHS } from '@/shell/paths'
import { Cube, TagDisc } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { FEED_TAG } from './model'
import styles from './Home.module.css'

/** Lista de la bitácora: cada entrada lleva a su partida. */
export function FeedList({ items, players, compact }: { items: FeedItem[]; players: PlayerIndex; compact?: boolean }) {
  const navigate = useNavigate()
  return (
    <ol className={cx(styles.feed, compact && styles['feed--compact'])}>
      {items.map((f, i) => {
        const [icon, tone, kind] = FEED_TAG[f.type]
        const p = f.player_id ? players.get(f.player_id) : undefined
        return (
          <li key={i} className={styles.feed__item}>
            <TagDisc icon={icon} tone={tone} title={kind} />
            <button type="button" className={styles.feed__body} onClick={() => f.game_id && navigate(PATHS.game(f.game_id))}>
              <span className={styles.feed__text}>{p && <Cube color={p.color} size={13} />}{f.text}</span>
              <span className={styles.feed__date}>{fmtDate(f.date, { short: true, year: false })}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
