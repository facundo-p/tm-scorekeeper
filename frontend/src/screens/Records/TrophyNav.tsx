import { useNavigate } from 'react-router-dom'
import { cssVars } from '@/domain/cssVars'
import { PATHS } from '@/shell/paths'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import reveal from '@/ui/reveal.module.css'
import styles from './Records.module.css'

const TROPHIES = [
  { id: 'records', label: 'Récords', icon: 'trophyNav', to: PATHS.records },
  { id: 'achievements', label: 'Logros', icon: 'crown', to: PATHS.achievements },
] as const

/** Pestañas de la sección Trofeos: récords y logros (como el mockup, un tablist que navega). */
export function TrophyNav({ current }: { current: 'records' | 'achievements' }) {
  const navigate = useNavigate()
  return (
    <div className={cx(styles.trophynav, reveal.reveal)} style={cssVars({ i: 0 })} role="tablist" aria-label="Trofeos">
      {TROPHIES.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={current === t.id} className={cx(styles.trophynav__tab, current === t.id && styles['is-on'])}
          onClick={() => navigate(t.to)}><Icon name={t.icon} size={18} />{t.label}</button>
      ))}
    </div>
  )
}
