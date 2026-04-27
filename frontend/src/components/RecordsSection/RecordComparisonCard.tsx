import type { RecordComparisonDTO, RecordResultDTO } from '@/types'
import { tryFormatDate } from '@/utils/formatDate'
import styles from './RecordsSection.module.css'

function ResultRow({ label, result, isPrimary }: { label: string; result: RecordResultDTO; isPrimary: boolean }) {
  return (
    <div className={[styles.resultRow, isPrimary ? styles.primary : styles.secondary].join(' ')}>
      <span className={styles.resultLabel}>{label}</span>
      <p className={styles.resultAttrs}>
        {result.attributes.map((attr, i) => (
          <span key={attr.label}>
            {i > 0 && <span className={styles.resultAttrSep}> · </span>}
            {tryFormatDate(attr.value)}
          </span>
        ))}
      </p>
      <div className={styles.resultMeta}>
        <span className={styles.resultMetaValue}>{result.value}</span>
      </div>
    </div>
  )
}

interface Props {
  comparison: RecordComparisonDTO
}

export default function RecordComparisonCard({ comparison }: Props) {
  const heroTitle = comparison.title ?? comparison.description

  return (
    <div className={[styles.card, comparison.achieved ? styles.achieved : styles.notAchieved].join(' ')}>
      <p className={styles.hero}>
        {comparison.emoji && <span>{comparison.emoji}</span>} {heroTitle}
      </p>
      <div className={styles.rows}>
        {comparison.achieved ? (
          <>
            <ResultRow label="Nuevo" result={comparison.current} isPrimary={true} />
            {comparison.compared && <ResultRow label="Anterior" result={comparison.compared} isPrimary={false} />}
          </>
        ) : (
          <>
            <ResultRow label="Esta partida" result={comparison.compared!} isPrimary={false} />
            <ResultRow label="Record vigente" result={comparison.current} isPrimary={true} />
          </>
        )}
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.cardMetaDescription}>{comparison.description}</span>
      </div>
    </div>
  )
}
