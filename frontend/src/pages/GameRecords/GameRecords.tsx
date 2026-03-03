import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGameRecords } from '@/api/games'
import { ApiError } from '@/api/client'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import type { GameRecordsDTO } from '@/types'
import styles from './GameRecords.module.css'

export default function GameRecords() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [records, setRecords] = useState<GameRecordsDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    if (!gameId) return
    getGameRecords(gameId)
      .then(setRecords)
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
          <p className={styles.subtitle}>Partida #{gameId}</p>
        </div>

        {loading && <Spinner />}

        {!loading && notAvailable && (
          <div className={styles.placeholder}>
            <p>Los records de esta partida estarán disponibles próximamente.</p>
          </div>
        )}

        {!loading && records && (
          <>
            {records.records.length === 0 ? (
              <div className={styles.placeholder}>
                <p>No se superaron records en esta partida.</p>
              </div>
            ) : (
              <div className={styles.list}>
                {records.records.map((record, i) => (
                  <div
                    key={i}
                    className={[styles.recordItem, record.is_new_record ? styles.newRecord : ''].join(' ')}
                  >
                    <div>
                      <p className={styles.recordType}>{record.type}</p>
                      <p className={styles.recordValue}>{record.value}</p>
                    </div>
                    {record.is_new_record && <span className={styles.newBadge}>¡Nuevo Record!</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className={styles.actions}>
          <Button onClick={() => navigate('/home')}>Volver al inicio</Button>
        </div>
      </div>
    </div>
  )
}
