import type { RecordComparisonDTO, RecordResultDTO } from '@/types'
import { tryFormatDate } from '@/utils/formatDate'
import styles from './RecordsSection.module.css'

function ResultRow({ label, result, isPrimary }: { label: string; result: RecordResultDTO; isPrimary: boolean }) {
  return (
    <div className={[styles.resultRow, isPrimary ? styles.primary : styles.secondary].join(' ')}>
      <span className={styles.resultLabel}>{label}</span>
      <div className={styles.resultBottom}>
        <span className={styles.resultValue}>{result.value}</span>
        <span className={styles.resultAttrs}>
          {result.attributes.map((attr, i) => (
            <span key={attr.label} className={styles.resultAttr}>
              {i > 0 && <span className={styles.resultAttrSep}> · </span>}
              {tryFormatDate(attr.value)}
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}

interface Props {
  comparison: RecordComparisonDTO
}

export default function RecordComparisonCard({ comparison }: Props) {
  return (
    <div className={[styles.card, comparison.achieved ? styles.achieved : styles.notAchieved].join(' ')}>
      <p className={styles.description}>{comparison.description}</p>
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
    </div>
  )
}
