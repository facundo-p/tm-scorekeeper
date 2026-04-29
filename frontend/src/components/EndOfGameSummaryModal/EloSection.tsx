import Spinner from '@/components/Spinner/Spinner'
import type { GameResultDTO, EloChangeDTO } from '@/types'
import styles from './EndOfGameSummaryModal.module.css'

interface EloSectionProps {
  eloChanges: EloChangeDTO[] | null
  result: GameResultDTO | null
}

function formatDelta(d: number): string {
  if (d > 0) return `+${d}`
  if (d < 0) return `${d}`
  return '±0'
}

function deltaClass(d: number): string {
  if (d > 0) return styles.deltaPositive
  if (d < 0) return styles.deltaNegative
  return styles.deltaZero
}

export default function EloSection({ eloChanges, result }: EloSectionProps) {
  // D-04 / must_haves truth: eloChanges === null means either still loading or fetch failed.
  // In both cases omit the section entirely (no heading, no spinner) — silent omission.
  if (eloChanges === null) return null

  // Pitfall 5: backend can return [] for legacy games — omit section entirely
  if (eloChanges.length === 0) return null

  // result is still loading — show heading + spinner while we wait for the join data
  if (result === null) {
    return (
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>ELO</h3>
        <Spinner />
      </section>
    )
  }

  const eloByPlayerId = new Map(eloChanges.map((e) => [e.player_id, e]))

  return (
    <section className={styles.section} aria-label="Cambios de ELO">
      <h3 className={styles.sectionTitle}>ELO</h3>
      <div className={styles.eloList}>
        {result.results.map((r) => {
          const elo = eloByPlayerId.get(r.player_id)
          return (
            <div key={r.player_id} className={styles.eloRow}>
              <span className={styles.position} aria-label={`Posición ${r.position}`}>
                #{r.position}
              </span>
              <span className={styles.eloPlayerName}>
                {elo?.player_name ?? r.player_id}
              </span>
              <span className={styles.eloPair}>
                {elo ? `${elo.elo_before} → ${elo.elo_after}` : '—'}
              </span>
              {elo ? (
                <span
                  className={deltaClass(elo.delta)}
                  aria-label={`Cambio de ELO: ${formatDelta(elo.delta)}`}
                >
                  {formatDelta(elo.delta)}
                </span>
              ) : (
                <span />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
