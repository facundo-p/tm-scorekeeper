import { Icon } from '../icons'
import styles from './TagDisc.module.css'

export type TagTone = 'blue' | 'green' | 'red' | 'gold'

/** Disco de color con un ícono (bitácora, récords): `.tagdisc` del mockup. */
export function TagDisc({ icon, tone, title, size = 15 }: { icon: string; tone: TagTone; title?: string; size?: number }) {
  return <span className={`${styles.tagdisc} ${styles[`tagdisc--${tone}`]}`} title={title}><Icon name={icon} size={size} /></span>
}
