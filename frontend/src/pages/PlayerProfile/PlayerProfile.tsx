import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPlayerProfile, getPlayers } from '@/api/players'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import type { PlayerProfileDTO } from '@/types'
import styles from './PlayerProfile.module.css'

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>()
  const [profile, setProfile] = useState<PlayerProfileDTO | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!playerId) return
    Promise.all([getPlayerProfile(playerId), getPlayers()])
      .then(([profileData, playersData]) => {
        setProfile(profileData)
        const found = playersData.find((p) => p.player_id === playerId)
        setPlayerName(found?.name ?? playerId)
      })
      .catch(() => setError('No se pudo cargar el perfil del jugador.'))
      .finally(() => setLoading(false))
  }, [playerId])

  const activeRecords = profile
    ? Object.entries(profile.records).filter(([, holds]) => holds)
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

      <main className={styles.main}>
        {loading && <Spinner />}
        {error && <p className={styles.errorBox}>{error}</p>}

        {!loading && profile && (
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

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Records actuales</h2>
              {activeRecords.length === 0 ? (
                <p className={styles.empty}>Este jugador no sostiene ningún record actualmente.</p>
              ) : (
                <div className={styles.recordList}>
                  {activeRecords.map(([type]) => (
                    <div key={type} className={styles.recordItem}>
                      <span className={styles.recordIcon}>🏅</span>
                      <span className={styles.recordType}>{type}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
