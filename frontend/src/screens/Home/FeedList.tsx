import { useNavigate } from 'react-router-dom'
import type { FeedItem } from '@/data/types'
import type { PlayerIndex } from '@/data/instruments'
import { fmtDate } from '@/domain/format'
import { PATHS } from '@/shell/paths'
import { Cube, TagDisc } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { FEED_TAG } from './model'
import styles from './Home.module.css'

const keyOf = (f: FeedItem) => [f.date, f.type, f.game_id, f.player_id, f.code, f.level].join('-')

/** Una entrada: lleva a su partida si tiene una (un cierre de temporada no). */
function FeedEntry({ f, players }: { f: FeedItem; players: PlayerIndex }) {
  const navigate = useNavigate()
  const [icon, tone, kind] = FEED_TAG[f.type]
  const p = f.player_id ? players.get(f.player_id) : undefined
  const body = <>
    <span className={styles.feed__text}>{p && <Cube color={p.color} size={13} />}{f.text}</span>
    <span className={styles.feed__date}>{fmtDate(f.date, { short: true, year: false })}</span>
  </>
  const gameId = f.game_id
  return (
    <li className={styles.feed__item}>
      <TagDisc icon={icon} tone={tone} title={kind} />
      {gameId
        ? <button type="button" className={styles.feed__body} onClick={() => navigate(PATHS.game(gameId))}>{body}</button>
        : <span className={styles.feed__body}>{body}</span>}
    </li>
  )
}

/** Lista de la bitácora. */
export function FeedList({ items, players, compact }: { items: FeedItem[]; players: PlayerIndex; compact?: boolean }) {
  if (!items.length) return <p className="muted">Todavía no hay novedades en el archivo.</p>
  return (
    <ol className={cx(styles.feed, compact && styles['feed--compact'])}>
      {items.map((f) => <FeedEntry key={keyOf(f)} f={f} players={players} />)}
    </ol>
  )
}
