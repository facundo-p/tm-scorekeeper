import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEloHistory } from '@/api/elo'
import { usePlayers } from '@/hooks/usePlayers'
import { useRankingFilters } from '@/hooks/useRankingFilters'
import { applyRankingFilters } from '@/utils/rankingFilters'
import RankingFilters from '@/components/RankingFilters/RankingFilters'
import Button from '@/components/Button/Button'
import Spinner from '@/components/Spinner/Spinner'
import type { PlayerEloHistoryDTO } from '@/types'
import styles from './Ranking.module.css'

function renderError(onRetry: () => void) {
  return (
    <div className={styles.errorBox}>
      <p>No se pudo cargar el ranking.</p>
      <Button onClick={onRetry}>Reintentar</Button>
    </div>
  )
}

function renderEmptyState(kind: 'no-players' | 'no-data', onClear: () => void) {
  const message =
    kind === 'no-players'
      ? 'Selecciona al menos un jugador'
      : 'Sin partidas en este rango'
  return (
    <div className={styles.emptyState}>
      <h2 className={styles.emptyHeading}>{message}</h2>
      <p className={styles.emptyBody}>
        {kind === 'no-players'
          ? 'Usá los filtros para elegir jugadores.'
          : 'Probá ampliar el rango de fechas.'}
      </p>
      <Button variant="ghost" onClick={onClear}>Limpiar filtros</Button>
    </div>
  )
}

function renderChartSkeleton() {
  return (
    <div className={styles.chartSkeleton} data-testid="chart-skeleton">
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
    </div>
  )
}

export default function Ranking() {
  const {
    players: allPlayers,
    loading: playersLoading,
    error: playersError,
    refetch: refetchPlayers,
  } = usePlayers({ activeOnly: true })

  const activePlayerIds = useMemo<string[] | null>(
    () => (playersLoading ? null : allPlayers.map((p) => p.player_id)),
    [allPlayers, playersLoading],
  )

  const activePlayersOptions = useMemo(
    () => allPlayers.map((p) => ({ value: p.player_id, label: p.name })),
    [allPlayers],
  )

  const { players: selectedPlayers, fromDate, setPlayers, setFromDate, clearAll } =
    useRankingFilters(activePlayerIds)

  const [dataset, setDataset] = useState<PlayerEloHistoryDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // `cancelled` guard prevents setState calls after the component has
    // unmounted (or after `retryCount` bumps and a newer fetch is in flight).
    // Without it, a slow request that resolves post-unmount would emit a
    // React warning and overwrite state from the newer request.
    let cancelled = false
    setLoading(true)
    setError(null)
    getEloHistory()
      .then((data) => { if (!cancelled) setDataset(data) })
      .catch(() => { if (!cancelled) setError('No se pudo cargar el ranking.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [retryCount])

  const filtered = useMemo(
    () => applyRankingFilters(dataset, selectedPlayers, fromDate),
    [dataset, selectedPlayers, fromDate],
  )

  const totalPoints = useMemo(
    () => filtered.reduce((sum, p) => sum + p.points.length, 0),
    [filtered],
  )

  const isLoading = playersLoading || loading
  const hasError = !!(playersError || error)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/">
          <Button variant="ghost" size="sm">← Inicio</Button>
        </Link>
        <h1 className={styles.headerTitle}>Ranking</h1>
      </header>

      <main className={styles.main}>
        {isLoading && <Spinner />}
        {!isLoading && hasError && renderError(() => {
          if (playersError) refetchPlayers()
          setRetryCount((c) => c + 1)
        })}
        {!isLoading && !hasError && (
          <>
            <RankingFilters
              players={selectedPlayers}
              fromDate={fromDate}
              activePlayersOptions={activePlayersOptions}
              onPlayersChange={setPlayers}
              onFromDateChange={setFromDate}
              onClear={clearAll}
            />
            {selectedPlayers.length === 0
              ? renderEmptyState('no-players', clearAll)
              : totalPoints === 0
              ? renderEmptyState('no-data', clearAll)
              : renderChartSkeleton()}
          </>
        )}
      </main>
    </div>
  )
}
