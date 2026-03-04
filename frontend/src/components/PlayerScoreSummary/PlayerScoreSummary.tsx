import { calcRunningTotal, type PartialScores } from '@/utils/gameCalculations'
import styles from './PlayerScoreSummary.module.css'

interface PlayerEntry {
  player_id: string
  name: string
  scores: PartialScores
}

interface PlayerScoreSummaryProps {
  players: PlayerEntry[]
}

export default function PlayerScoreSummary({ players }: PlayerScoreSummaryProps) {
  if (players.length === 0) return null

  return (
    <div className={styles.container}>
      <p className={styles.title}>Puntos acumulados</p>
      <div className={styles.players}>
        {players.map((p) => (
          <div key={p.player_id} className={styles.player}>
            <span className={styles.playerName}>{p.name}</span>
            <span className={styles.playerScore}>{calcRunningTotal(p.scores)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
