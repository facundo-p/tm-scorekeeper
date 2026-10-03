import { cx } from '../cx'
import styles from './TierPips.module.css'

/** Nivel alcanzado como hexágonos en el material de cada nivel. */
export function TierPips({ tier, max }: { tier: number; max: number }) {
  return (
    <span className={styles.pips} role="img" aria-label={`Nivel ${tier} de ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={cx(styles.pip, i < tier && styles['pip--on'], i < tier && styles[`pip--t${i + 1}`])} />
      ))}
    </span>
  )
}
