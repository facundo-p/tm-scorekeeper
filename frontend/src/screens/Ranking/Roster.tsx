import { useState } from 'react'
import { bySignup } from '@/data/instruments'
import type { PlayerSummary } from '@/data/types'
import { Button, Chip, Cube, Plate, SectionHead } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import reveal from '@/ui/reveal.module.css'
import { inactiveNote } from './model'
import { PlayerSheet } from './PlayerSheet'
import styles from './Ranking.module.css'

function RosterItem({ p, onEdit }: { p: PlayerSummary; onEdit: () => void }) {
  return (
    <li className={cx(styles.roster__item, !p.is_active && styles['is-off'])}>
      <Cube color={p.color} size={18} />
      <span className={styles.roster__name}>{p.name}</span>
      <span className={styles.roster__since}>{p.since && `desde ${p.since.slice(0, 7)}`}</span>
      {!p.is_active && <Chip>Inactivo</Chip>}
      <Button variant="ghost" size="s" icon="edit" label={`Editar a ${p.name}`} onClick={onEdit} />
    </li>
  )
}

/** Plantel en orden de alta (D-74), con alta y edición en una hoja. */
export function Roster({ players, onAdd }: { players: PlayerSummary[]; onAdd: () => void }) {
  const [edit, setEdit] = useState<PlayerSummary | null>(null)
  const inactive = players.filter((p) => !p.is_active).length
  return (
    <Plate className={reveal.reveal} label="Jugadores">
      <SectionHead title="Jugadores"><Button size="s" icon="plus" onClick={onAdd}>Agregar jugador</Button></SectionHead>
      <ul className={styles.roster__list}>{bySignup(players).map((p) => <RosterItem key={p.player_id} p={p} onEdit={() => setEdit(p)} />)}</ul>
      {inactive > 0 && <p className={cx('faint', styles.roster__note)}>{inactiveNote(inactive)}</p>}
      {edit && <PlayerSheet player={edit} players={players} onClose={() => setEdit(null)} />}
    </Plate>
  )
}
