// Paso 1: mapa, fecha, generaciones, draft y expansiones.
import { EXPANSIONS, MAP_ORDER, MAPS } from '@/domain/catalog'
import { monthsBefore, today } from '@/domain/clock'
import { Field, inputClassFor, Stepper, Switch } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Icon, MapGlyph } from '@/ui/icons'
import type { WizardState } from './model'
import type { StepProps } from './types'
import styles from './Register.module.css'

const EXP_HINT: Record<string, string> = { Turmoil: 'suma un paso con los puntos de Turmoil', 'Venus next': 'agrega Hoverlord y Venuphile' }

function MapTiles({ s, d, errors }: Omit<StepProps, 'players'>) {
  const recent = monthsBefore(today(), 12)
  return (
    <fieldset className={styles.wfield}>
      <legend className={styles.wfield__label}>Mapa</legend>
      <div className={cx(styles.maptiles, errors.some((e) => e.field === 'map') && styles['is-bad'])}>
        {MAP_ORDER.map((name) => (
          <label key={name} className={cx(styles.maptile, s.map === name && styles['is-on'])}>
            <input type="radio" name="map" value={name} checked={s.map === name} onChange={() => d({ type: 'set', patch: { map: name } })} />
            <MapGlyph glyph={MAPS[name].glyph} size={34} />
            <span className={styles.maptile__name}>{name}</span>
            <span className={styles.maptile__blurb}>{MAPS[name].blurb}</span>
            {MAPS[name].since >= recent && <span className={styles.maptile__new}>Nuevo mapa</span>}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Expansions({ s, d }: Omit<StepProps, 'players' | 'errors'>) {
  const toggle = (e: string) => d({ type: 'set', patch: { expansions: s.expansions.includes(e) ? s.expansions.filter((x) => x !== e) : [...s.expansions, e] } })
  return (
    <fieldset className={styles.wfield}>
      <legend className={styles.wfield__label}>Expansiones</legend>
      <div className={styles.exptoggles}>
        {Object.values(EXPANSIONS).map((e) => (
          <label key={e.id} className={cx(styles.exptoggle, s.expansions.includes(e.id) && styles['is-on'])}>
            <input type="checkbox" checked={s.expansions.includes(e.id)} onChange={() => toggle(e.id)} />
            <Icon name={e.glyph} size={20} /><span>{e.label}</span>
            {EXP_HINT[e.id] && <small>{EXP_HINT[e.id]}</small>}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function StepGame({ s, d, errors }: StepProps) {
  const set = (patch: Partial<WizardState>) => d({ type: 'set', patch })
  return (
    <div className={styles.wstep}>
      <MapTiles s={s} d={d} errors={errors} />
      <div className={styles.wrow}>
        <Field label="Fecha">
          <input className={inputClassFor(errors.some((e) => e.field === 'date'))} type="date" id="game-date" value={s.date} max={today()}
            onChange={(e) => set({ date: e.target.value })} /></Field>
        <Field as="div" label="Generaciones" labelId="gens-l">
          <Stepper value={s.generations} min={1} max={30} labelledby="gens-l" onChange={(v) => set({ generations: v })} /></Field>
        <Field as="div" label="Draft">
          <Switch checked={s.draft} onChange={(v) => set({ draft: v })}>{s.draft ? 'Con draft' : 'Sin draft'}</Switch></Field>
      </div>
      <Expansions s={s} d={d} />
    </div>
  )
}
