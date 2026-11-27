import { useMemo } from 'react'
import { cssVars } from '@/domain/cssVars'
import { Cube } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import type { ResultRow } from './types'
import styles from './instruments.module.css'

interface Placed { r: ResultRow; x: number; lane: number }

/** Cubos sobre una escala común de puntos; los que caen cerca se apilan en carriles. */
export function placeCubes(results: ResultRow[], min: number, max: number): Placed[] {
  const placed: Placed[] = []
  for (const r of results.slice().sort((a, b) => a.total - b.total)) {
    const x = ((Math.min(max, Math.max(min, r.total)) - min) / (max - min)) * 100
    placed.push({ r, x, lane: placed.filter((p) => Math.abs(p.x - x) < 3.2).length })
  }
  return placed
}

interface ScoreTrackProps { results: ResultRow[]; min?: number; max?: number; compact?: boolean }

/** Pista de puntaje: cubos de los jugadores sobre la escala 40..140. */
export function ScoreTrack({ results, min = 40, max = 140, compact }: ScoreTrackProps) {
  const cubes = useMemo(() => placeCubes(results, min, max), [results, min, max])
  const label = results.map((r) => `${r.player.name} ${r.total}`).join(', ')
  return (
    <div className={cx(styles.strack, compact && styles['strack--compact'])} role="img" aria-label={`Puntajes: ${label}`}>
      <div className={styles.strack__rail} aria-hidden="true">
        {[50, 75, 100, 125].map((t) => (
          <i key={t} className={styles.strack__tick} style={cssVars({ x: ((t - min) / (max - min)) * 100 })}><span>{t}</span></i>
        ))}
      </div>
      {cubes.map(({ r, x, lane }) => (
        <span key={r.player.id} className={cx(styles.strack__cube, r.position === 1 && styles['is-win'])} style={cssVars({ x: x.toFixed(2), lane })}
          data-tip={`${r.player.name}: ${r.total} pts`} aria-hidden="true">
          <Cube color={r.player.color} size={r.position === 1 ? 18 : 14} />
        </span>
      ))}
    </div>
  )
}
