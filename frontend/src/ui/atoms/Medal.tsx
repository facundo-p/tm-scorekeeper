import { TIER_MATERIALS } from '@/domain/catalog'
import { Icon } from '../icons'
import { cx } from '../cx'
import { useTilt } from '../hooks/useTilt'
import type { Size } from './types'
import styles from './Medal.module.css'

const GLYPH_SIZE: Record<Size, number> = { s: 18, m: 28, l: 40 }

interface MedalProps {
  glyph: string
  tier?: number
  size?: Size
  locked?: boolean
  label?: string
  /** Logro de un solo nivel: se muestra en oro. */
  single?: boolean
}

/** Material del nivel: acero, titanio, oro, plasma o gaia; un logro único usa oro. */
export const medalMaterial = (tier: number, single?: boolean) => TIER_MATERIALS[single && tier ? 2 : Math.max(0, tier - 1)]

/** Medalla hexagonal en el material de su nivel; nivel 0 es bloqueada. */
export function Medal({ glyph, tier = 0, size = 'm', locked, label, single }: MedalProps) {
  const ref = useTilt<HTMLSpanElement>(14, styles['is-tilting'])
  const material = locked || !tier ? 'medal--locked' : `medal--${medalMaterial(tier, single).token}`
  const a11y = label ? { role: 'img', 'aria-label': label } : {}
  return (
    <span ref={ref} className={cx(styles.medal, styles[`medal--${size}`], styles[material])} {...a11y}>
      <svg className={styles.medal__hex} viewBox="0 0 100 100" aria-hidden="true">
        <path className={styles.medal__rim} d="M50 3l40.7 23.5v47L50 97 9.3 73.5v-47z" />
        <path className={styles.medal__face} d="M50 11l33.8 19.5v39L50 89 16.2 69.5v-39z" />
        <path className={styles.medal__bevel} d="M50 11l33.8 19.5v39L50 89" />
      </svg>
      <span className={styles.medal__glyph}><Icon name={glyph} size={GLYPH_SIZE[size]} /></span>
      <span className={styles.medal__glare} aria-hidden="true" />
    </span>
  )
}
