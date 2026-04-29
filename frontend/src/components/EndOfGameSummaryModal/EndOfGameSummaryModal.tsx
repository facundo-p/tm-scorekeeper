import Modal from '@/components/Modal/Modal'
import RecordsSection from '@/components/RecordsSection/RecordsSection'
import Button from '@/components/Button/Button'
import type {
  GameResultDTO,
  RecordComparisonDTO,
  AchievementsByPlayerDTO,
  EloChangeDTO,
} from '@/types'
import ResultsSection from './ResultsSection'
import AchievementsSection from './AchievementsSection'
import EloSection from './EloSection'
import styles from './EndOfGameSummaryModal.module.css'

interface EndOfGameSummaryModalProps {
  result: GameResultDTO | null
  records: RecordComparisonDTO[] | null
  loadingRecords: boolean
  notAvailable: boolean
  achievements: AchievementsByPlayerDTO | null
  eloChanges: EloChangeDTO[] | null
  playerNames: Map<string, string>
  onClose: () => void
}

export default function EndOfGameSummaryModal({
  result,
  records,
  loadingRecords,
  notAvailable,
  achievements,
  eloChanges,
  playerNames,
  onClose,
}: EndOfGameSummaryModalProps) {
  const hasRecordsData = records !== null && !loadingRecords && !notAvailable
  const noAchievedRecords = hasRecordsData && records!.filter((r) => r.achieved).length === 0

  return (
    <Modal title="Resumen de partida" onClose={onClose}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Resultados</h3>
        <ResultsSection result={result} playerNames={playerNames} />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Records</h3>
        {noAchievedRecords ? (
          <p className={styles.emptyState}>Ningún record nuevo en esta partida.</p>
        ) : (
          <RecordsSection records={records} loading={loadingRecords} notAvailable={notAvailable} />
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Logros</h3>
        <AchievementsSection achievements={achievements} playerNames={playerNames} />
      </section>

      <EloSection eloChanges={eloChanges} result={result} />

      <div className={styles.footer}>
        <Button variant="primary" onClick={onClose}>Continuar</Button>
      </div>
    </Modal>
  )
}
