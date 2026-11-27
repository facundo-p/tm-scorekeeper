// Paso 5: revisión con posiciones y aviso de empate.
import { corpLabel, EXPANSIONS, mapInfo } from '@/domain/catalog'
import { fmtDate } from '@/domain/format'
import { Chip, Cube } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Icon, MapGlyph } from '@/ui/icons'
import { derived, hasTies } from './model'
import type { StepProps } from './types'
import styles from './Register.module.css'

function Meta({ s }: Pick<StepProps, 's'>) {
  return (
    <div className={styles.wreview__meta}>
      <span className={styles.wreview__map}><MapGlyph glyph={mapInfo(s.map).glyph} size={24} /><b>{s.map}</b></span>
      <Chip icon="calendar">{fmtDate(s.date)}</Chip><Chip icon="generation">{s.generations} generaciones</Chip>
      {s.draft && <Chip icon="draft">Draft</Chip>}
      {s.expansions.map((e) => <Chip key={e} icon={EXPANSIONS[e].glyph}>{EXPANSIONS[e].label}</Chip>)}
    </div>
  )
}

export function StepReview({ s, players }: StepProps) {
  const { order } = derived(s)
  return (
    <div className={cx(styles.wstep, styles.wreview)}>
      <Meta s={s} />
      <ol className={styles.wreview__list}>
        {order.map((r) => (
          <li key={r.id} className={cx(styles.wreview__row, r.position === 1 && styles['is-win'])}>
            <span className={styles.wreview__pos}>{r.position}</span>
            <Cube color={players.get(r.id)?.color} size={18} /><b>{players.get(r.id)?.name}</b>
            <span className="faint">{corpLabel(s.players.find((p) => p.id === r.id)!.corp)}</span>
            <span className={styles.wreview__total}>{r.total}</span><span className="faint">{r.mc} M€</span>
          </li>
        ))}
      </ol>
      {hasTies(order) && <p className={styles.wreview__warn}><Icon name="info" size={16} />Hay empate en puntos: decide quien terminó con más M€.</p>}
      <p className="faint">Al guardar se recalculan el ELO, los récords y los logros, y se abre la ceremonia de cierre.</p>
    </div>
  )
}
