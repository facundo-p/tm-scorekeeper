import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGlobalRecords } from '@/api/records'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import RecordStandingCard from '@/components/RecordStandingCard/RecordStandingCard'
import type { GlobalRecordDTO } from '@/types'
import styles from './Records.module.css'

export default function Records() {
  const [records, setRecords] = useState<GlobalRecordDTO[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGlobalRecords()
      .then(setRecords)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/home"><Button variant="ghost" size="sm">← Inicio</Button></Link>
        <h1 className={styles.title}>Records</h1>
      </header>

      <main className={styles.main}>
        {loading && <Spinner />}
        {!loading && records && records.length > 0 && (
          <div className={styles.list}>
            {records.map((r) => (
              r.record
                ? <RecordStandingCard key={r.code} description={r.description} record={r.record} />
                : <div key={r.code} className={styles.emptyRecord}>
                    <span className={styles.emptyDescription}>{r.description}</span>
                    <span className={styles.emptyValue}>Sin datos</span>
                  </div>
            ))}
          </div>
        )}
        {!loading && (!records || records.length === 0) && (
          <p className={styles.empty}>No hay records todavía.</p>
        )}
      </main>
    </div>
  )
}
