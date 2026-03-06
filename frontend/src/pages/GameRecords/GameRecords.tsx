import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGameRecords } from '@/api/games'
import { ApiError } from '@/api/client'
import Button from '@/components/Button/Button'
import RecordsSection from '@/components/RecordsSection/RecordsSection'
import type { GameRecordItemDTO } from '@/types'
import styles from './GameRecords.module.css'

export default function GameRecords() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [records, setRecords] = useState<GameRecordItemDTO[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    if (!gameId) return
    getGameRecords(gameId)
      .then((data) => setRecords(data.records))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotAvailable(true)
        else setNotAvailable(true)
      })
      .finally(() => setLoading(false))
  }, [gameId])

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.icon}>🏆</span>
          <h1 className={styles.title}>¡Partida guardada!</h1>
        </div>

        <RecordsSection records={records} loading={loading} notAvailable={notAvailable} />

        <div className={styles.actions}>
          <Button onClick={() => navigate('/home')}>Volver al inicio</Button>
        </div>
      </div>
    </div>
  )
}
