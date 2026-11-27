import type { ReactNode } from 'react'
import styles from './SectionHead.module.css'

interface SectionHeadProps {
  title: ReactNode
  children?: ReactNode
  level?: 2 | 3 | 4
  id?: string
}

export function SectionHead({ title, children, level = 2, id }: SectionHeadProps) {
  const H = `h${level}` as const
  return (
    <header className={styles.shead}>
      <H className={styles.shead__title} id={id}>{title}</H>
      {children && <div className={styles.shead__aside}>{children}</div>}
    </header>
  )
}
