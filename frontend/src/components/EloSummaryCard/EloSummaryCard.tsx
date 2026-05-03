import type { PlayerEloSummaryDTO, PlayerEloHistoryDTO } from '@/types'
import EloLineChart from '@/components/EloLineChart/EloLineChart'
import styles from './EloSummaryCard.module.css'

interface EloSummaryCardProps {
  summary: PlayerEloSummaryDTO
  history?: PlayerEloHistoryDTO[]
}

function formatDelta(d: number): string {
  if (d > 0) return `+${d}`
  if (d < 0) return `${d}`
  return '±0'
}

function deltaClass(d: number): string {
  if (d > 0) return styles.deltaPositive
  if (d < 0) return styles.deltaNegative
  return styles.deltaZero
}

export default function EloSummaryCard({ summary, history }: EloSummaryCardProps) {
  const hasGames = summary.last_delta !== null
  const showSubRow = summary.peak_elo !== null || summary.rank !== null

  return (
    <section className={styles.card} aria-label="Resumen de ELO">
      <div className={styles.heroRow}>
        <span className={styles.heroValue}>
          {hasGames ? summary.current_elo : '—'}
        </span>
        <span className={styles.heroLabel}>ELO</span>
        {summary.last_delta !== null && (
          <span
            className={deltaClass(summary.last_delta)}
            aria-label={`Cambio de ELO en la última partida: ${formatDelta(summary.last_delta)}`}
          >
            {formatDelta(summary.last_delta)}
          </span>
        )}
      </div>
      {showSubRow && (
        <div className={styles.subRow}>
          {summary.peak_elo !== null && (
            <span className={styles.peak}>
              Pico: {summary.peak_elo}
              {summary.peak_elo === summary.current_elo && ' · actual'}
            </span>
          )}
          {summary.rank !== null && (
            <span className={styles.rank}>
              #{summary.rank.position} de {summary.rank.total}
            </span>
          )}
        </div>
      )}
      {history && history.some((p) => p.points.length > 0) && (
        <div className={styles.chartArea}>
          <EloLineChart data={history} showLegend={false} />
        </div>
      )}
    </section>
  )
}
