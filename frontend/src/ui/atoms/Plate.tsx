import type { ElementType, FormEventHandler, ReactNode } from 'react'
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
  /** Con `as="form"`: la placa es el formulario (acceso). */
  onSubmit?: FormEventHandler
  noValidate?: boolean
}

/** Panel del casco con esquinas recortadas; `data-sheen` sigue al puntero (marco). */
export function Plate({ as: Tag = 'section', className, children, tone, label, id, cut, onSubmit, noValidate }: PlateProps) {
  return (
    <Tag className={cx(styles.plate, tone && styles[`plate--${tone}`], cut && styles[`plate--cut-${cut}`], className)}
      data-sheen aria-label={label} id={id} onSubmit={onSubmit} noValidate={noValidate}>
      {children}
    </Tag>
  )
}
