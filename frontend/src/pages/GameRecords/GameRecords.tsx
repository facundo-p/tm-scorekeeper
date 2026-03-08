import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGameRecords, getGameResults } from '@/api/games'
import { getPlayers } from '@/api/players'
import { ApiError } from '@/api/client'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import RecordsSection from '@/components/RecordsSection/RecordsSection'
import type { RecordComparisonDTO, GameResultDTO, PlayerResponseDTO } from '@/types'
import { formatDate } from '@/utils/formatDate'
import styles from './GameRecords.module.css'

export default function GameRecords() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [records, setRecords] = useState<RecordComparisonDTO[] | null>(null)
  const [result, setResult] = useState<GameResultDTO | null>(null)
  const [players, setPlayers] = useState<PlayerResponseDTO[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [loadingResults, setLoadingResults] = useState(true)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    if (!gameId) return

    getGameRecords(gameId)
      .then(setRecords)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotAvailable(true)
        else setNotAvailable(true)
      })
      .finally(() => setLoadingRecords(false))

    getGameResults(gameId)
      .then(setResult)
      .finally(() => setLoadingResults(false))

    getPlayers()
      .then(setPlayers)
      .catch(() => {})
  }, [gameId])

  const playersMap = new Map(players.map((p) => [p.player_id, p.name]))

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.icon}>🏆</span>
          <h1 className={styles.title}>¡Partida guardada!</h1>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Resultados</h2>
          {loadingResults && <Spinner />}
          {!loadingResults && result && (
            <>
              <p className={styles.gameMeta}>{formatDate(result.date)}</p>
              <div className={styles.rankingList}>
                {result.results.map((r) => (
                  <div
                    key={r.player_id}
                    className={[styles.rankRow, r.position === 1 ? styles.firstPlace : ''].join(' ')}
                  >
                    <span className={styles.position}>#{r.position}</span>
                    <span className={styles.playerName}>
                      {playersMap.get(r.player_id) ?? r.player_id}
                    </span>
                    <span className={styles.points}>{r.total_points} pts</span>
                    <span className={styles.mc}>MC: {r.mc_total}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Records</h2>
          <RecordsSection records={records} loading={loadingRecords} notAvailable={notAvailable} />
        </section>

        <div className={styles.actions}>
          <Button onClick={() => navigate('/home')}>Volver al inicio</Button>
        </div>
      </div>
    </div>
  )
}
