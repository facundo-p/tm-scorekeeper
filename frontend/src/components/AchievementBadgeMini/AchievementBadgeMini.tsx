import AchievementIcon from '@/components/AchievementIcon/AchievementIcon'
import styles from './AchievementBadgeMini.module.css'

interface AchievementBadgeMiniProps {
  title: string
  tier: number
  fallback_icon: string
  is_new: boolean
  is_upgrade: boolean
}

export default function AchievementBadgeMini({
  title,
  tier,
  fallback_icon,
  is_new,
  is_upgrade,
}: AchievementBadgeMiniProps) {
  const badgeType = is_new ? 'new' : 'upgrade'
  const badgeVariantClass = is_new ? styles.badgeNew : styles.badgeUpgrade
  const tierPillClass = is_new ? styles.tierPillNew : styles.tierPillUpgrade

  return (
    <div
      className={[styles.badge, badgeVariantClass].join(' ')}
      data-type={badgeType}
    >
      <AchievementIcon fallback_icon={fallback_icon} size={20} unlocked={true} />
      <span className={styles.title}>{title}</span>
      <span className={tierPillClass}>NIVEL {tier}</span>
    </div>
  )
}
