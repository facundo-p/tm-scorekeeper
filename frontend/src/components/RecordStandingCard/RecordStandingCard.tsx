import type { RecordResultDTO } from '@/types'
import { tryFormatDate } from '@/utils/formatDate'
import styles from './RecordStandingCard.module.css'

interface Props {
  title: string | null
  emoji: string | null
  description: string
  record: RecordResultDTO
}

export default function RecordStandingCard({ title, emoji, description, record }: Props) {
  return (
    <div className={styles.card}>
      <p className={styles.hero}>
        {emoji && <span>{emoji}</span>} {title ?? description}
      </p>
      <p className={styles.attrs}>
        {record.attributes.map((attr, i) => (
          <span key={attr.label}>
            {i > 0 && <span className={styles.sep}> · </span>}
            {tryFormatDate(attr.value)}
          </span>
        ))}
      </p>
      <div className={styles.meta}>
        <span className={styles.metaDescription}>{description}</span>
        <span className={styles.metaValue}>{record.value}</span>
      </div>
    </div>
  )
}
