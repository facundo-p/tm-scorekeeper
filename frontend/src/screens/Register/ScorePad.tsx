// Paso 4: planilla de puntaje. En escritorio, una tabla con todos; en el teléfono, una pestaña por jugador.
import { useState } from 'react'
import { CATEGORIES } from '@/domain/catalog'
import { Cube, Stepper } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import instruments from '@/ui/instruments/instruments.module.css'
import { derived, INPUT_CATS, type DerivedRow, type InputCat, type WizardPlayer } from './model'
import type { StepProps } from './types'
import styles from './Register.module.css'

const catLabel = (k: string) => CATEGORIES.find((c) => c.key === k)!.long
const CatKey = ({ k }: { k: string }) => <span className={cx(instruments.catkey, instruments[`catkey--${k}`])} />

function useCats(s: StepProps['s']) {
  const { rows, turmoil } = derived(s)
  return { rows, cats: INPUT_CATS.filter((k) => k !== 'turmoil_points' || turmoil), leader: Math.max(...rows.map((r) => r.total)) }
}

function PadInputs({ cats, s, d, name }: { cats: InputCat[]; s: StepProps['s']; d: StepProps['d']; name: (id: string) => string }) {
  return cats.map((k) => (
    <div key={k} className={styles.pad__row} role="row">
      <span role="rowheader" className={styles.pad__cat}><CatKey k={k} />{catLabel(k)}</span>
      {s.players.map((p) => <span key={p.id} role="cell"><Stepper small value={p.scores[k]} label={`${catLabel(k)} de ${name(p.id)}`}
        onChange={(v) => d({ type: 'score', id: p.id, key: k, value: v })} /></span>)}
    </div>
  ))
}

function PadFooter({ rows, s, d, name, leader }: { rows: DerivedRow[]; s: StepProps['s']; d: StepProps['d']; name: (id: string) => string; leader: number }) {
  return (
    <>
      {(['milestone_points', 'award_points'] as const).map((k) => (
        <div key={k} className={cx(styles.pad__row, styles.pad__auto)} role="row">
          <span role="rowheader" className={styles.pad__cat}><CatKey k={k} />{catLabel(k)}<small>automático</small></span>
          {rows.map((r) => <span key={r.id} role="cell" className={styles.pad__fixed}>{r.sc[k]}</span>)}
        </div>
      ))}
      <div className={cx(styles.pad__row, styles.pad__mc)} role="row">
        <span role="rowheader" className={styles.pad__cat}><Icon name="mc" size={16} />M€ finales<small>desempate</small></span>
        {s.players.map((p) => <span key={p.id} role="cell"><Stepper small value={p.mc} label={`M€ finales de ${name(p.id)}`}
          onChange={(v) => d({ type: 'player', id: p.id, patch: { mc: v } })} /></span>)}
      </div>
      <div className={cx(styles.pad__row, styles.pad__total)} role="row">
        <span role="rowheader">Total</span>
        {rows.map((r) => <span key={r.id} role="cell" className={cx(styles.pad__sum, r.total === leader && styles['is-lead'])}>{r.total}</span>)}
      </div>
    </>
  )
}

function Pad({ s, d, players }: StepProps) {
  const { rows, cats, leader } = useCats(s)
  const name = (id: string) => players.get(id)?.name ?? id
  return (
    <div className={styles.pad} role="table" aria-label="Planilla de puntaje">
      <div className={cx(styles.pad__row, styles.pad__head)} role="row">
        <span role="columnheader">Categoría</span>
        {s.players.map((p) => <span key={p.id} role="columnheader" className={styles.pad__ph}><Cube color={players.get(p.id)?.color} size={16} />{name(p.id)}</span>)}
      </div>
      <PadInputs cats={cats} s={s} d={d} name={name} />
      <PadFooter rows={rows} s={s} d={d} name={name} leader={leader} />
    </div>
  )
}

function MobileList({ p, row, cats, d, name }: { p: WizardPlayer; row: DerivedRow; cats: InputCat[]; d: StepProps['d']; name: string }) {
  return (
    <ul className={styles.padm__list}>
      {cats.map((k) => (
        <li key={k}><span className={styles.pad__cat}><CatKey k={k} />{catLabel(k)}</span>
          <Stepper value={p.scores[k]} label={`${catLabel(k)} de ${name}`} onChange={(v) => d({ type: 'score', id: p.id, key: k, value: v })} /></li>
      ))}
      <li><span className={styles.pad__cat}><Icon name="mc" size={16} />M€ finales</span>
        <Stepper value={p.mc} label={`M€ finales de ${name}`} onChange={(v) => d({ type: 'player', id: p.id, patch: { mc: v } })} /></li>
      <li className={styles.padm__auto}><span>Hitos y recompensas (automático)</span><b>{row.sc.milestone_points + row.sc.award_points}</b></li>
    </ul>
  )
}

function MobilePad({ s, d, players }: StepProps) {
  const { rows, cats, leader } = useCats(s)
  const [tab, setTab] = useState(s.players[0]?.id)
  const p = s.players.find((x) => x.id === tab)
  return (
    <div className={styles.padm}>
      <div className={styles.padm__tabs} role="tablist" aria-label="Jugador">
        {rows.map((r) => (
          <button key={r.id} type="button" role="tab" aria-selected={tab === r.id} className={cx(styles.padm__tab, tab === r.id && styles['is-on'], r.total === leader && styles['is-lead'])}
            onClick={() => setTab(r.id)}><Cube color={players.get(r.id)?.color} size={16} /><span>{players.get(r.id)?.name}</span><b>{r.total}</b></button>
        ))}
      </div>
      {p && <MobileList p={p} row={rows.find((r) => r.id === p.id)!} cats={cats} d={d} name={players.get(p.id)?.name ?? p.id} />}
    </div>
  )
}

export function ScorePad(props: StepProps) {
  return <div className={styles.wstep}><Pad {...props} /><MobilePad {...props} /></div>
}
