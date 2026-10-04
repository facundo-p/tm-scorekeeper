// Paso 3: hitos (3 como máximo) y recompensas financiadas (3 como máximo) con su podio.
import type { PlayerIndex } from '@/data/instruments'
import { EXPANSION_AWARDS, EXPANSION_MILESTONES, mapInfo } from '@/domain/catalog'
import { awardLabel, milestoneLabel } from '@/domain/labels'
import { Cube, Switch } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import { MAX_AWARDS, MAX_MILESTONES, type WizardAward } from './model'
import type { StepProps } from './types'
// El título de fila del tablero es el mismo del informe.
import board from '../GameReport/GameReport.module.css'
import styles from './Register.module.css'

interface CubeChoiceProps {
  ids: string[]
  players: PlayerIndex
  value: string | string[]
  onPick: (id: string) => void
  label: string
  disabled?: (id: string) => boolean
}

/** Cubos de los jugadores de la mesa para elegir uno (o varios). */
function CubeChoice({ ids, players, value, onPick, label, disabled }: CubeChoiceProps) {
  const on = (id: string) => (Array.isArray(value) ? value.includes(id) : value === id)
  return (
    <span className={styles.cubechoice} role="group" aria-label={label}>
      {ids.map((id) => (
        <button key={id} type="button" className={cx(styles.cubechoice__btn, on(id) && styles['is-on'])} aria-pressed={on(id)}
          disabled={disabled?.(id)} onClick={() => onPick(id)} title={players.get(id)?.name}>
          <Cube color={players.get(id)?.color} size={18} /><span className="vh">{players.get(id)?.name}</span>
        </button>
      ))}
    </span>
  )
}

function Milestones({ s, d, players }: StepProps) {
  const ids = s.players.map((p) => p.id)
  const list = [...(s.map ? mapInfo(s.map).milestones : []), ...s.expansions.flatMap((e) => EXPANSION_MILESTONES[e] ?? [])]
  const claimed = Object.keys(s.milestones).length
  return (
    <section className={styles.wboard__col}>
      <h3 className={board['board-row__title']}><Icon name="milestone" size={18} />Hitos <span>{claimed} de {MAX_MILESTONES} reclamados, 5 PV cada uno</span></h3>
      <ul className={styles.wslots}>
        {list.map((m) => (
          <li key={m} className={cx(styles.wslot, s.milestones[m] && styles['is-claimed'], !s.milestones[m] && claimed >= MAX_MILESTONES && styles['is-off'])}>
            <span className={styles.wslot__name}>{milestoneLabel(m)}</span>
            <CubeChoice ids={ids} players={players} value={s.milestones[m] ?? ''} label={`Quién reclamó ${milestoneLabel(m)}`}
              disabled={() => !s.milestones[m] && claimed >= MAX_MILESTONES} onPick={(id) => d({ type: 'milestone', name: m, id })} />
          </li>
        ))}
      </ul>
    </section>
  )
}

const flip = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

/** Financió, 1.º (con empate, varios y sin 2.º) y 2.º (no en partidas de 2). */
function AwardGrid({ w, ids, players, set }: { w: WizardAward; ids: string[]; players: PlayerIndex; set: (patch: Partial<WizardAward>) => void }) {
  const noSecond = ids.length === 2 || w.first.length > 1
  const label = awardLabel(w.name)
  return (
    <div className={styles.wslot__grid}>
      <span>Financió</span><CubeChoice ids={ids} players={players} value={w.opened_by} label={`Quién financió ${label}`} onPick={(id) => set({ opened_by: id })} />
      <span>1.º</span><CubeChoice ids={ids} players={players} value={w.first} label={`Primer puesto en ${label}`} disabled={(id) => w.second.includes(id)}
        onPick={(id) => set({ first: flip(w.first, id), second: flip(w.first, id).length > 1 ? [] : w.second })} />
      {!noSecond && <><span>2.º</span><CubeChoice ids={ids} players={players} value={w.second} label={`Segundo puesto en ${label}`}
        disabled={(id) => w.first.includes(id)} onPick={(id) => set({ second: flip(w.second, id) })} /></>}
    </div>
  )
}

function Awards({ s, d, errors, players }: StepProps) {
  const ids = s.players.map((p) => p.id)
  const list = [...(s.map ? mapInfo(s.map).awards : []), ...s.expansions.flatMap((e) => EXPANSION_AWARDS[e] ?? [])]
  const funded = (n: string) => s.awards.find((w) => w.name === n)
  const setAward = (name: string, patch: Partial<WizardAward>) => d({ type: 'award', awards: s.awards.map((w) => (w.name === name ? { ...w, ...patch } : w)) })
  const toggle = (name: string) => d({ type: 'award', awards: funded(name) ? s.awards.filter((w) => w.name !== name)
    : s.awards.length >= MAX_AWARDS ? s.awards : [...s.awards, { name, opened_by: '', first: [], second: [] }] })
  return (
    <section className={styles.wboard__col}>
      <h3 className={board['board-row__title']}><Icon name="award" size={18} />Recompensas <span>{s.awards.length} de {MAX_AWARDS} financiadas</span></h3>
      <ul className={styles.wslots}>
        {list.map((name) => {
          const w = funded(name)
          return (
            <li key={name} className={cx(styles.wslot, styles['wslot--award'], w && styles['is-claimed'], errors.some((e) => e.field === `aw-${name}`) && styles['is-bad'])}>
              <span className={styles.wslot__name}>{awardLabel(name)}</span>
              <Switch size="s" checked={!!w} disabled={!w && s.awards.length >= MAX_AWARDS} onChange={() => toggle(name)}>{w ? 'Financiada' : 'Sin financiar'}</Switch>
              {w && <AwardGrid w={w} ids={ids} players={players} set={(patch) => setAward(name, patch)} />}
            </li>
          )
        })}
      </ul>
      <p className={cx('faint', styles.wboard__note)}>Con empate en el 1.º puesto no se otorga 2.º. En partidas de 2 jugadores tampoco.</p>
    </section>
  )
}

export function StepBoard(props: StepProps) {
  return <div className={cx(styles.wstep, styles.wboard)}><Milestones {...props} /><Awards {...props} /></div>
}
