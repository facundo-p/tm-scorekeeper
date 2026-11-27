// Pasos de recompensas (3 financiadas como máximo, con su podio) y de hitos (3 como máximo).
import type { PlayerIndex } from '@/data/instruments'
import { EXPANSION_AWARDS, EXPANSION_MILESTONES, mapInfo } from '@/domain/catalog'
import { awardLabel, milestoneLabel } from '@/domain/labels'
import { Cube, Switch } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import { MAX_AWARDS, MAX_MILESTONES, patchAward, toggleAward, type WizardAward } from './model'
import type { StepProps } from './types'
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
    <>
      <p className={styles.wboard__count}><Icon name="milestone" size={18} />{claimed} de {MAX_MILESTONES} reclamados, 5 PV cada uno</p>
      <ul className={styles.wslots}>
        {list.map((m) => (
          <li key={m} className={cx(styles.wslot, s.milestones[m] && styles['is-claimed'], !s.milestones[m] && claimed >= MAX_MILESTONES && styles['is-off'])}>
            <span className={styles.wslot__name}>{milestoneLabel(m)}</span>
            <CubeChoice ids={ids} players={players} value={s.milestones[m] ?? ''} label={`Quién reclamó ${milestoneLabel(m)}`}
              disabled={() => !s.milestones[m] && claimed >= MAX_MILESTONES} onPick={(id) => d({ type: 'milestone', name: m, id })} />
          </li>
        ))}
      </ul>
    </>
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

interface AwardItemProps { name: string; w?: WizardAward; full: boolean; bad: boolean; ids: string[]; players: PlayerIndex
  onToggle: () => void; onSet: (patch: Partial<WizardAward>) => void }

function AwardItem({ name, w, full, bad, ids, players, onToggle, onSet }: AwardItemProps) {
  return (
    <li className={cx(styles.wslot, styles['wslot--award'], w && styles['is-claimed'], bad && styles['is-bad'])}>
      <span className={styles.wslot__name}>{awardLabel(name)}</span>
      <Switch size="s" checked={!!w} disabled={!w && full} onChange={onToggle}>{w ? 'Financiada' : 'Sin financiar'}</Switch>
      {w && <AwardGrid w={w} ids={ids} players={players} set={onSet} />}
    </li>
  )
}

function Awards({ s, d, errors, players }: StepProps) {
  const ids = s.players.map((p) => p.id)
  const list = [...(s.map ? mapInfo(s.map).awards : []), ...s.expansions.flatMap((e) => EXPANSION_AWARDS[e] ?? [])]
  return (
    <>
      <p className={styles.wboard__count}><Icon name="award" size={18} />{s.awards.length} de {MAX_AWARDS} financiadas</p>
      <ul className={styles.wslots}>
        {list.map((name) => (
          <AwardItem key={name} name={name} w={s.awards.find((w) => w.name === name)} full={s.awards.length >= MAX_AWARDS} ids={ids} players={players}
            bad={errors.some((e) => e.field === `aw-${name}`)} onToggle={() => d({ type: 'award', awards: toggleAward(s.awards, name) })}
            onSet={(patch) => d({ type: 'award', awards: patchAward(s.awards, name, patch) })} />
        ))}
      </ul>
      <p className={cx('faint', styles.wboard__note)}>Con empate en el 1.º puesto no se otorga 2.º. En partidas de 2 jugadores tampoco.</p>
    </>
  )
}

export const StepAwards = (props: StepProps) => <div className={styles.wstep}><Awards {...props} /></div>
export const StepMilestones = (props: StepProps) => <div className={styles.wstep}><Milestones {...props} /></div>
