import type { PlayerEloHistoryDTO } from '@/types'
import styles from './EloLeaderboard.module.css'

interface EloLeaderboardProps {
  data: PlayerEloHistoryDTO[]
}

interface LeaderboardRow {
  position: number
  player_id: string
  player_name: string
  current_elo: number
  last_delta: number
}

// Sort player.points by recorded_at ascending so "last point" = newest game.
// String comparison is correct for YYYY-MM-DD (Pitfall 1).
function lastPointByDate(player: PlayerEloHistoryDTO) {
  if (player.points.length === 0) return null
  const sorted = [...player.points].sort((a, b) =>
    a.recorded_at < b.recorded_at ? -1 : a.recorded_at > b.recorded_at ? 1 : 0,
  )
  return sorted[sorted.length - 1]
}

// Pure ranking. ELO descending; tiebreaker by player_name ascending (D-09).
// Players with zero points are excluded — they have no current ELO.
function buildLeaderboardRows(data: PlayerEloHistoryDTO[]): LeaderboardRow[] {
  const withScores = data
    .map((player) => {
      const last = lastPointByDate(player)
      if (!last) return null
      return {
        player_id: player.player_id,
        player_name: player.player_name,
        current_elo: last.elo_after,
        last_delta: last.delta,
      }
    })
    .filter((r): r is Omit<LeaderboardRow, 'position'> => r !== null)

  withScores.sort((a, b) => {
    if (b.current_elo !== a.current_elo) return b.current_elo - a.current_elo
    return a.player_name.localeCompare(b.player_name)
  })

  return withScores.map((r, idx) => ({ ...r, position: idx + 1 }))
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

export default function EloLeaderboard({ data }: EloLeaderboardProps) {
  if (data.length === 0) return null

  const rows = buildLeaderboardRows(data)
  if (rows.length === 0) return null

  return (
    <section className={styles.container} aria-label="Leaderboard de ELO">
      <table className={styles.table}>
        <caption className={styles.caption}>Ranking</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.colPosition}>Posición</th>
            <th scope="col" className={styles.colPlayer}>Jugador</th>
            <th scope="col" className={styles.colElo}>ELO actual</th>
            <th scope="col" className={styles.colDelta}>Última delta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.player_id} className={styles.row}>
              <td className={styles.cellPosition}>{row.position}</td>
              <td className={styles.cellPlayer}>{row.player_name}</td>
              <td className={styles.cellElo}>{row.current_elo}</td>
              <td className={`${styles.cellDelta} ${deltaClass(row.last_delta)}`}>
                {formatDelta(row.last_delta)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
