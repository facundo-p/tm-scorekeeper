import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAchievementsCatalog } from '@/api/achievements'
import AchievementIcon from '@/components/AchievementIcon/AchievementIcon'
import Modal from '@/components/Modal/Modal'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import type { AchievementCatalogItemDTO } from '@/types'
import styles from './AchievementCatalog.module.css'

function getMaxHolderTier(item: AchievementCatalogItemDTO): number {
  if (item.holders.length === 0) return 0
  return Math.max(...item.holders.map(h => h.tier))
}

function getTierTitle(item: AchievementCatalogItemDTO, level: number): string {
  return item.tiers.find(t => t.level === level)?.title ?? ''
}

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
              const maxTier = getMaxHolderTier(item)
              const unlocked = maxTier > 0
              const tierTitle = unlocked ? getTierTitle(item, maxTier) : null

              return (
                <div
                  key={item.code}
                  className={styles.catalogItem}
                  onClick={() => setSelectedAchievement(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedAchievement(item) }}
                >
                  <AchievementIcon fallback_icon={item.fallback_icon} size={20} unlocked={unlocked} />
                  <div className={styles.catalogInfo}>
                    <span className={styles.catalogTitle}>{item.description}</span>
                    {unlocked && tierTitle && (
                      <span className={styles.catalogTier}>
                        Nivel {maxTier}: {tierTitle}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {selectedAchievement && (
        <Modal title={selectedAchievement.description} onClose={() => setSelectedAchievement(null)}>
          <CatalogDetail item={selectedAchievement} />
        </Modal>
      )}
    </div>
  )
}

function CatalogDetail({ item }: { item: AchievementCatalogItemDTO }) {
  const hasSingleTier = item.tiers.length === 1

  if (hasSingleTier) {
    return <SingleTierDetail item={item} />
  }

  return <MultiTierDetail item={item} />
}

function SingleTierDetail({ item }: { item: AchievementCatalogItemDTO }) {
  const holders = item.holders.filter(h => h.tier >= 1)

  return (
    <div className={styles.detailContent}>
      {holders.length === 0 ? (
        <p className={styles.noHolders}>Ningun jugador ha desbloqueado este logro todavia.</p>
      ) : (
        <div className={styles.holdersList}>
          {holders.map(h => (
            <div key={h.player_id} className={styles.holderRow}>
              <span className={styles.holderName}>{h.player_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MultiTierDetail({ item }: { item: AchievementCatalogItemDTO }) {
  const hasAnyHolder = item.holders.length > 0

  return (
    <div className={styles.detailContent}>
      {!hasAnyHolder && (
        <p className={styles.noHolders}>Ningun jugador ha desbloqueado este logro todavia.</p>
      )}
      {item.tiers.map(tier => {
        const holdersAtTier = item.holders.filter(h => h.tier === tier.level)
        const unlocked = item.holders.some(h => h.tier >= tier.level)

        return (
          <div key={tier.level} className={`${styles.tierBlock} ${unlocked ? styles.tierUnlocked : styles.tierLocked}`}>
            <div className={styles.tierHeader}>
              <span className={styles.tierLevel}>Nivel {tier.level}</span>
              <span className={styles.tierTitle}>{tier.title}</span>
              <span className={styles.tierThreshold}>{tier.threshold}</span>
            </div>
            {holdersAtTier.length > 0 && (
              <div className={styles.tierHolders}>
                {holdersAtTier.map(h => (
                  <span key={h.player_id} className={styles.tierHolderName}>{h.player_name}</span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
