import type { ReactNode } from 'react'
import { Icon } from '../icons'
import { cx } from '../cx'
import styles from './Chip.module.css'

interface ChipProps {
  children?: ReactNode
  icon?: string
  tone?: 'gold' | 'up'
  title?: string
}

export function Chip({ children, icon, tone, title }: ChipProps) {
  return (
    <span className={cx(styles.chip, tone && styles[`chip--${tone}`])} title={title}>
      {icon && <Icon name={icon} size={14} />}{children}
    </span>
  )
}
