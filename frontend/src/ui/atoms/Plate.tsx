import type { ElementType, ReactNode } from 'react'
import { cx } from '../cx'
import styles from './Plate.module.css'

interface PlateProps {
  as?: ElementType
  className?: string
  children?: ReactNode
  tone?: 'inset' | 'glass' | 'gold'
  label?: string
  id?: string
  cut?: 's' | 'l'
}

/** Panel del casco con esquinas recortadas; `data-sheen` sigue al puntero (marco). */
export function Plate({ as: Tag = 'section', className, children, tone, label, id, cut }: PlateProps) {
  return (
    <Tag className={cx(styles.plate, tone && styles[`plate--${tone}`], cut && styles[`plate--cut-${cut}`], className)}
      data-sheen aria-label={label} id={id}>
      {children}
    </Tag>
  )
}
