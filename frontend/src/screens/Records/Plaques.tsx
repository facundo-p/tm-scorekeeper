import { useNavigate } from 'react-router-dom'
import type { PlayerIndex } from '@/data/instruments'
import type { GroupRecord } from '@/data/types'
import { mapInfo, RECORD_ICON } from '@/domain/catalog'
import { cssVars } from '@/domain/cssVars'
import { fmtDate } from '@/domain/format'
import { PATHS } from '@/shell/paths'
import { Button, Cube, NewBadge, PlayerTag, TagDisc } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { useTilt } from '@/ui/hooks/useTilt'
import { MapGlyph } from '@/ui/icons'
import reveal from '@/ui/reveal.module.css'
import { holdersBySignup, stepChart, unitOf, W } from './model'
import styles from './Records.module.css'

interface WithPlayers { players: PlayerIndex; t: (d: string) => number; rank: (playerId: string) => number }

/** Escalera de cómo creció el récord, con el cubo de quien lo tuvo en cada paso. */
function RecordHistory({ rec, players, t, height = 64 }: Omit<WithPlayers, 'rank'> & { rec: GroupRecord; height?: number }) {
  const chart = stepChart(rec.history, height, t)
  if (!chart) return null
  const name = (id: string) => players.get(id)?.name ?? id
  return (
    <div className={styles.rhist}>
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className={styles.rhist__svg} role="img"
        aria-label={`Historia: ${rec.history.map((e) => `${e.value} (${name(e.player_id)})`).join(', ')}`}>
        <path d={chart.d} className={styles.rhist__line} vectorEffect="non-scaling-stroke" />
      </svg>
      {chart.points.map(({ e, x, y }) => (
        <span key={`${e.game_id}-${e.player_id}`} className={styles.rhist__pt} style={cssVars({ x, y })}
          data-tip={`${e.value}: ${name(e.player_id)}, ${fmtDate(e.date, { short: true })}`}><Cube color={players.get(e.player_id)?.color} size={11} /></span>
      ))}
    </div>
  )
}

/** Quién lo tiene: en los de partida, cada uno con la partida donde lo alcanzó (D-05). */
function Holders({ rec, players, rank }: { rec: GroupRecord; players: PlayerIndex; rank: (playerId: string) => number }) {
  const navigate = useNavigate()
  if (!rec.holders.length) return <span className="faint">Sin datos todavía</span>
  if (rec.scope === 'career') return <span className={styles.plaque__holders}>{holdersBySignup(rec, rank).map((x) => <PlayerTag key={x.player_id} player={players.get(x.player_id)} />)}</span>
  return (
    <span className={styles.plaque__holders}>
      {rec.holders.map((x) => (
        <span key={`${x.player_id}-${x.game_id}`} className={styles.plaque__holder}><PlayerTag player={players.get(x.player_id)} />
          <button type="button" className={styles.plaque__game} onClick={() => navigate(PATHS.game(x.game_id!))}>
            <MapGlyph glyph={mapInfo(x.map ?? '').glyph} size={16} />{fmtDate(x.date!, { short: true })}</button></span>
      ))}
    </span>
  )
}

export function Plaque({ rec, i, players, t, rank }: WithPlayers & { rec: GroupRecord; i: number }) {
  const ref = useTilt<HTMLDivElement>(6, styles['is-tilting'])
  return (
    <li className={cx(styles['plaque-wrap'], reveal.reveal)} style={cssVars({ i: Math.min(i + 2, 8) })}>
      <div className={styles.plaque} ref={ref} data-sheen>
        <span className={styles.plaque__glare} aria-hidden="true" />
        <div className={styles.plaque__top}><TagDisc icon={RECORD_ICON[rec.code] ?? 'trophy'} tone="blue" /><span className={styles.plaque__title}>{rec.title}</span></div>
        <p className={styles.plaque__desc}>{rec.description}</p>
        <div className={styles.plaque__value}>{rec.value ?? '—'}<small>{unitOf(rec)}</small></div>
        <Holders rec={rec} players={players} rank={rank} />
        <RecordHistory rec={rec} players={players} t={t} />
      </div>
    </li>
  )
}

function Steps({ rec, players }: { rec: GroupRecord; players: PlayerIndex }) {
  return (
    <ol className={styles.monument__steps}>
      {rec.history.map((e) => (
        <li key={`${e.game_id}-${e.player_id}`}><Cube color={players.get(e.player_id)?.color} size={12} /><b>{e.value}</b>
          <span>{players.get(e.player_id)?.name}</span><small>{fmtDate(e.date, { short: true })}</small></li>
      ))}
    </ol>
  )
}

function MonumentBody({ rec, players }: { rec: GroupRecord; players: PlayerIndex }) {
  const navigate = useNavigate()
  const h = rec.holders[0]
  return (
    <div className={styles.monument__body}>
      <div className={styles.monument__value}>{rec.value}<small>puntos</small></div>
      <div className={styles.monument__holder}><PlayerTag player={players.get(h.player_id)} size="l" />
        <span className="muted">{h.date && fmtDate(h.date)}{h.map && ` en ${h.map}`}</span>
        {h.game_id && <Button size="s" onClick={() => navigate(PATHS.game(h.game_id!))}>Ver la partida</Button>}</div>
    </div>
  )
}

/** El récord mayor (mayor puntaje en una partida), en grande, con su historia completa. */
export function Monument({ rec, players, t }: Omit<WithPlayers, 'rank'> & { rec: GroupRecord }) {
  const ref = useTilt<HTMLDivElement>(4, styles['is-tilting'])
  return (
    <section className={cx(styles.monument, reveal.reveal)} style={cssVars({ i: 1 })} aria-labelledby="mon-title">
      <div className={styles.monument__plate} ref={ref} data-sheen>
        <span className={styles.plaque__glare} aria-hidden="true" />
        <div className={styles.monument__head}><TagDisc icon={RECORD_ICON[rec.code] ?? 'trophy'} tone="blue" size={16} /><h2 id="mon-title" className={styles.monument__title}>{rec.title}</h2></div>
        <p className={styles.monument__desc}>{rec.description}</p>
        <MonumentBody rec={rec} players={players} />
        <h3 className={styles.monument__h}>Cómo llegó hasta acá <NewBadge /></h3>
        <RecordHistory rec={rec} players={players} t={t} height={110} />
        <Steps rec={rec} players={players} />
      </div>
    </section>
  )
}
