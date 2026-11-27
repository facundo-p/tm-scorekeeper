// Hitos y recompensas como en el tablero: casilleros con quién los reclamó o financió.
import type { PlayerIndex } from '@/data/instruments'
import type { AwardResult, GameReport } from '@/data/types'
import { awardLabel, milestoneLabel } from '@/domain/labels'
import { Cube, Plate } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import reveal from '@/ui/reveal.module.css'
import { awardSlots, isStolen, milestoneSlots } from './model'
import styles from './GameReport.module.css'

const nameOf = (players: PlayerIndex, id: string) => players.get(id)?.name ?? id

function Cubes({ ids, players }: { ids: string[]; players: PlayerIndex }) {
  return ids.map((id) => <Cube key={id} color={players.get(id)?.color} size={16} label={nameOf(players, id)} />)
}

function Milestones({ report, players }: { report: GameReport; players: PlayerIndex }) {
  return (
    <div className={styles['board-row']}>
      <h3 className={styles['board-row__title']}><Icon name="milestone" size={18} />Hitos <span>3 como máximo, 5 PV cada uno</span></h3>
      <ul className={styles.slots}>
        {milestoneSlots(report).map(({ name, owner }) => (
          <li key={name} className={cx(styles.slot, owner && styles['is-claimed'])}>
            <span className={styles.slot__name}>{milestoneLabel(name)}</span>
            {owner
              ? <span className={styles.slot__who}><Cube color={players.get(owner)?.color} size={18} label={nameOf(players, owner)} /><span>{nameOf(players, owner)}</span></span>
              : <span className={styles.slot__empty}>Sin reclamar</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Funded({ a, players }: { a: AwardResult; players: PlayerIndex }) {
  return (
    <>
      <span className={styles.slot__podium}>
        <span className={styles.slot__place}><b>1.º</b><Cubes ids={a.first_place} players={players} /></span>
        {a.second_place.length > 0 && <span className={styles.slot__place}><b>2.º</b><Cubes ids={a.second_place} players={players} /></span>}
      </span>
      <span className={styles.slot__funder}>Financió {nameOf(players, a.opened_by)}{isStolen(a) && <> <em className={styles.slot__stolen}>robada</em></>}</span>
    </>
  )
}

function Awards({ report, players }: { report: GameReport; players: PlayerIndex }) {
  return (
    <div className={styles['board-row']}>
      <h3 className={styles['board-row__title']}><Icon name="award" size={18} />Recompensas <span>5 PV al 1.º, 2 PV al 2.º</span></h3>
      <ul className={styles.slots}>
        {awardSlots(report).map(({ name, award }) => (
          <li key={name} className={cx(styles.slot, styles['slot--award'], award && styles['is-claimed'])}>
            <span className={styles.slot__name}>{awardLabel(name)}</span>
            {award ? <Funded a={award} players={players} /> : <span className={styles.slot__empty}>No financiada</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Board({ report, players }: { report: GameReport; players: PlayerIndex }) {
  return (
    <Plate className={cx(reveal.reveal, styles['report-board'])} label="Hitos y recompensas">
      <Milestones report={report} players={players} />
      <Awards report={report} players={players} />
    </Plate>
  )
}
