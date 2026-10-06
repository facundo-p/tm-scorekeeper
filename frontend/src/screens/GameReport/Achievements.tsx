// Récords rotos, casi récords y logros desbloqueados en la partida.
import type { PlayerIndex } from '@/data/instruments'
import type { GameReport, NearRecord } from '@/data/types'
import { RECORD_ICON } from '@/domain/catalog'
import { Cube, Medal, NewBadge, Plate, PlayerTag, SectionHead, TagDisc } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import reveal from '@/ui/reveal.module.css'
import { tierText, unlocksOf } from './model'
import styles from './GameReport.module.css'

function NearItem({ c, players }: { c: NearRecord; players: PlayerIndex }) {
  const p = players.get(c.player_id)
  const name = p?.name ?? c.player_id
  return (
    <li>
      <Cube color={p?.color} size={13} />
      <span>{c.gap === 0
        ? <>{name} <b>igualó</b> «{c.title}» ({c.value})</>
        : <>{name} quedó a <b>{c.gap}</b> de «{c.title}» ({c.value} contra {c.before})</>}</span>
    </li>
  )
}

export function RecordsInGame({ report, players }: { report: GameReport; players: PlayerIndex }) {
  const broken = report.records_broken
  return (
    <Plate className={cx(reveal.reveal, styles['report-records'])} label="Récords">
      <SectionHead title="Récords" />
      {broken.length === 0 && <p className="muted">Esta partida no rompió récords.</p>}
      <ul className={styles.recbroken}>
        {broken.map((c) => (
          <li key={c.code} className={styles.recbroken__item}>
            <TagDisc icon={RECORD_ICON[c.code] ?? 'trophy'} tone="blue" />
            <div><b>{c.title}</b><span className="muted">{c.description}</span></div>
            <span className={styles.recbroken__vals}><Cube color={players.get(c.player_id)?.color} size={14} />{c.value}
              <small>antes {c.previous.value}</small></span>
          </li>
        ))}
      </ul>
      {report.near.length > 0 && <>
        <h3 className={styles.near__title}>Cerca del récord <NewBadge /></h3>
        <ul className={styles.near}>{report.near.map((c) => <NearItem key={c.code} c={c} players={players} />)}</ul>
      </>}
    </Plate>
  )
}

export function AchievementsInGame({ report, players, rank }: { report: GameReport; players: PlayerIndex; rank: (id: string) => number }) {
  const unlocks = unlocksOf(report, rank)
  if (!unlocks.length) return null
  return (
    <Plate className={cx(reveal.reveal, styles['report-ach'])} label="Logros desbloqueados">
      <SectionHead title="Logros desbloqueados" />
      <ul className={styles.achgrid}>
        {unlocks.map((u) => (
          <li key={`${u.player_id}-${u.code}`} className={styles.achgrid__item}>
            <Medal glyph={u.glyph} tier={u.tier} size="m" single={u.max_tier === 1} />
            <div><b>{u.title}</b><span className="muted">{tierText(u)}</span><PlayerTag player={players.get(u.player_id)} size="s" /></div>
          </li>
        ))}
      </ul>
    </Plate>
  )
}
