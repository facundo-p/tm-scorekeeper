import { cx } from '../cx'
import styles from './Cube.module.css'

interface CubeProps {
  color?: string
  size?: number
  label?: string
}

/** Cubo de jugador en su color de marcador; con `label` es una imagen accesible. */
export function Cube({ color = 'gris', size = 16, label }: CubeProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const }
  return (
    <svg className={cx(styles.cube, styles[`cube--${color}`])} width={size} height={size} viewBox="0 0 20 20" {...a11y}>
      <path className={styles.cube__top} d="M10 2.2l7 3.9-7 3.9-7-3.9z" />
      <path className={styles.cube__left} d="M3 6.1l7 3.9v8L3 14.1z" />
      <path className={styles.cube__right} d="M17 6.1l-7 3.9v8l7-3.9z" />
    </svg>
  )
}
