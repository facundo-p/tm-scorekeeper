import { MIN_PLAYERS, MAX_PLAYERS, MAX_MILESTONES, MAX_AWARDS } from '@/constants/gameRules'
import { Corporation } from '@/constants/enums'
import type { GameFormState, PlayerFormData, AwardEntry, MilestoneEntry } from '@/pages/GameForm/GameForm.types'

export function validateStepGameSetup(state: Pick<GameFormState, 'date' | 'map' | 'generations'>): string[] {
  const errors: string[] = []
  if (!state.date) errors.push('La fecha es requerida.')
  if (!state.map) errors.push('El mapa es requerido.')
  if (!state.generations || state.generations < 1) errors.push('Las generaciones deben ser al menos 1.')
  return errors
}

export function validateStepPlayerSelection(playerIds: string[]): string[] {
  const errors: string[] = []
  if (playerIds.length < MIN_PLAYERS) errors.push(`Se requieren al menos ${MIN_PLAYERS} jugadores.`)
  if (playerIds.length > MAX_PLAYERS) errors.push(`El máximo es ${MAX_PLAYERS} jugadores.`)
  return errors
}

export function validateStepCorpsAndTR(players: PlayerFormData[]): string[] {
  const errors: string[] = []
  const corps = players.map((p) => p.corporation).filter(Boolean)
  const nonNovelCorps = corps.filter((c) => c !== Corporation.NOVEL)
  const unique = new Set(nonNovelCorps)
  if (unique.size < nonNovelCorps.length) errors.push('Dos jugadores no pueden usar la misma corporación.')
  players.forEach((p) => {
    if (!p.corporation) errors.push(`${p.name}: corporación requerida.`)
    if (p.terraform_rating < 0) errors.push(`${p.name}: TR debe ser mayor o igual a 0.`)
  })
  return errors
}

export function validateStepAwards(awards: AwardEntry[], playerCount: number = 3): string[] {
  const errors: string[] = []
  if (awards.length > MAX_AWARDS) errors.push(`El máximo de recompensas financiadas es ${MAX_AWARDS}.`)
  const awardNames = awards.map((a) => a.name).filter(Boolean)
  if (new Set(awardNames).size < awardNames.length) errors.push('No se puede financiar la misma recompensa dos veces.')
  awards.forEach((award, i) => {
    if (!award.name) errors.push(`Recompensa ${i + 1}: nombre requerido.`)
    if (!award.opened_by) errors.push(`Recompensa ${i + 1}: quién la abrió es requerido.`)
    if (award.first_place.length === 0) errors.push(`Recompensa ${i + 1}: debe haber al menos un ganador de primer puesto.`)
    const overlap = award.first_place.filter((p) => award.second_place.includes(p))
    if (overlap.length > 0) errors.push(`Recompensa ${i + 1}: un jugador no puede estar en 1ro y 2do puesto.`)
    if (playerCount === 2 && award.second_place.length > 0)
      errors.push(`Recompensa ${i + 1}: en partidas de 2 jugadores no hay 2do puesto.`)
    if (award.first_place.length > 1 && award.second_place.length > 0)
      errors.push(`Recompensa ${i + 1}: con empate en 1ro no hay 2do puesto.`)
  })
  return errors
}

export function validateStepMilestones(milestones: MilestoneEntry[]): string[] {
  const errors: string[] = []
  const claimed = milestones.filter((m) => m.claimed)
  if (claimed.length > MAX_MILESTONES) errors.push(`El máximo de hitos por partida es ${MAX_MILESTONES}.`)
  claimed.forEach((m) => {
    if (!m.player_id) errors.push(`Hito "${m.milestone}": falta asignar al jugador que lo reclamó.`)
  })
  return errors
}

export function validateStepScoreField(players: PlayerFormData[], field: keyof PlayerFormData): string[] {
  const errors: string[] = []
  players.forEach((p) => {
    const value = p[field] as number | undefined
    if (value === undefined || value === null || (typeof value === 'number' && value < 0)) {
      errors.push(`${p.name}: ${field} debe ser mayor o igual a 0.`)
    }
  })
  return errors
}
