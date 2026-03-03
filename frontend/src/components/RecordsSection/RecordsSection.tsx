import Spinner from '@/components/Spinner/Spinner'
import type { GameRecordItemDTO } from '@/types'
import styles from './RecordsSection.module.css'

interface Props {
  records: GameRecordItemDTO[] | null
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
        <p>No se superaron records en esta partida.</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {records.map((record, i) => (
        <div
          key={i}
          className={[styles.recordItem, record.is_new_record ? styles.newRecord : ''].join(' ')}
        >
          <div>
            <p className={styles.recordType}>{record.type}</p>
            <p className={styles.recordValue}>{record.value}</p>
          </div>
          {record.is_new_record && <span className={styles.newBadge}>¡Nuevo Record!</span>}
        </div>
      ))}
    </div>
  )
}
