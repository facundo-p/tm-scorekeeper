import { Link } from 'react-router-dom'
import type { RankingRow } from '@/data/types'
import { cssVars } from '@/domain/cssVars'
import { fmt } from '@/domain/format'
import { PATHS } from '@/shell/paths'
import { Cube, Delta, Plate, SectionHead } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { InfoTip, RelPos, TIPS, VsExpected } from '@/ui/fairness'
import { FormStrip, Sparkline } from '@/ui/instruments'
import reveal from '@/ui/reveal.module.css'
import { eloLabel } from './model'
import styles from './Ranking.module.css'

const x = (n?: boolean) => cx(styles.lb__x, n && styles.n)

function Head({ mesa }: { mesa: number | null }) {
  return (
    <div className={styles.lb__head} role="row">
      <span role="columnheader">#</span><span role="columnheader">Jugador</span><span role="columnheader" className={styles.n}>{eloLabel(mesa)}</span>
      <span role="columnheader" className={x()}>Pico</span><span role="columnheader" className={x(true)}>Partidas</span>
      <span role="columnheader" className={x(true)}>Victorias</span>
      <span role="columnheader" className={x(true)}>Vs. esperado<InfoTip text={TIPS.expected} /></span>
      <span role="columnheader" className={x(true)}>Pos. relativa<InfoTip text={TIPS.relPos} /></span>
      <span role="columnheader" className={x()}>Forma</span><span role="columnheader" className={x()}>Últimos 12</span>
    </div>
  )
}

function Row({ p, i, mesa }: { p: RankingRow; i: number; mesa: number | null }) {
  const top = p.rank <= 3
  return (
    <Link to={{ pathname: PATHS.profile(p.player_id), search: mesa ? `?mesa=${mesa}` : '' }} role="row"
      className={cx(styles.lb__row, top && styles['is-top'], top && styles[`is-top-${p.rank}`])} style={cssVars({ i })}>
      <span role="cell" className={styles.lb__rank}>{p.rank}</span>
      <span role="cell" className={styles.lb__who}><Cube color={p.color} size={top ? 20 : 16} /><span><b>{p.name}</b><small>{p.archetype}</small></span></span>
      <span role="cell" className={styles.lb__elo}><b>{p.elo}</b><Delta value={p.last_delta} size="s" /></span>
      <span role="cell" className={cx(styles.lb__x, styles.lb__peak)}>{p.peak}</span>
      <span role="cell" className={x(true)}>{p.games}</span>
      <span role="cell" className={x(true)}>{fmt.pct(p.win_rate)}</span>
      <span role="cell" className={x(true)}><VsExpected e={p.equity} /></span>
      <span role="cell" className={x(true)}><RelPos e={p.equity} /></span>
      <span role="cell" className={x()}><FormStrip form={p.form} /></span>
      <span role="cell" className={x()}><Sparkline values={p.elo_series.slice(-12).map((s) => s.elo)} width={88} height={24} /></span>
    </Link>
  )
}

/** Clasificación por ELO (o ELO de mesa); cada fila lleva al perfil, con la mesa si hay filtro. */
export function Leaderboard({ rows, mesa }: { rows: RankingRow[]; mesa: number | null }) {
  return (
    <Plate className={reveal.reveal} label="Clasificación">
      <SectionHead title="Clasificación"><span>{rows.length} jugadores activos</span></SectionHead>
      <div className={styles.lb} role="table" aria-label={`Clasificación por ${eloLabel(mesa)}`}>
        <Head mesa={mesa} />
        {rows.map((p, i) => <Row key={p.player_id} p={p} i={i} mesa={mesa} />)}
      </div>
    </Plate>
  )
}
