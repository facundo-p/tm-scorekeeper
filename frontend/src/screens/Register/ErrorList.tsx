import { useEffect, useRef } from 'react'
import { Icon } from '@/ui/icons'
import type { WizardError } from './model'
import styles from './Register.module.css'

/** Errores del paso: toma el foco para que el lector de pantalla los lea. */
export function ErrorList({ errors }: { errors: WizardError[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (errors.length) ref.current?.focus() }, [errors])
  if (!errors.length) return null
  return (
    <div className={styles.werrors} role="alert" tabIndex={-1} ref={ref}>
      <Icon name="info" size={18} />
      <ul>{errors.map((e, i) => <li key={`${e.field}-${i}`}>{e.msg}</li>)}</ul>
    </div>
  )
}
