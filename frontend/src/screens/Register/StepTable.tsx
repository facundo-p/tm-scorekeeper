// Paso 2: quiénes jugaron (2 a 5) y la corporación de cada uno.
import type { PlayerLike } from '@/ui/atoms'
import { Cube } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import { CorpPicker } from './CorpPicker'
import { CubePicker } from './CubePicker'
import { MAX_PLAYERS } from './model'
import type { StepProps } from './types'
import styles from './Register.module.css'

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

/** Lo que ya eligieron los demás (corporación o color), con el nombre de quien lo eligió. */
function takenBy(s: StepProps['s'], id: string, players: StepProps['players'], pick: (id: string) => string | undefined) {
  return Object.fromEntries(s.players.filter((x) => x.id !== id && pick(x.id)).map((x) => [pick(x.id), players.get(x.id)?.name ?? x.id]))
}

function CorpRows({ s, d, errors, players }: StepProps) {
  const corpOf = (id: string) => s.players.find((x) => x.id === id)?.corp
  const colorOf = (id: string) => players.get(id)?.color  // `players` ya trae el color de esta partida
  return (
    <fieldset className={styles.wfield}>
      <legend className={styles.wfield__label}>Corporaciones y colores <span className="faint">escribí para buscar entre todas; tocá el cubo que usó cada uno</span></legend>
      <ul className={styles.corprows}>
        {s.players.map((p) => {
          const who = players.get(p.id)
          return (
            <li key={p.id} className={styles.corprow}>
              <span className={styles.corprow__who}><Cube color={who?.color} size={20} /><b>{who?.name}</b></span>
              <label className="vh" htmlFor={`corp-${p.id}`}>Corporación de {who?.name}</label>
              <div className={styles.corprow__picks}>
                <CorpPicker id={`corp-${p.id}`} value={p.corp} takenBy={takenBy(s, p.id, players, corpOf)} bad={errors.some((e) => e.field === `corp-${p.id}`)}
                  onPick={(corp) => d({ type: 'player', id: p.id, patch: { corp } })} />
                <CubePicker name={who?.name ?? p.id} value={who?.color} takenBy={takenBy(s, p.id, players, colorOf)}
                  onPick={(color) => d({ type: 'player', id: p.id, patch: { color } })} />
              </div>
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
