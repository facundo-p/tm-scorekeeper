import { useState, useCallback } from 'react'
import { createGame, getGameRecords } from '@/api/games'
import { triggerAchievements } from '@/api/achievements'
import { getEloChanges } from '@/api/elo'
import { ApiError } from '@/api/client'
import { calcMilestonePoints, calcAwardPoints } from '@/utils/gameCalculations'
import { Expansion } from '@/constants/enums'
import { Corporation } from '@/constants/enums'
import type { GameDTO, AwardResultDTO, RecordComparisonDTO, AchievementsByPlayerDTO, EloChangeDTO } from '@/types'
import type { GameFormState } from '@/pages/GameForm/GameForm.types'

export function useGames() {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const submitGame = useCallback(async (state: GameFormState): Promise<string | null> => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const awards: AwardResultDTO[] = state.awards
        .filter((a) => a.name)
        .map((a) => ({
          name: a.name as AwardResultDTO['name'],
          opened_by: a.opened_by,
          first_place: a.first_place,
          second_place: a.second_place,
        }))

      const hasTurmoil = state.expansions.includes(Expansion.TURMOIL)

      const player_results = state.players.map((player) => {
        const claimedMilestones = state.milestones
          .filter((m) => m.claimed && m.player_id === player.player_id)
          .map((m) => m.milestone)

        return {
          player_id: player.player_id,
          corporation: player.corporation as Corporation,
          scores: {
            terraform_rating: player.terraform_rating,
            milestone_points: calcMilestonePoints(claimedMilestones),
            milestones: claimedMilestones,
            award_points: calcAwardPoints(player.player_id, awards),
            card_points: player.card_points,
            card_resource_points: player.card_resource_points,
            greenery_points: player.greenery_points,
            city_points: player.city_points,
            turmoil_points: hasTurmoil ? (player.turmoil_points ?? 0) : null,
          },
          end_stats: { mc_total: 0 },
        }
      })

      const gameDTO: GameDTO = {
        id: null,
        date: state.date,
        map: state.map as GameDTO['map'],
        expansions: state.expansions,
        draft: state.draft,
        generations: state.generations,
        player_results,
        awards,
      }

      const response = await createGame(gameDTO)
      return response.id
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al guardar la partida'
      setSubmitError(msg)
      return null
    } finally {
      setSubmitting(false)
    }
  }, [])

  const fetchRecords = useCallback(async (gameId: string): Promise<RecordComparisonDTO[] | null> => {
    try {
      return await getGameRecords(gameId)
    } catch {
      return null
    }
  }, [])

  const fetchAchievements = useCallback(async (gameId: string): Promise<AchievementsByPlayerDTO | null> => {
    try {
      return await triggerAchievements(gameId)
    } catch {
      // D-09: one retry
      try {
        return await triggerAchievements(gameId)
      } catch {
        // D-10: silent failure — achievements will be calculated eventually (reconciler or next game)
        console.warn('Failed to load achievements after retry')
        return null
      }
    }
  }, [])

  const fetchEloChanges = useCallback(async (gameId: string): Promise<EloChangeDTO[] | null> => {
    try {
      return await getEloChanges(gameId)
    } catch {
      // D-10: one retry
      try {
        return await getEloChanges(gameId)
      } catch {
        // D-04 / D-10: silent failure — ELO section will be omitted from the modal
        console.warn('Failed to load ELO changes after retry')
        return null
      }
    }
  }, [])

  return { submitting, submitError, submitGame, fetchRecords, fetchAchievements, fetchEloChanges }
}
