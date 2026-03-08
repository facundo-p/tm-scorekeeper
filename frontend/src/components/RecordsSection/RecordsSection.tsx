import Spinner from '@/components/Spinner/Spinner'
import type { RecordComparisonDTO } from '@/types'
import RecordComparisonCard from './RecordComparisonCard'
import styles from './RecordsSection.module.css'

interface Props {
  records: RecordComparisonDTO[] | null
  loading: boolean
  notAvailable: boolean
}

export default function RecordsSection({ records, loading, notAvailable }: Props) {
  if (loading) return <Spinner />

  if (notAvailable) {
    return (
      <div className={styles.placeholder}>
        <p>Los records de esta partida estarán disponibles próximamente.</p>
      </div>
    )
  }

  if (!records || records.length === 0) {
    return (
      <div className={styles.placeholder}>
        <p>No hay información de records para esta partida.</p>
      </div>
    )
  }

  const achieved = records.filter((r) => r.achieved)
  const notAchieved = records.filter((r) => !r.achieved)

  return (
    <div className={styles.sections}>
      {achieved.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Records superados</h3>
          <div className={styles.list}>
            {achieved.map((r, i) => (
              <RecordComparisonCard key={i} comparison={r} />
            ))}
          </div>
        </div>
      )}
      {notAchieved.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Records no superados</h3>
          <div className={styles.list}>
            {notAchieved.map((r, i) => (
              <RecordComparisonCard key={i} comparison={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
