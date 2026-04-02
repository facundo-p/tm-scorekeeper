import AchievementIcon from '@/components/AchievementIcon/AchievementIcon'
import ProgressBar from '@/components/ProgressBar/ProgressBar'
import styles from './AchievementCard.module.css'

interface AchievementCardProps {
  title: string
  description: string
  fallback_icon: string
  tier: number
  max_tier: number
  unlocked: boolean
  progress: { current: number; target: number } | null
  onClick?: () => void
}

export default function AchievementCard({
  title,
  description,
  fallback_icon,
  tier,
  unlocked,
  progress,
  onClick,
}: AchievementCardProps) {
  const progressPercentage =
    progress && progress.target > 0
      ? Math.round((progress.current / progress.target) * 100)
      : 0

  const counter = progress ? `${progress.current}/${progress.target}` : undefined

  const cardClasses = [
    styles.card,
    unlocked ? styles.unlocked : styles.locked,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <AchievementIcon fallback_icon={fallback_icon} size={24} unlocked={unlocked} />
      <div className={styles.rightColumn}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.bottomRow}>
          <span className={styles.level}>NIVEL {unlocked ? tier : 0}</span>
          {progress !== null && (
            <div className={styles.progressWrapper}>
              <ProgressBar value={progressPercentage} />
            </div>
          )}
          {counter !== undefined && (
            <span className={styles.counter}>{counter}</span>
          )}
        </div>
      </div>
    </div>
  )
}
