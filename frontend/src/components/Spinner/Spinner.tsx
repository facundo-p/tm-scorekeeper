import styles from './Spinner.module.css'

interface SpinnerProps {
  size?: 'sm' | 'md'
}

export default function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div className={[styles.wrapper, size === 'sm' ? styles.sm : ''].join(' ')}>
      <div className={styles.spinner} role="status" aria-label="Cargando" />
    </div>
  )
}
