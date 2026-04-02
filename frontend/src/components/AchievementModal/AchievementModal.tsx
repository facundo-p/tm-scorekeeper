import Modal from '@/components/Modal/Modal'
import AchievementBadgeMini from '@/components/AchievementBadgeMini/AchievementBadgeMini'
import Button from '@/components/Button/Button'
import type { AchievementsByPlayerDTO } from '@/types'
import styles from './AchievementModal.module.css'

interface AchievementModalProps {
  achievements: AchievementsByPlayerDTO
  playerNames: Map<string, string>
  onClose: () => void
}

export default function AchievementModal({ achievements, playerNames, onClose }: AchievementModalProps) {
  const playerEntries = Object.entries(achievements.achievements_by_player).filter(([, list]) => list.length > 0)

  return (
    <Modal title="Logros desbloqueados" onClose={onClose}>
      {playerEntries.map(([playerId, achList]) => (
        <div key={playerId} className={styles.playerGroup}>
          <h3 className={styles.playerName}>{playerNames.get(playerId) ?? playerId}</h3>
          <div className={styles.badgeList}>
            {achList.map(ach => (
              <AchievementBadgeMini
                key={ach.code}
                title={ach.title}
                tier={ach.tier}
                fallback_icon={ach.fallback_icon}
                is_new={ach.is_new}
                is_upgrade={ach.is_upgrade}
              />
            ))}
          </div>
        </div>
      ))}
      <div className={styles.footer}>
        <Button variant="primary" onClick={onClose}>Continuar</Button>
      </div>
    </Modal>
  )
}
