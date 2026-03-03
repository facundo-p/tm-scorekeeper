import { MILESTONE_POINTS, AWARD_FIRST_POINTS, AWARD_SECOND_POINTS } from '@/constants/gameRules'
import type { AwardResultDTO } from '@/types'
import type { Milestone } from '@/constants/enums'

export function calcMilestonePoints(milestones: Milestone[]): number {
  return milestones.length * MILESTONE_POINTS
}

export function calcAwardPoints(playerId: string, awards: AwardResultDTO[]): number {
  return awards.reduce((total, award) => {
    if (award.first_place.includes(playerId)) return total + AWARD_FIRST_POINTS
    if (award.second_place.includes(playerId)) return total + AWARD_SECOND_POINTS
    return total
  }, 0)
}

export interface PartialScores {
  terraform_rating?: number
  milestone_points?: number
  award_points?: number
  card_points?: number
  card_resource_points?: number
  greenery_points?: number
  city_points?: number
  turmoil_points?: number | null
}

export function calcRunningTotal(scores: PartialScores): number {
  return (
    (scores.terraform_rating ?? 0) +
    (scores.milestone_points ?? 0) +
    (scores.award_points ?? 0) +
    (scores.card_points ?? 0) +
    (scores.card_resource_points ?? 0) +
    (scores.greenery_points ?? 0) +
    (scores.city_points ?? 0) +
    (scores.turmoil_points ?? 0)
  )
}
