import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGameResults, getGameRecords } from '@/api/games'
import { getPlayers } from '@/api/players'
import { ApiError } from '@/api/client'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import RecordsSection from '@/components/RecordsSection/RecordsSection'
import type { GameResultDTO, RecordComparisonDTO, PlayerResponseDTO } from '@/types'
import { formatDate } from '@/utils/formatDate'
import styles from './GameDetail.module.css'

export default function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>()
  const [result, setResult] = useState<GameResultDTO | null>(null)
  const [records, setRecords] = useState<RecordComparisonDTO[] | null>(null)
  const [players, setPlayers] = useState<PlayerResponseDTO[]>([])
  const [loadingResults, setLoadingResults] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [recordsUnavailable, setRecordsUnavailable] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!gameId) return

    getGameResults(gameId)
      .then(setResult)
      .catch(() => setError('No se pudo cargar el detalle de la partida.'))
      .finally(() => setLoadingResults(false))

    getGameRecords(gameId)
      .then(setRecords)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setRecordsUnavailable(true)
        else setRecordsUnavailable(true)
      })
      .finally(() => setLoadingRecords(false))

    getPlayers()
      .then(setPlayers)
      .catch(() => {})
  }, [gameId])

  const playersMap = new Map(players.map((p) => [p.player_id, p.name]))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/games"><Button variant="ghost" size="sm">← Partidas</Button></Link>
        <h1 className={styles.headerTitle}>Detalle de partida</h1>
      </header>

      <main className={styles.main}>
        {error && <p className={styles.errorBox}>{error}</p>}

        <section className={styles.card}>
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

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Records</h2>
          <RecordsSection
            records={records}
            loading={loadingRecords}
            notAvailable={recordsUnavailable}
          />
        </section>
      </main>
    </div>
  )
}
