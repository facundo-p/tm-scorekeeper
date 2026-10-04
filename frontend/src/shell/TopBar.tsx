import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCurrentSeason, useFeed, usePlayersList } from '@/data/hooks'
import type { FeedItem } from '@/data/types'
import { cssVars } from '@/domain/cssVars'
import { Cube } from '@/ui/atoms'
import { Icon } from '@/ui/icons'
import { reducedMotion } from '@/ui/motion'
import { PATHS } from './paths'
import { Wordmark } from './Wordmark'
import styles from './Chrome.module.css'

const TICKER_ITEMS = 8
const TICKER_MS = 6500

/** Rota cada pocos segundos (quieto con movimiento reducido, D-11). */
function useRotation(count: number) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reducedMotion() || count < 2) return undefined
    const t = window.setInterval(() => setI((x) => (x + 1) % count), TICKER_MS)
    return () => window.clearInterval(t)
  }, [count])
  return count ? i % count : 0
}

/** Transmisión: lo último de la bitácora (sin las partidas comunes). */
function Ticker() {
  const navigate = useNavigate()
  const { feed } = useFeed()
  const { players } = usePlayersList()
  const items = useMemo<FeedItem[]>(() => (feed ?? []).filter((f) => f.type !== 'game').slice(0, TICKER_ITEMS), [feed])
  const i = useRotation(items.length)
  const item = items[i]
  const color = players?.find((p) => p.player_id === item?.player_id)?.color
  return (
    <button type="button" className={styles.ticker} aria-live="polite" title="Ver la partida"
      onClick={() => item?.game_id && navigate(PATHS.game(item.game_id))}>
      <span className={styles.ticker__rec} aria-hidden="true" />
      <span className={styles.ticker__label}>Transmisión</span>
      {item && <span className={styles.ticker__msg} key={i}>{color && <Cube color={color} size={13} />}{item.text}</span>}
    </button>
  )
}

/** Progreso de la temporada en curso. */
function SeasonChip() {
  const navigate = useNavigate()
  const { season } = useCurrentSeason()
  if (!season) return null
  return (
    <button type="button" className={styles['season-chip']} onClick={() => navigate(PATHS.home)} title="Progreso de la temporada">
      <span className={styles['season-chip__ring']} style={cssVars({ pct: (season.pct * 100).toFixed(1) })} aria-hidden="true" />
      <span>
        <span className={styles['season-chip__t']}>Temporada {season.number}</span>
        <span className={styles['season-chip__v']}>{Math.round(season.pct * 100)} % terraformado</span>
      </span>
    </button>
  )
}

/** Barra superior: marca, transmisión, temporada y salir (en el teléfono). */
export function TopBar({ onExit }: { onExit: () => void }) {
  return (
    <header className={styles.topbar}>
      <Link to={PATHS.home} className={styles.topbar__brand} aria-label="Inicio"><Wordmark /></Link>
      <Ticker />
      <div className={styles.topbar__aside}>
        <SeasonChip />
        <Link to={PATHS.login} className={styles.topbar__exit} aria-label="Salir" onClick={onExit}>
          <Icon name="power" size={18} />
        </Link>
      </div>
    </header>
  )
}
