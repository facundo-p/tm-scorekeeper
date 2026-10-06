import type { Dispatch } from 'react'
import type { PlayerIndex } from '@/data/instruments'
import type { PlayerLike } from '@/ui/atoms'
import type { Action, WizardError, WizardState } from './model'

/** Lo que recibe cada paso del asistente. */
export interface StepProps {
  s: WizardState
  d: Dispatch<Action>
  errors: WizardError[]
  players: PlayerIndex
  /** Jugadores activos, en orden de alta (paso Mesa). */
  active?: PlayerLike[]
}
