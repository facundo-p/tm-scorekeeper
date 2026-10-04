import { CATEGORIES } from '@/domain/catalog'
import { cssVars } from '@/domain/cssVars'
import { fmt } from '@/domain/format'
import { cx } from '@/ui/cx'
import styles from './instruments.module.css'

/** «ADN» del puntaje: qué parte del total sale de cada categoría (las de menos de 0,5 % no se dibujan). */
export function CompositionBar({ share, label }: { share: Record<string, number>; label: string }) {
  return (
    <div className={styles.compbar}>
      <span className={styles.compbar__label}>{label}</span>
      <div className={styles.compbar__track}>
        {CATEGORIES.map((c) => {
          const v = share[c.key] ?? 0
          if (v < 0.005) return null
          return (
            <span key={c.key} className={cx(styles.compbar__seg, styles[`catkey--${c.key}`])} style={cssVars({ v: (v * 100).toFixed(2) })}
              data-tip={`${c.long}: ${fmt.pct(v)}`} tabIndex={0} role="img" aria-label={`${c.long} ${fmt.pct(v)}`} />
          )
        })}
      </div>
    </div>
  )
}
