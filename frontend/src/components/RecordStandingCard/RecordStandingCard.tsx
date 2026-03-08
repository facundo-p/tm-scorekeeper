import type { RecordResultDTO } from '@/types'
import { tryFormatDate } from '@/utils/formatDate'
import styles from './RecordStandingCard.module.css'

interface Props {
  description: string
  record: RecordResultDTO
}

export default function RecordStandingCard({ description, record }: Props) {
  return (
    <div className={styles.card}>
      <p className={styles.description}>{description}</p>
      <div className={styles.valueRow}>
        <span className={styles.value}>{record.value}</span>
        <span className={styles.attrs}>
          {record.attributes.map((attr, i) => (
            <span key={attr.label}>
              {i > 0 && <span className={styles.sep}> · </span>}
              {tryFormatDate(attr.value)}
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}
