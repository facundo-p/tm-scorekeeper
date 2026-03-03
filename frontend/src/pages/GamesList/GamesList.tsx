import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { listGames } from '@/api/games'
import { getPlayers } from '@/api/players'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import { MapName } from '@/constants/enums'
import { calcRunningTotal } from '@/utils/gameCalculations'
import type { GameDTO, PlayerResponseDTO } from '@/types'
import styles from './GamesList.module.css'

interface Filters {
  map: string
  playerId: string
  playerCount: string
  dateFrom: string
  dateTo: string
}

function getWinner(game: GameDTO, playersMap: Map<string, string>): string {
  if (!game.player_results.length) return '—'
  const best = game.player_results.reduce((top, curr) =>
    calcRunningTotal(curr.scores) > calcRunningTotal(top.scores) ? curr : top
  )
  return playersMap.get(best.player_id) ?? best.player_id
}

function applyFilters(games: GameDTO[], players: PlayerResponseDTO[], filters: Filters): GameDTO[] {
  return games.filter((game) => {
    if (filters.map && game.map !== filters.map) return false
    if (filters.playerId && !game.player_results.some((r) => r.player_id === filters.playerId)) return false
    if (filters.playerCount && game.player_results.length !== Number(filters.playerCount)) return false
    if (filters.dateFrom && game.date < filters.dateFrom) return false
    if (filters.dateTo && game.date > filters.dateTo) return false
    return true
  })
}

export default function GamesList() {
  const [games, setGames] = useState<GameDTO[]>([])
  const [players, setPlayers] = useState<PlayerResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    map: '',
    playerId: '',
    playerCount: '',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    Promise.all([listGames(), getPlayers()])
      .then(([gamesData, playersData]) => {
        setGames(gamesData)
        setPlayers(playersData)
      })
      .catch(() => setError('No se pudieron cargar las partidas.'))
      .finally(() => setLoading(false))
  }, [])

  const playersMap = useMemo(
    () => new Map(players.map((p) => [p.player_id, p.name])),
    [players]
  )

  const filtered = useMemo(
    () => applyFilters(games, players, filters),
    [games, players, filters]
  )

  const setFilter = (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const clearFilters = () =>
    setFilters({ map: '', playerId: '', playerCount: '', dateFrom: '', dateTo: '' })

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/home"><Button variant="ghost" size="sm">← Inicio</Button></Link>
          <h1 className={styles.headerTitle}>Partidas</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowFilters((v) => !v)}>
          Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>
      </header>

      <main className={styles.main}>
        {showFilters && (
          <div className={styles.filtersBar}>
            <select className={styles.select} value={filters.map} onChange={setFilter('map')}>
              <option value="">Todos los mapas</option>
              {Object.values(MapName).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select className={styles.select} value={filters.playerId} onChange={setFilter('playerId')}>
              <option value="">Todos los jugadores</option>
              {players.map((p) => (
                <option key={p.player_id} value={p.player_id}>{p.name}</option>
              ))}
            </select>

            <select className={styles.select} value={filters.playerCount} onChange={setFilter('playerCount')}>
              <option value="">Cantidad de jugadores</option>
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} jugadores</option>
              ))}
            </select>

            <input
              type="date"
              className={styles.dateInput}
              value={filters.dateFrom}
              onChange={setFilter('dateFrom')}
            />
            <input
              type="date"
              className={styles.dateInput}
              value={filters.dateTo}
              onChange={setFilter('dateTo')}
            />

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>Limpiar</Button>
            )}
          </div>
        )}

        {loading && <Spinner />}
        {error && <p className={styles.errorBox}>{error}</p>}

        {!loading && !error && (
          <>
            <p className={styles.count}>{filtered.length} partida{filtered.length !== 1 ? 's' : ''}</p>

            {filtered.length === 0 ? (
              <p className={styles.empty}>No hay partidas que coincidan con los filtros.</p>
            ) : (
              <div className={styles.list}>
                <div className={styles.listHeader}>
                  <span>Fecha</span>
                  <span>Ganador</span>
                  <span>Mapa</span>
                  <span className={styles.alignCenter}>Jugadores</span>
                </div>
                {filtered.map((game) => (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    className={styles.row}
                  >
                    <span>{game.date}</span>
                    <span className={styles.winner}>{getWinner(game, playersMap)}</span>
                    <span>{game.map}</span>
                    <span className={styles.alignCenter}>{game.player_results.length}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
