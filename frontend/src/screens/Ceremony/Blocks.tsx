// Lo que aterriza después del conteo: ganador, ELO, récords y logros.
import type { RefObject } from 'react'
import type { PlayerIndex } from '@/data/instruments'
import type { GameReport } from '@/data/types'
import { corpLabel } from '@/domain/catalog'
import { cssVars } from '@/domain/cssVars'
import { fmt } from '@/domain/format'
import { CorpEmblem, CountUp, Cube, Medal } from '@/ui/atoms'
import delta from '@/ui/atoms/Delta.module.css'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import { unlocksOf, winSub } from '../GameReport/model'
import styles from './Ceremony.module.css'

interface BlockProps { report: GameReport; players: PlayerIndex }
const nameOf = (players: PlayerIndex, id: string) => players.get(id)?.name ?? id

export function WinnerBanner({ report, players, nameRef }: BlockProps & { nameRef: RefObject<HTMLHeadingElement> }) {
  const w = report.results[0]
  const p = players.get(w.player_id)
  return (
    <div className={styles['cer-win']}>
      <span className={styles['cer-win__kicker']}>Ganó la partida</span>
      <div className={styles['cer-win__row']}>
        <CorpEmblem name={w.corporation} size="l" />
        <h2 className={styles['cer-win__name']} ref={nameRef}><Cube color={p?.color} size={30} />{p?.name}</h2>
      </div>
      <p className={styles['cer-win__sub']}>{winSub(report, (id) => nameOf(players, id), `${corpLabel(w.corporation)}, ${w.total_points} puntos`).replace(' puntos sobre ', ' sobre ')}</p>
    </div>
  )
}

export function EloBlock({ report, players }: BlockProps) {
  return (
    <section className={styles['cer-block']} aria-label="Cambios de ELO">
      <h3 className={styles['cer-block__title']}><Icon name="ranking" size={18} />ELO</h3>
      <ul className={styles['cer-elo']}>
        {report.results.map((r) => {
          const c = report.elo.find((x) => x.player_id === r.player_id)
          if (!c) return null
          return (
            <li key={r.player_id}><Cube color={players.get(r.player_id)?.color} size={15} /><span>{nameOf(players, r.player_id)}</span>
              <b><CountUp value={c.elo_after} from={c.elo_before} duration={1100} /></b>
              <span className={cx(delta.delta, c.delta >= 0 ? delta['delta--up'] : delta['delta--down'])}>
                <span aria-hidden="true" className={delta.delta__glyph}>{c.delta >= 0 ? '▲' : '▼'}</span>{fmt.signed(c.delta)}</span></li>
          )
        })}
      </ul>
    </section>
  )
}

export function RecordsBlock({ report, players }: BlockProps) {
  const broken = report.records_broken
  return (
    <section className={styles['cer-block']} aria-label="Récords">
      <h3 className={styles['cer-block__title']}><Icon name="trophyNav" size={18} />Récords</h3>
      {broken.length === 0 ? <p className="faint">Ningún récord nuevo esta vez.</p> : (
        <ul className={styles['cer-recs']}>
          {broken.map((c, i) => (
            <li key={c.code} className={styles['cer-rec']} style={cssVars({ i })}>
              <span className={styles['cer-rec__band']}>Nuevo récord</span>
              <b>{c.title}</b>
              <span className={styles['cer-rec__val']}><Cube color={players.get(c.player_id)?.color} size={16} />{c.value}
                <small>antes {c.previous.value} ({nameOf(players, c.previous.player_id)})</small></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function AchBlock({ report, players, rank }: BlockProps & { rank: (id: string) => number }) {
  const list = unlocksOf(report, rank)
  return (
    <section className={styles['cer-block']} aria-label="Logros">
      <h3 className={styles['cer-block__title']}><Icon name="crown" size={18} />Logros</h3>
      {list.length === 0 ? <p className="faint">Nadie desbloqueó logros en esta partida.</p> : (
        <ul className={styles['cer-ach']}>
          {list.map((a, i) => (
            <li key={`${a.player_id}-${a.code}`} style={cssVars({ i })}><Medal glyph={a.glyph} tier={a.tier} size="m" single={a.max_tier === 1} />
              <span><b>{a.title}</b><small>{nameOf(players, a.player_id)}{a.max_tier > 1 ? `, nivel ${a.tier}` : ''}</small></span></li>
          ))}
        </ul>
      )}
    </section>
  )
}
