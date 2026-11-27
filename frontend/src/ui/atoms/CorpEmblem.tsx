import { CORP_BY_NAME, corpLabel } from '@/domain/catalog'
import { cssVars } from '@/domain/cssVars'
import { cx } from '../cx'
import type { Size } from './types'
import styles from './CorpEmblem.module.css'

interface CorpEmblemProps {
  name: string
  size?: Size
  withName?: boolean
}

/** Sigla de la corporación en su tono; sin nombre visible, lo lee el lector de pantalla. */
export function CorpEmblem({ name, size = 'm', withName = false }: CorpEmblemProps) {
  const c = CORP_BY_NAME[name]
  if (!c) return null
  return (
    <span className={cx(styles.corp, styles[`corp--${size}`])} style={cssVars({ hue: c.hue })} title={name}>
      <span className={styles.corp__mark} aria-hidden="true">{c.short}</span>
      {withName ? <span className={styles.corp__name}>{corpLabel(name)}</span> : <span className="vh">{name}</span>}
    </span>
  )
}
