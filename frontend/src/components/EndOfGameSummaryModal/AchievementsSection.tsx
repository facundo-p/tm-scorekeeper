import AchievementBadgeMini from '@/components/AchievementBadgeMini/AchievementBadgeMini'
import Spinner from '@/components/Spinner/Spinner'
import type { AchievementsByPlayerDTO } from '@/types'
import styles from './EndOfGameSummaryModal.module.css'

interface AchievementsSectionProps {
  achievements: AchievementsByPlayerDTO | null
  playerNames: Map<string, string>
}

export default function AchievementsSection({ achievements, playerNames }: AchievementsSectionProps) {
  if (!achievements) return <Spinner />

  const playerEntries = Object.entries(achievements.achievements_by_player)
    .filter(([, list]) => list.length > 0)

  if (playerEntries.length === 0) {
    return <p className={styles.emptyState}>Ningún logro desbloqueado.</p>
  }

  return (
    <>
      {playerEntries.map(([playerId, achList]) => (
        <div key={playerId} className={styles.playerGroup}>
          <h4 className={styles.achievementsPlayerName}>{playerNames.get(playerId) ?? playerId}</h4>
          <div className={styles.badgeList}>
            {achList.map((ach) => (
              <AchievementBadgeMini
                key={ach.code}
                title={ach.title}
                tier={ach.tier}
                fallback_icon={ach.fallback_icon}
                is_new={ach.is_new}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
