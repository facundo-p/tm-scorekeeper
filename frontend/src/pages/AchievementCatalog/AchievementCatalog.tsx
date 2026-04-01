import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAchievementsCatalog } from '@/api/achievements'
import AchievementCard from '@/components/AchievementCard/AchievementCard'
import Modal from '@/components/Modal/Modal'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import { formatDate } from '@/utils/formatDate'
import type { AchievementCatalogItemDTO } from '@/types'
import styles from './AchievementCatalog.module.css'

export default function AchievementCatalog() {
  const [catalog, setCatalog] = useState<AchievementCatalogItemDTO[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementCatalogItemDTO | null>(null)

  useEffect(() => {
    getAchievementsCatalog()
      .then(res => setCatalog(res.achievements))
      .catch(() => setError('No se pudo cargar el catalogo. Intenta de nuevo.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/home">
          <Button variant="ghost" size="sm">← Inicio</Button>
        </Link>
        <h1 className={styles.headerTitle}>Catalogo de logros</h1>
      </header>
      <main className={styles.main}>
        {loading && <Spinner />}
        {error && <p className={styles.errorBox}>{error}</p>}
        {!loading && catalog && catalog.length === 0 && (
          <p className={styles.empty}>No hay logros disponibles.</p>
        )}
        {!loading && catalog && catalog.length > 0 && (
          <div className={styles.achievementList}>
            {catalog.map(item => {
              const maxTier = item.holders.length > 0
                ? Math.max(...item.holders.map(h => h.tier))
                : 0
              const holderCount = item.holders.length
              return (
                <div
                  key={item.code}
                  className={styles.catalogItem}
                  onClick={() => setSelectedAchievement(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedAchievement(item) }}
                >
                  <AchievementCard
                    title={item.title}
                    description={item.description}
                    fallback_icon={item.fallback_icon}
                    tier={maxTier}
                    max_tier={item.tiers.length}
                    unlocked={maxTier > 0}
                    progress={null}
                  />
                  <div className={styles.holdersInfo}>
                    {holderCount > 0
                      ? `NIVEL ${maxTier} — ${holderCount} ${holderCount === 1 ? 'jugador' : 'jugadores'}`
                      : 'Sin desbloquear'
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {selectedAchievement && (
        <Modal title={selectedAchievement.title} onClose={() => setSelectedAchievement(null)}>
          <p className={styles.holdersSubtitle}>
            {selectedAchievement.holders.length === 0
              ? 'Ningun jugador ha desbloqueado este logro todavia.'
              : selectedAchievement.holders.length === 1
                ? '1 jugador tiene este logro'
                : `${selectedAchievement.holders.length} jugadores tienen este logro`
            }
          </p>
          {selectedAchievement.holders.length > 0 && (
            <div className={styles.holdersList}>
              {selectedAchievement.holders.map(holder => (
                <div key={holder.player_id} className={styles.holderRow}>
                  <span className={styles.holderName}>{holder.player_name}</span>
                  <span className={styles.holderTier}>Nivel {holder.tier}</span>
                  <span className={styles.holderDate}>{formatDate(holder.unlocked_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
