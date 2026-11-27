import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
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
/** Clases de botón, para enlaces que se ven como botones. */
export function buttonClass(variant: ButtonVariant, size: Size, opts: { full?: boolean; iconOnly?: boolean } = {}) {
  return cx(styles.btn, styles[`btn--${variant}`], styles[`btn--${size}`], opts.full && styles['btn--full'], opts.iconOnly && styles['btn--icon'])
}

interface ButtonLinkProps {
  to: string
  variant?: ButtonVariant
  size?: Size
  icon?: string
  className?: string
  children: ReactNode
}

/** Enlace con forma de botón (navega con el router: se puede abrir y copiar). */
export function ButtonLink({ to, variant = 'secondary', size = 'm', icon, className, children }: ButtonLinkProps) {
  return (
    <Link to={to} className={cx(buttonClass(variant, size), className)}>
      {icon && <Icon name={icon} size={size === 's' ? 16 : 18} />}
      <span className={styles.btn__label}>{children}</span>
    </Link>
  )
}

export function Button({
  variant = 'secondary', size = 'm', icon, iconRight, children, onClick, type = 'button', disabled, label, full, pressed,
}: ButtonProps) {
  const className = buttonClass(variant, size, { full, iconOnly: !children })
  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={pressed}>
      {icon && <Icon name={icon} size={size === 's' ? 16 : 18} />}
      {children && <span className={styles.btn__label}>{children}</span>}
      {iconRight && <Icon name={iconRight} size={16} />}
    </button>
  )
}
