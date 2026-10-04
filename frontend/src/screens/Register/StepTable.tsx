// Paso 2: quiénes jugaron (2 a 5) y la corporación de cada uno.
import type { PlayerLike } from '@/ui/atoms'
import { CORPS, corpLabel, EXPANSIONS } from '@/domain/catalog'
import { CorpEmblem, Cube, inputClass } from '@/ui/atoms'
import corpStyles from '@/ui/atoms/CorpEmblem.module.css'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import { MAX_PLAYERS, type WizardPlayer } from './model'
import type { StepProps } from './types'
import styles from './Register.module.css'

const CORP_GROUPS = ['base', 'Prelude', 'Venus next', 'Colonies', 'Turmoil']

function WhoTiles({ s, d, active }: Pick<StepProps, 's' | 'd'> & { active: PlayerLike[] }) {
  return (
    <fieldset className={styles.wfield}>
      <legend className={styles.wfield__label}>Quiénes jugaron <span className="faint">{s.players.length} de {MAX_PLAYERS}</span></legend>
      <div className={styles.whotiles}>
        {active.map((p) => {
          const on = s.players.some((x) => x.id === p.id)
          return (
            <button key={p.id} type="button" className={cx(styles.whotile, on && styles['is-on'])} aria-pressed={on}
              disabled={!on && s.players.length >= MAX_PLAYERS} onClick={() => d({ type: 'togglePlayer', id: p.id })}>
              <Cube color={p.color} size={26} /><span>{p.name}</span>{on && <span className={styles.whotile__check}><Icon name="check" size={14} /></span>}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Corporaciones del juego base y de las expansiones elegidas; una ya tomada no se repite (salvo Novel). */
function CorpSelect({ s, p, onChange }: { s: StepProps['s']; p: WizardPlayer; onChange: (corp: string) => void }) {
  const used = s.players.filter((x) => x.id !== p.id).map((x) => x.corp)
  return (
    <select className={cx(inputClass, styles.corprow__select)} id={`corp-${p.id}`} value={p.corp} onChange={(e) => onChange(e.target.value)}>
      <option value="">Elegir corporación</option>
      {CORP_GROUPS.filter((x) => x === 'base' || s.expansions.includes(x)).map((exp) => (
        <optgroup key={exp} label={exp === 'base' ? 'Juego base' : EXPANSIONS[exp].label}>
          {CORPS.filter((c) => c.exp === exp).map((c) => (
            <option key={c.name} value={c.name} disabled={c.name !== 'Novel Corporation' && used.includes(c.name)}>{corpLabel(c.name)}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

function CorpRows({ s, d, errors, players }: StepProps) {
  return (
    <fieldset className={styles.wfield}>
      <legend className={styles.wfield__label}>Corporaciones</legend>
      <ul className={styles.corprows}>
        {s.players.map((p) => {
          const who = players.get(p.id)
          return (
            <li key={p.id} className={cx(styles.corprow, errors.some((e) => e.field === `corp-${p.id}`) && styles['is-bad'])}>
              <span className={styles.corprow__who}><Cube color={who?.color} size={20} /><b>{who?.name}</b></span>
              <span className={styles.corprow__emblem}>{p.corp ? <CorpEmblem name={p.corp} size="m" /> : <span className={cx(corpStyles.corp__mark, styles.corprow__ph)}>?</span>}</span>
              <label className="vh" htmlFor={`corp-${p.id}`}>Corporación de {who?.name}</label>
              <CorpSelect s={s} p={p} onChange={(corp) => d({ type: 'player', id: p.id, patch: { corp } })} />
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

export function StepTable(props: StepProps) {
  return (
    <div className={styles.wstep}>
      <WhoTiles s={props.s} d={props.d} active={props.active ?? []} />
      {props.s.players.length > 0 && <CorpRows {...props} />}
    </div>
  )
}
