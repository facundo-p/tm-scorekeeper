import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/Button/Button'
import PlayerScoreSummary from '@/components/PlayerScoreSummary/PlayerScoreSummary'
import StepGameSetup from './steps/StepGameSetup'
import StepPlayerSelection from './steps/StepPlayerSelection'
import StepCorpsAndTR from './steps/StepCorpsAndTR'
import StepAwards from './steps/StepAwards'
import StepMilestones from './steps/StepMilestones'
import StepScoreField from './steps/StepScoreField'
import StepReview from './steps/StepReview'
import { calcMilestonePoints, calcAwardPoints } from '@/utils/gameCalculations'
import {
  validateStepGameSetup,
  validateStepPlayerSelection,
  validateStepCorpsAndTR,
  validateStepAwards,
  validateStepMilestones,
} from '@/utils/validation'
import { Expansion, type Milestone } from '@/constants/enums'
import { INITIAL_GAME_STATE, INITIAL_PLAYER_DATA } from './GameForm.types'
import type { GameFormState, PlayerFormData } from './GameForm.types'
import { useGames } from '@/hooks/useGames'
import { usePlayers } from '@/hooks/usePlayers'
import styles from './GameForm.module.css'

interface StepDefinition {
  label: string
  validate: (state: GameFormState) => string[]
}

function buildSteps(hasTurmoil: boolean): StepDefinition[] {
  const base: StepDefinition[] = [
    { label: 'Partida', validate: (s) => validateStepGameSetup(s) },
    { label: 'Jugadores', validate: (s) => validateStepPlayerSelection(s.selectedPlayerIds) },
    { label: 'Corps & TR', validate: (s) => validateStepCorpsAndTR(s.players) },
    { label: 'Recompensas', validate: (s) => validateStepAwards(s.awards, s.players.length) },
    { label: 'Hitos', validate: (s) => validateStepMilestones(s.milestones) },
    { label: 'Cartas-R', validate: () => [] },
    { label: 'Cartas', validate: () => [] },
    { label: 'Vegetación', validate: () => [] },
    { label: 'Ciudades', validate: () => [] },
  ]
  if (hasTurmoil) base.push({ label: 'Turmoil', validate: () => [] })
  base.push({ label: 'Resumen', validate: () => [] })
  return base
}

function syncPlayersFromSelection(
  state: GameFormState,
  allPlayers: Array<{ player_id: string; name: string }>,
): PlayerFormData[] {
  return state.selectedPlayerIds.map((id) => {
    const existing = state.players.find((p) => p.player_id === id)
    if (existing) return existing
    const found = allPlayers.find((p) => p.player_id === id)
    return { ...INITIAL_PLAYER_DATA, player_id: id, name: found?.name ?? id }
  })
}

export default function GameForm() {
  const navigate = useNavigate()
  const [state, setState] = useState<GameFormState>(INITIAL_GAME_STATE)
  const [step, setStep] = useState(0)
  const [stepErrors, setStepErrors] = useState<string[]>([])
  const { submitting, submitError, submitGame } = useGames()
  const { players: allPlayers } = usePlayers({ activeOnly: true })

  const hasTurmoil = state.expansions.includes(Expansion.TURMOIL)
  const steps = buildSteps(hasTurmoil)
  const totalSteps = steps.length
  const isLastStep = step === totalSteps - 1

  const patch = useCallback((update: Partial<GameFormState>) => {
    setState((prev) => ({ ...prev, ...update }))
  }, [])

  const handleNext = () => {
    const errors = steps[step].validate(state)
    if (errors.length > 0) { setStepErrors(errors); return }
    setStepErrors([])

    if (step === 1) {
      // After player selection, sync player objects
      setState((prev) => ({
        ...prev,
        players: syncPlayersFromSelection(prev, allPlayers),
        milestones: [],
        awards: [],
      }))
    }

    setStep((s) => s + 1)
  }

  const handleBack = () => { setStepErrors([]); setStep((s) => s - 1) }

  const handleSubmit = async () => {
    const gameId = await submitGame(state)
    if (gameId) navigate(`/games/${gameId}/records`)
  }

  const summaryPlayers = state.players.map((p) => {
    const milestones = state.milestones
      .filter((m) => m.claimed && m.player_id === p.player_id)
      .map((m) => m.milestone as Milestone)
    const milestone_points = calcMilestonePoints(milestones)
    const award_points = calcAwardPoints(p.player_id, state.awards.filter((a) => a.name) as Parameters<typeof calcAwardPoints>[1])
    return {
      player_id: p.player_id,
      name: p.name,
      scores: {
        terraform_rating: p.terraform_rating,
        milestone_points,
        award_points,
        card_resource_points: p.card_resource_points,
        card_points: p.card_points,
        greenery_points: p.greenery_points,
        city_points: p.city_points,
        turmoil_points: p.turmoil_points,
      },
    }
  })

  const renderStep = () => {
    const stepIndex = hasTurmoil
      ? ['Partida', 'Jugadores', 'Corps & TR', 'Recompensas', 'Hitos', 'Cartas-R', 'Cartas', 'Vegetación', 'Ciudades', 'Turmoil', 'Resumen']
      : ['Partida', 'Jugadores', 'Corps & TR', 'Recompensas', 'Hitos', 'Cartas-R', 'Cartas', 'Vegetación', 'Ciudades', 'Resumen']

    const label = stepIndex[step]

    switch (label) {
      case 'Partida': return <StepGameSetup state={state} onChange={patch} />
      case 'Jugadores': return <StepPlayerSelection state={state} onChange={patch} />
      case 'Corps & TR': return <StepCorpsAndTR state={state} onChange={patch} />
      case 'Recompensas': return <StepAwards state={state} onChange={patch} />
      case 'Hitos': return <StepMilestones state={state} onChange={patch} />
      case 'Cartas-R': return <StepScoreField state={state} field="card_resource_points" label="Puntos de recursos de cartas" onChange={patch} />
      case 'Cartas': return <StepScoreField state={state} field="card_points" label="Puntos de cartas" onChange={patch} />
      case 'Vegetación': return <StepScoreField state={state} field="greenery_points" label="Puntos de vegetación" onChange={patch} />
      case 'Ciudades': return <StepScoreField state={state} field="city_points" label="Puntos de ciudades" onChange={patch} />
      case 'Turmoil': return <StepScoreField state={state} field="turmoil_points" label="Puntos de Turmoil" onChange={patch} />
      case 'Resumen': return <StepReview state={state} />
      default: return null
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/home"><Button variant="ghost" size="sm">← Inicio</Button></Link>
          <h1 className={styles.headerTitle}>Cargar Partida</h1>
        </div>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          Paso {step + 1} de {totalSteps}
        </span>
      </header>

      <div className={styles.progress}>
        {steps.map((s, i) => (
          <div key={s.label} className={styles.progressStep}>
            <span className={[styles.stepDot, i < step ? styles.done : i === step ? styles.current : ''].join(' ')}>
              {i < step ? '✓' : i + 1}
            </span>
            <span className={[styles.stepLabel, i === step ? styles.current : ''].join(' ')}>
              {s.label}
            </span>
            {i < steps.length - 1 && <span className={styles.stepSeparator}>›</span>}
          </div>
        ))}
      </div>

      <main className={styles.main}>
        {step > 1 && summaryPlayers.length > 0 && <PlayerScoreSummary players={summaryPlayers} />}

        <h2 className={styles.stepTitle}>{steps[step].label}</h2>

        {stepErrors.length > 0 && (
          <div className={styles.errors}>
            {stepErrors.map((e, i) => <p key={i} className={styles.errorItem}>• {e}</p>)}
          </div>
        )}

        {renderStep()}

        {submitError && (
          <div className={styles.errors} style={{ marginTop: 'var(--spacing-md)' }}>
            <p className={styles.errorItem}>{submitError}</p>
          </div>
        )}

        <div className={styles.nav}>
          {step > 0
            ? <Button variant="secondary" onClick={handleBack}>← Atrás</Button>
            : <span />
          }
          {isLastStep
            ? <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Guardando...' : 'Confirmar y guardar'}
              </Button>
            : <Button onClick={handleNext}>Siguiente →</Button>
          }
        </div>
      </main>
    </div>
  )
}
