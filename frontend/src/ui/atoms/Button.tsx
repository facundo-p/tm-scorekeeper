import type { ReactNode } from 'react'
import { Icon } from '../icons'
import { cx } from '../cx'
import type { Size } from './types'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps {
  variant?: ButtonVariant
  size?: Size
  icon?: string
  iconRight?: string
  children?: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  /** Nombre accesible; obligatorio si el botón es solo un ícono. */
  label?: string
  full?: boolean
  pressed?: boolean
}

/** Botón de placa biselada. Sin texto se vuelve cuadrado (ícono). */
export function Button({
  variant = 'secondary', size = 'm', icon, iconRight, children, onClick, type = 'button', disabled, label, full, pressed,
}: ButtonProps) {
  const className = cx(styles.btn, styles[`btn--${variant}`], styles[`btn--${size}`], full && styles['btn--full'], !children && styles['btn--icon'])
  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={pressed}>
      {icon && <Icon name={icon} size={size === 's' ? 16 : 18} />}
      {children && <span className={styles.btn__label}>{children}</span>}
      {iconRight && <Icon name={iconRight} size={16} />}
    </button>
  )
}
