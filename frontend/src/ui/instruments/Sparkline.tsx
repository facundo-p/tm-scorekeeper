// Tendencia mínima (sparkline) y racha de posiciones recientes.
import { cx } from '@/ui/cx'
import type { FormCell } from './types'
import styles from './instruments.module.css'

interface SparklineProps { values: number[]; width?: number; height?: number; color?: string }

/** Puntos del trazo dentro de un margen de 2..4 px. */
export function sparkPoints(values: number[], width: number, height: number) {
  const lo = Math.min(...values)
  const span = Math.max(...values) - lo || 1
  return values.map((v, i) => [2 + (i / (values.length - 1)) * (width - 6), 3 + (1 - (v - lo) / span) * (height - 6)])
}

export function Sparkline({ values, width = 96, height = 28, color }: SparklineProps) {
  if (!values || values.length < 2) return <span className={cx(styles.spark, styles['spark--empty'])}>—</span>
  const pts = sparkPoints(values, width, height)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
  const [ex, ey] = pts[pts.length - 1]
  return (
    <svg className={styles.spark} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={`${d}L${ex} ${height}L2 ${height}Z`} className={styles.spark__area} />
      <path d={d} className={styles.spark__line} />
      <circle cx={ex} cy={ey} r="3" className={cx(styles.spark__end, color && styles[`spark__end--${color}`])} />
    </svg>
  )
}

export function FormStrip({ form }: { form: FormCell[] }) {
  return (
    <ol className={styles.form} aria-label="Últimas partidas, de la más vieja a la más reciente">
      {form.map((f, i) => (
        <li key={i} className={cx(styles.form__cell, f.position === 1 && styles['is-win'], f.position === f.n && styles['is-last'])}
          data-tip={`${f.position}.º de ${f.n}`}><span>{f.position}</span></li>
      ))}
    </ol>
  )
}
