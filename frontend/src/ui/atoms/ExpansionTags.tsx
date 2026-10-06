import { EXPANSIONS } from '@/domain/catalog'
import { Icon } from '../icons'
import { cx } from '../cx'
import styles from './ExpansionTags.module.css'

interface ExpansionTagsProps {
  expansions: string[]
  draft?: boolean
  /** `s`: 20 px, para las filas del archivo de partidas. */
  size?: 's'
}

/** Íconos de las expansiones usadas (y del draft), con su nombre para lectores de pantalla. */
export function ExpansionTags({ expansions, draft, size }: ExpansionTagsProps) {
  return (
    <span className={cx(styles.exptags, size && styles[`exptags--${size}`])}>
      {expansions.map((e) => (
        <span key={e} className={styles.exptag} title={EXPANSIONS[e].label}>
          <Icon name={EXPANSIONS[e].glyph} size={15} /><span className="vh">{EXPANSIONS[e].label}</span>
          <span className={styles.exptag__letter} aria-hidden="true">{EXPANSIONS[e].short}</span>
        </span>
      ))}
      {draft && (
        <span className={cx(styles.exptag, styles['exptag--draft'])} title="Draft">
          <Icon name="draft" size={15} /><span className="vh">Draft</span>
        </span>
      )}
    </span>
  )
}
