// De y hacia la API: una partida guardada como estado del asistente, y el estado como partida.
import type { GameReport } from '@/data/types'
import { derived, INPUT_CATS, type InputCat, type WizardState } from './model'

/** Partida tal como la devuelve la API (`report.game`, GameDTO). */
export type SavedGame = GameReport['game'] & {
  player_results: { player_id: string; corporation: string; scores: Record<string, number | string[] | null>; end_stats: { mc_total: number } }[]
}

/** Una partida guardada como estado del asistente (ejemplo y modo edición). */
export function stateFromGame(g: SavedGame, extra: Partial<WizardState>): WizardState {
  const milestones: Record<string, string> = {}
  g.player_results.forEach((r) => ((r.scores.milestones as string[] | null) ?? []).forEach((m) => { milestones[m] = r.player_id }))
  return {
    step: 0, example: false, editing: null,
    date: g.date, map: g.map, expansions: [...g.expansions], draft: g.draft, generations: g.generations,
    players: g.player_results.map((r) => ({
      id: r.player_id, corp: r.corporation, mc: r.end_stats.mc_total,
      scores: Object.fromEntries(INPUT_CATS.map((k) => [k, Number(r.scores[k] ?? 0)])) as Record<InputCat, number>,
    })),
    milestones,
    awards: g.awards.map((a) => ({ name: a.name, opened_by: a.opened_by, first: [...a.first_place], second: [...a.second_place] })),
    ...extra,
  }
}

/** El estado como cuerpo de POST/PUT /games: hitos y recompensas se calculan; Turmoil va en null si no se jugó. */
export function toPayload(s: WizardState) {
  const { rows, turmoil } = derived(s)
  return {
    date: s.date, map: s.map, expansions: s.expansions, draft: s.draft, generations: s.generations,
    player_results: s.players.map((p) => {
      const sc = rows.find((r) => r.id === p.id)!.sc
      return {
        player_id: p.id, corporation: p.corp, end_stats: { mc_total: p.mc },
        scores: {
          ...p.scores, turmoil_points: turmoil ? p.scores.turmoil_points : null,
          milestone_points: sc.milestone_points, award_points: sc.award_points,
          milestones: Object.entries(s.milestones).filter(([, id]) => id === p.id).map(([m]) => m),
        },
      }
    }),
    awards: s.awards.map((w) => ({ name: w.name, opened_by: w.opened_by, first_place: w.first, second_place: w.second })),
  }
}
