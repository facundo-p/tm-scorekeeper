import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cube } from './Cube'
import type { PlayerLike, Size } from './types'
import { cx } from '../cx'
import styles from './PlayerTag.module.css'

const CUBE_SIZE: Record<Size, number> = { s: 13, m: 16, l: 22 }

/** Ruta del perfil de un jugador (D-02). */
export const profilePath = (id: string) => `/jugadores/${encodeURIComponent(id)}`

interface PlayerTagProps {
  player?: PlayerLike | null
  size?: Size
  sub?: ReactNode
  link?: boolean
}

/** Cubo y nombre del jugador; por defecto abre su perfil. */
export function PlayerTag({ player, size = 'm', sub, link = true }: PlayerTagProps) {
  const navigate = useNavigate()
  if (!player) return null
  const className = cx(styles.ptag, styles[`ptag--${size}`])
  const body = (
    <>
      <Cube color={player.color} size={CUBE_SIZE[size]} />
      <span className={styles.ptag__name}>{player.name}</span>
      {sub != null && <span className={styles.ptag__sub}>{sub}</span>}
    </>
  )
  if (!link) return <span className={className}>{body}</span>
  return (
    <button type="button" className={cx(className, styles['ptag--link'])} onClick={() => navigate(profilePath(player.id))}>
      {body}
    </button>
  )
}
