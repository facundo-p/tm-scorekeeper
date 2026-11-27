import { cssVars } from '@/domain/cssVars'
import styles from './ProgressBar.module.css'

export interface Progress { current: number; target: number }

/** Avance hacia el próximo nivel, en porcentaje entero (0 a 100; 0 si no hay meta). */
export const progressPct = (p: Progress) => (p.target > 0 ? Math.min(100, Math.max(0, Math.round((p.current / p.target) * 100))) : 0)

/** Barra de avance hacia el próximo nivel (perfil y logros). */
export function ProgressBar({ progress }: { progress: Progress }) {
  return <span className={styles.pach__bar}><i style={cssVars({ p: progressPct(progress) })} /></span>
}
