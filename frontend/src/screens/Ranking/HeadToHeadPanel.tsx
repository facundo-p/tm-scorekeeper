import type { HeadToHead, RankingRow } from '@/data/types'
import { cssVars } from '@/domain/cssVars'
import { Cube, NewBadge, Plate, SectionHead } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { H2HMatrix } from '@/ui/instruments'
import reveal from '@/ui/reveal.module.css'
import { asPlayer, rivalries, type Rivalry } from './model'
import styles from './Ranking.module.css'

type Lookup = (id: string) => RankingRow | undefined

function Side({ p, b }: { p?: RankingRow; b?: boolean }) {
  const cube = <Cube color={p?.color} size={18} />
  return <span className={cx(styles.rivals__side, b && styles['rivals__side--b'])}>{!b && cube}<b>{p?.name}</b>{b && cube}</span>
}

function RivalItem({ r, get }: { r: Rivalry; get: Lookup }) {
  return (
    <li className={styles.rivals__item}>
      <Side p={get(r.a)} />
      <span className={styles.rivals__score}><b>{r.ahead}</b><i>{r.games} partidas juntos</i><b>{r.behind}</b></span>
      <Side p={get(r.b)} b />
      <span className={styles.rivals__bar} style={cssVars({ a: ((r.ahead / r.games) * 100).toFixed(1) })} aria-hidden="true" />
    </li>
  )
}

/** Cara a cara: matriz de partidas por delante y las rivalidades con más partidas. */
export function HeadToHeadPanel({ rows, h2h }: { rows: RankingRow[]; h2h: HeadToHead }) {
  const get: Lookup = (id) => rows.find((r) => r.player_id === id)
  const pairs = rivalries(rows.map((r) => r.player_id), h2h.matrix)
  return (
    <Plate className={reveal.reveal} label="Cara a cara">
      <SectionHead title="Cara a cara"><NewBadge /></SectionHead>
      <p className={cx('muted', styles['h2h-panel__lede'])}>Qué porcentaje de las partidas compartidas terminó cada jugador (fila) por delante del otro (columna).</p>
      <div className={styles['h2h-panel__body']}>
        <H2HMatrix players={rows.map(asPlayer)} matrix={h2h.matrix} />
        <div>
          <h3 className={styles['h2h-panel__h']}>Rivalidades con más partidas</h3>
          <ul className={styles.rivals}>{pairs.map((r) => <RivalItem key={`${r.a}-${r.b}`} r={r} get={get} />)}</ul>
          <p className={styles['h2h-legend']}><span className={styles['h2h-legend__a']} />Va adelante<span className={styles['h2h-legend__b']} />Va atrás</p>
        </div>
      </div>
    </Plate>
  )
}
