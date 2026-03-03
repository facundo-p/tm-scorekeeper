import { calcRunningTotal } from '@/utils/gameCalculations'
import { calcMilestonePoints, calcAwardPoints } from '@/utils/gameCalculations'
import type { GameFormState } from '../GameForm.types'
import styles from '../GameForm.module.css'

interface Props {
  state: GameFormState
}

export default function StepReview({ state }: Props) {
  const awards = state.awards.map((a) => ({
    name: a.name,
    opened_by: a.opened_by,
    first_place: a.first_place,
    second_place: a.second_place,
  }))

  return (
    <div className={styles.stepContent}>
      <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-md)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase' }}>Configuración</h3>
        <p>Fecha: <strong>{state.date}</strong></p>
        <p>Mapa: <strong>{state.map}</strong></p>
        <p>Expansiones: <strong>{state.expansions.length > 0 ? state.expansions.join(', ') : 'Ninguna'}</strong></p>
        <p>Draft: <strong>{state.draft ? 'Sí' : 'No'}</strong></p>
        <p>Generaciones: <strong>{state.generations}</strong></p>
      </section>

      <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-md)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase' }}>Puntuaciones finales</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--spacing-xs) var(--spacing-md)' }}>
          {state.players.map((player) => {
            const milestones = state.milestones.filter((m) => m.claimed && m.player_id === player.player_id).map((m) => m.milestone)
            const milestone_points = calcMilestonePoints(milestones)
            const award_points = calcAwardPoints(player.player_id, awards as Parameters<typeof calcAwardPoints>[1])
            const total = calcRunningTotal({
              terraform_rating: player.terraform_rating,
              milestone_points,
              award_points,
              card_points: player.card_points,
              card_resource_points: player.card_resource_points,
              greenery_points: player.greenery_points,
              city_points: player.city_points,
              turmoil_points: player.turmoil_points,
            })
            return (
              <>
                <span key={`${player.player_id}-name`} style={{ fontWeight: 'var(--font-weight-medium)' }}>{player.name} ({player.corporation})</span>
                <span key={`${player.player_id}-total`} style={{ color: 'var(--color-accent)', fontWeight: 'var(--font-weight-bold)' }}>{total} pts</span>
              </>
            )
          })}
        </div>
      </section>

      {state.milestones.filter((m) => m.claimed).length > 0 && (
        <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-md)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase' }}>Hitos</h3>
          {state.milestones.filter((m) => m.claimed).map((m) => {
            const player = state.players.find((p) => p.player_id === m.player_id)
            return <p key={m.milestone}>{m.milestone}: <strong>{player?.name ?? '—'}</strong></p>
          })}
        </section>
      )}

      {state.awards.length > 0 && (
        <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-md)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase' }}>Recompensas</h3>
          {state.awards.map((award, i) => {
            const opener = state.players.find((p) => p.player_id === award.opened_by)
            const first = award.first_place.map((id) => state.players.find((p) => p.player_id === id)?.name).join(', ')
            const second = award.second_place.map((id) => state.players.find((p) => p.player_id === id)?.name).join(', ')
            return (
              <div key={i} style={{ marginBottom: 'var(--spacing-sm)' }}>
                <strong>{award.name}</strong> (abierto por {opener?.name ?? '—'}) — 1ro: {first || '—'}{second ? ` / 2do: ${second}` : ''}
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
