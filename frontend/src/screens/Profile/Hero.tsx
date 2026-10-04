import { useNavigate } from 'react-router-dom'
import type { PlayerInsights, PlayerSummary } from '@/data/types'
import { cssVars } from '@/domain/cssVars'
import { fmt, fmtDate } from '@/domain/format'
import { awardLabel, milestoneLabel } from '@/domain/labels'
import { PATHS } from '@/shell/paths'
import { Button, CorpEmblem, CountUp, Delta, NewBadge, Readout } from '@/ui/atoms'
import plate from '@/ui/atoms/Plate.module.css'
import { cx } from '@/ui/cx'
import { useTilt } from '@/ui/hooks/useTilt'
import reveal from '@/ui/reveal.module.css'
import { timesText } from './model'
import styles from './Profile.module.css'

const FACES = ['front', 'back', 'right', 'left', 'top', 'bottom']

/** Cubo traslúcido del color del jugador, que gira y se inclina con el puntero. */
function Cube3D({ color }: { color: string }) {
  const ref = useTilt<HTMLDivElement>(22, styles['is-tilting'])
  return (
    <div className={cx(styles.cube3d, styles[`cube3d--${color}`])} ref={ref} aria-hidden="true">
      <div className={styles.cube3d__spin}><div className={styles.cube3d__body}>
        {FACES.map((f) => <i key={f} className={cx(styles.cube3d__f, styles[`cube3d__f--${f}`])} />)}
      </div></div>
      <span className={styles.cube3d__shadow} />
    </div>
  )
}

function Pick({ fav, label, none, avg }: { fav: PlayerInsights['favorites']['milestone']; label: (k: string) => string; none: string; avg: number }) {
  return (
    <dd>
      {fav ? <><b>{fav.names.map(label).join(', ')}</b><small>{timesText(fav.count)}</small></> : <span className="faint">{none}</span>}
      <small>{fmt.dec(avg)} por partida</small>
    </dd>
  )
}

/** Hito más reclamado y recompensa más ganada (#35, #66), con sus promedios por partida (#38). */
function Favorites({ p }: { p: PlayerInsights }) {
  return (
    <dl className={styles.phero__picks}>
      <div><dt className="faint">Hito más reclamado</dt>
        <Pick fav={p.favorites.milestone} label={milestoneLabel} none="Todavía no reclamó ningún hito." avg={p.avg_milestones} /></div>
      <div><dt className="faint">Recompensa más ganada</dt>
        <Pick fav={p.favorites.award} label={awardLabel} none="Todavía no ganó ninguna recompensa." avg={p.avg_awards} /></div>
    </dl>
  )
}

function Stats({ p, mesa }: { p: PlayerInsights; mesa: number | null }) {
  const fav = p.corps[0]
  return (
    <div className={cx(styles.phero__stats, plate.plate, plate['plate--glass'])} data-sheen>
      <div className={styles.phero__elo}>
        <span className={styles['phero__elo-label']}>{mesa ? `ELO de mesa ${mesa}` : 'ELO'}</span>
        <span className={styles['phero__elo-value']}><CountUp value={p.elo} from={1000} duration={1200} /></span>
        <span className={styles['phero__elo-meta']}>{p.rank ? <><b>#{p.rank}</b> de {p.rank_total}</> : 'Sin ranking'}<Delta value={p.last_delta} size="s" /></span>
      </div>
      <div className={styles.phero__grid}>
        <Readout display label="Pico" value={p.peak ?? '—'} /><Readout display label="Partidas" value={p.games} />
        <Readout display label="Victorias" value={p.wins} sub={fmt.pct(p.win_rate)} /><Readout display label="Promedio" value={p.avg_points} sub="puntos" />
        <Readout display label="Mejor" value={p.best} sub="puntos" accent /><Readout display label="Posición media" value={fmt.dec(p.avg_pos)} />
      </div>
      {fav && <div className={styles.phero__fav}><span className="faint">Corporación favorita</span>
        <CorpEmblem name={fav.name} withName /><span className="faint">{fav.games} partidas, {fav.wins} victorias</span></div>}
      <Favorites p={p} />
    </div>
  )
}

/** Expediente del jugador: cubo, nombre, arquetipo, alta y el tablero de números. */
export function Hero({ p, player, mesa }: { p: PlayerInsights; player: PlayerSummary; mesa: number | null }) {
  const navigate = useNavigate()
  return (
    <section className={cx(styles.phero, reveal.reveal)} style={cssVars({ i: 0 })} aria-labelledby="phero-name">
      <div className={styles.phero__token}><Cube3D color={player.color} /></div>
      <div className={styles.phero__id}>
        <Button variant="ghost" size="s" icon="back" onClick={() => navigate(PATHS.ranking)}>Ranking</Button>
        <span className={styles.phero__tab}>Expediente</span>
        <h1 className={styles.phero__name} id="phero-name">{player.name}</h1>
        {p.archetype && <p className={styles.phero__arch}><b>{p.archetype.name}.</b> {p.archetype.desc} <NewBadge>Arquetipo</NewBadge></p>}
        {player.since && <p className={cx(styles.phero__since, 'faint')}>Juega desde {fmtDate(player.since)}{!player.is_active ? ' (inactivo)' : ''}</p>}
      </div>
      <Stats p={p} mesa={mesa} />
    </section>
  )
}
