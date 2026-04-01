import { Trophy, Flame, Map, Gamepad2, Star, Zap } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import styles from './AchievementIcon.module.css'

type IconComponent = React.FC<LucideProps>

const ICON_MAP: Record<string, IconComponent> = {
  trophy: Trophy,
  flame: Flame,
  map: Map,
  'gamepad-2': Gamepad2,
  star: Star,
  zap: Zap,
}

interface AchievementIconProps {
  fallback_icon: string
  size?: number
  unlocked: boolean
}

export default function AchievementIcon({
  fallback_icon,
  size = 24,
  unlocked,
}: AchievementIconProps) {
  const Icon = ICON_MAP[fallback_icon] ?? Trophy

  return (
    <div
      className={[styles.circle, unlocked ? styles.unlocked : styles.locked]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon size={size} />
    </div>
  )
}
