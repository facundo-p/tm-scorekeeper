import Spinner from '@/components/Spinner/Spinner'
import type { GameResultDTO } from '@/types'
import { formatDate } from '@/utils/formatDate'
import styles from './EndOfGameSummaryModal.module.css'

interface ResultsSectionProps {
  result: GameResultDTO | null
  playerNames: Map<string, string>
}

export default function ResultsSection({ result, playerNames }: ResultsSectionProps) {
  if (!result) return <Spinner />

  return (
    <>
      <p className={styles.gameMeta}>{formatDate(result.date)}</p>
      <div className={styles.resultsList}>
        {result.results.map((r) => (
          <div
            key={r.player_id}
            className={[styles.resultRow, r.position === 1 ? styles.firstPlace : ''].join(' ')}
          >
            <span className={styles.position}>#{r.position}</span>
            <span className={styles.resultPlayerName}>
              {playerNames.get(r.player_id) ?? r.player_id}
            </span>
            <span className={styles.points}>{r.total_points} pts</span>
            <span className={styles.mc}>MC: {r.mc_total}</span>
          </div>
        ))}
      </div>
    </>
  )
}
