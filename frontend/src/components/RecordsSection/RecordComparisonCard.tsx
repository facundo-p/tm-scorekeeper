import type { RecordComparisonDTO, RecordResultDTO } from '@/types'
import styles from './RecordsSection.module.css'

function ResultRow({ label, result }: { label: string; result: RecordResultDTO }) {
  return (
    <div className={styles.resultRow}>
      <span className={styles.resultLabel}>{label}</span>
      <span className={styles.resultValue}>{result.value} pts</span>
      {result.attributes.map((attr) => (
        <span key={attr.label} className={styles.resultAttr}>
          <span className={styles.attrLabel}>{attr.label}:</span> {attr.value}
        </span>
      ))}
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
            <ResultRow label="Nuevo" result={comparison.current} />
            {comparison.compared && <ResultRow label="Anterior" result={comparison.compared} />}
          </>
        ) : (
          <>
            <ResultRow label="Esta partida" result={comparison.compared!} />
            <ResultRow label="Record vigente" result={comparison.current} />
          </>
        )}
      </div>
    </div>
  )
}
