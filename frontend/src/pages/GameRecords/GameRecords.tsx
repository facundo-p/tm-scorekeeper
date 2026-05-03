import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGameRecords, getGameResults } from '@/api/games'
import { getPlayers } from '@/api/players'
import { ApiError } from '@/api/client'
import { useGames } from '@/hooks/useGames'
import Button from '@/components/Button/Button'
import EndOfGameSummaryModal from '@/components/EndOfGameSummaryModal/EndOfGameSummaryModal'
import type {
  RecordComparisonDTO,
  GameResultDTO,
  PlayerResponseDTO,
  AchievementsByPlayerDTO,
  EloChangeDTO,
} from '@/types'
import styles from './GameRecords.module.css'

export default function GameRecords() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [records, setRecords] = useState<RecordComparisonDTO[] | null>(null)
  const [result, setResult] = useState<GameResultDTO | null>(null)
  const [players, setPlayers] = useState<PlayerResponseDTO[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [notAvailable, setNotAvailable] = useState(false)
  const [achievements, setAchievements] = useState<AchievementsByPlayerDTO | null>(null)
  const [eloChanges, setEloChanges] = useState<EloChangeDTO[] | null>(null)
  // D-03: modal opens unconditionally on mount
  const [showModal, setShowModal] = useState(true)
  const { fetchAchievements, fetchEloChanges } = useGames()

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
      .catch(() => {})

    getPlayers()
      .then(setPlayers)
      .catch(() => {})

    fetchAchievements(gameId).then((data) => {
      if (data) setAchievements(data)
    })

    fetchEloChanges(gameId).then((data) => {
      // D-04 / D-10: hook returns null on retry exhaustion; null state → ELO section omitted
      setEloChanges(data)
    })
  }, [gameId])

  const playersMap = new Map(players.map((p) => [p.player_id, p.name]))

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.icon}>🏆</span>
          <h1 className={styles.title}>¡Partida guardada!</h1>
        </div>
        <div className={styles.actions}>
          <Button onClick={() => navigate('/home')}>Volver al inicio</Button>
        </div>
      </div>

      {showModal && (
        <EndOfGameSummaryModal
          result={result}
          records={records}
          loadingRecords={loadingRecords}
          notAvailable={notAvailable}
          achievements={achievements}
          eloChanges={eloChanges}
          playerNames={playersMap}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
