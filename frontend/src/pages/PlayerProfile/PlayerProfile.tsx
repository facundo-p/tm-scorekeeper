import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPlayerProfile, getPlayers } from '@/api/players'
import { getPlayerAchievements } from '@/api/achievements'
import { getEloSummary, getEloHistory } from '@/api/elo'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import TabBar from '@/components/TabBar/TabBar'
import AchievementCard from '@/components/AchievementCard/AchievementCard'
import EloSummaryCard from '@/components/EloSummaryCard/EloSummaryCard'
import type { Tab } from '@/components/TabBar/TabBar'
import type { PlayerProfileDTO, PlayerAchievementDTO, PlayerEloSummaryDTO, PlayerEloHistoryDTO } from '@/types'
import styles from './PlayerProfile.module.css'

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>()
  const [profile, setProfile] = useState<PlayerProfileDTO | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [eloSummary, setEloSummary] = useState<PlayerEloSummaryDTO | null>(null)
  const [eloHistory, setEloHistory] = useState<PlayerEloHistoryDTO[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<Tab>('stats')
  const [achievements, setAchievements] = useState<PlayerAchievementDTO[] | null>(null)
  const [loadingAchievements, setLoadingAchievements] = useState(false)
  const [achievementsError, setAchievementsError] = useState('')

  useEffect(() => {
    if (!playerId) return
    // Profile + players are critical: failure shows the page-level error box.
    // Summary is optional (D-14): isolated catch returns null on any failure
    // so the card is hidden but the rest of the profile still renders.
    const profilePromise = Promise.all([getPlayerProfile(playerId), getPlayers()])
    const summaryPromise = getEloSummary(playerId).catch(() => null)

    Promise.all([profilePromise, summaryPromise])
      .then(([[profileData, playersData], summaryData]) => {
        setProfile(profileData)
        const found = playersData.find((p) => p.player_id === playerId)
        setPlayerName(found?.name ?? playerId)
        setEloSummary(summaryData)
      })
      .catch(() => setError('No se pudo cargar el perfil del jugador.'))
      .finally(() => setLoading(false))
  }, [playerId])

  // D-09: isolated catch — history fetch failure must not break the profile.
  // D-05: eager fetch on mount (small dataset, single player). On failure
  // eloHistory stays null and EloSummaryCard simply omits the chart.
  useEffect(() => {
    if (!playerId) return
    let cancelled = false
    getEloHistory({ playerIds: [playerId] })
      .then((data) => { if (!cancelled) setEloHistory(data) })
      .catch(() => { if (!cancelled) setEloHistory(null) })
    return () => { cancelled = true }
  }, [playerId])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'logros' && achievements === null && !loadingAchievements) {
      setLoadingAchievements(true)
      getPlayerAchievements(playerId!)
        .then(res => setAchievements(res.achievements))
        .catch(() => setAchievementsError('No se pudo cargar los logros. Intentá de nuevo.'))
        .finally(() => setLoadingAchievements(false))
    }
  }

  const activeRecords = profile
    ? Object.entries(profile.records).filter(([, holds]) => holds)
    : []

  const sortedAchievements = achievements
    ? [...achievements].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0))
    : []

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/players">
          <Button variant="ghost" size="sm">← Jugadores</Button>
        </Link>
        <h1 className={styles.headerTitle}>
          {playerName || 'Perfil'}
        </h1>
      </header>

      <div className={styles.tabBarWrapper}>
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      <main className={styles.main}>
        {loading && <Spinner />}
        {error && <p className={styles.errorBox}>{error}</p>}

        {!loading && profile && (
          <>
            {activeTab === 'stats' && (
              <>
                <section className={styles.statsCard}>
                  <h2 className={styles.sectionTitle}>Estadísticas</h2>
                  <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{profile.stats.games_played}</span>
                      <span className={styles.statLabel}>Partidas jugadas</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{profile.stats.games_won}</span>
                      <span className={styles.statLabel}>Partidas ganadas</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>
                        {(profile.stats.win_rate * 100).toFixed(0)}%
                      </span>
                      <span className={styles.statLabel}>Win rate</span>
                    </div>
                  </div>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Historial de partidas</h2>
                  {profile.games.length === 0 ? (
                    <p className={styles.empty}>Todavía no hay partidas registradas.</p>
                  ) : (
                    <div className={styles.gameList}>
                      {profile.games.map((game) => (
                        <Link
                          key={game.game_id}
                          to={`/games/${game.game_id}`}
                          className={styles.gameRow}
                        >
                          <span className={styles.gameDate}>{game.date}</span>
                          <span className={[styles.gamePosition, game.position === 1 ? styles.winner : ''].join(' ')}>
                            #{game.position}
                          </span>
                          <span className={styles.gamePoints}>{game.points} pts</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                {eloSummary && (
                  <EloSummaryCard
                    summary={eloSummary}
                    history={eloHistory ?? undefined}
                  />
                )}
              </>
            )}

            {activeTab === 'records' && (
              <>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Records actuales</h2>
                  {activeRecords.length === 0 ? (
                    <p className={styles.empty}>Este jugador no sostiene ningún record actualmente.</p>
                  ) : (
                    <div className={styles.recordList}>
                      {activeRecords.map(([type]) => (
                        <div key={type} className={styles.recordItem}>
                          <span className={styles.recordIcon}>🏅</span>
                          <span className={styles.recordType}>
                            {type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {activeTab === 'logros' && (
              <>
                {loadingAchievements && <Spinner />}
                {achievementsError && <p className={styles.errorBox}>{achievementsError}</p>}
                {!loadingAchievements && !achievementsError && achievements !== null && (
                  achievements.length === 0 ? (
                    <div className={styles.emptyState}>
                      <h2 className={styles.emptyHeading}>Sin logros todavía</h2>
                      <p className={styles.emptyBody}>Jugá más partidas para desbloquear logros.</p>
                    </div>
                  ) : (
                    <div className={styles.achievementList}>
                      {sortedAchievements.map(ach => (
                        <AchievementCard
                          key={ach.code}
                          title={ach.title}
                          description={ach.description}
                          fallback_icon={ach.fallback_icon}
                          tier={ach.tier}
                          unlocked={ach.unlocked}
                          progress={ach.progress}
                        />
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
