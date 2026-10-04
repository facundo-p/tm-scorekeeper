import { Link } from 'react-router-dom'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import { NAV, PATHS, type NavItem, type Section } from './paths'
import { Wordmark } from './Wordmark'
import styles from './Chrome.module.css'

type Base = 'rail' | 'dock'

const ICON_SIZE: Record<Base, [number, number]> = { rail: [21, 24], dock: [22, 26] }

/** Enlace real de navegación (se puede abrir, copiar y leer como enlace). */
function NavLink({ item, section, base }: { item: NavItem; section: Section | null; base: Base }) {
  const on = section === item.id
  const [size, primarySize] = ICON_SIZE[base]
  return (
    <Link to={item.to} className={cx(styles[`${base}__item`], item.primary && styles[`${base}__item--primary`], on && styles['is-on'])}
      aria-current={on ? 'page' : undefined}>
      <span className={styles[base === 'rail' ? 'rail__hex' : 'dock__icon']}>
        <Icon name={item.icon} size={item.primary ? primarySize : size} />
      </span>
      <span className={styles[`${base}__label`]}>{item.label}</span>
    </Link>
  )
}

/** Navegación lateral (tableta y escritorio). */
export function Rail({ section, onExit }: { section: Section | null; onExit: () => void }) {
  return (
    <nav className={styles.rail} aria-label="Secciones">
      <Link to={PATHS.home} className={styles.rail__brand} aria-label="Inicio"><Wordmark compact /></Link>
      <ul className={styles.rail__list}>
        {NAV.map((item) => <li key={item.id}><NavLink item={item} section={section} base="rail" /></li>)}
      </ul>
      <Link to={PATHS.login} className={styles.rail__exit} aria-label="Salir" onClick={onExit}>
        <Icon name="power" size={18} />
      </Link>
    </nav>
  )
}

/** Navegación inferior (teléfono), con el botón de registrar en el centro. */
export function Dock({ section }: { section: Section | null }) {
  return (
    <nav className={styles.dock} aria-label="Secciones">
      {NAV.map((item) => <NavLink key={item.id} item={item} section={section} base="dock" />)}
    </nav>
  )
}
