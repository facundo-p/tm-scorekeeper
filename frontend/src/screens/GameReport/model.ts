// Lo puro del informe de partida (port de docs/redesign/mockup/js/screens/game.js).
import type { AwardResult, GameReport, GameUnlock } from '@/data/types'
import { ACHIEVEMENT_GLYPH, EXPANSION_AWARDS, EXPANSION_MILESTONES, MAPS } from '@/domain/catalog'

/** «22° N / 147° E» (oeste con O). */
export function coords(map: string) {
  const { lat, lon } = MAPS[map]
  return `${lat}° ${lat >= 0 ? 'N' : 'S'} / ${Math.abs(lon)}° ${lon >= 0 ? 'E' : 'O'}`
}

/** Bajada del ganador: corporación y por cuánto (o por desempate de M€). */
export function winSub(report: GameReport, name: (id: string) => string, corp: string) {
  const second = report.results.find((r) => r.position > 1)
  if (!second) return corp
  return `${corp}, ${report.decided_by_mc ? 'por desempate de M€' : `${report.margin} puntos sobre ${name(second.player_id)}`}`
}

/** Hitos del mapa y de las expansiones, con quién reclamó cada uno. */
export function milestoneSlots(report: GameReport) {
  const { map, expansions } = report.game
  const list = [...MAPS[map].milestones, ...expansions.flatMap((e) => EXPANSION_MILESTONES[e] ?? [])]
  const owner: Record<string, string> = {}
  report.results.forEach((r) => (r.scores.milestones ?? []).forEach((m) => { owner[m] = r.player_id }))
  return list.map((m) => ({ name: m, owner: owner[m] ?? null }))
}

/** Una recompensa es «robada» si la ganó solo alguien que no la financió. */
export const isStolen = (a: AwardResult) => a.first_place.length === 1 && a.first_place[0] !== a.opened_by

/** Recompensas del mapa y de las expansiones, con la financiada si la hubo. */
export function awardSlots(report: GameReport) {
  const { map, expansions, awards } = report.game
  const list = [...MAPS[map].awards, ...expansions.flatMap((e) => EXPANSION_AWARDS[e] ?? [])]
  const funded = new Map(awards.map((a) => [a.name, a]))
  return list.map((name) => ({ name, award: funded.get(name) ?? null }))
}

const CATALOG_ORDER = Object.keys(ACHIEVEMENT_GLYPH)

/**
 * Logros de la partida, uno por jugador y logro (el nivel más alto), en el orden del mockup:
 * jugadores por orden de alta (`rank`, D-74) y logros por orden del catálogo.
 */
export function unlocksOf(report: GameReport, rank: (playerId: string) => number) {
  return Object.entries(report.achievements_by_player)
    .flatMap(([pid, list]) => list.map((u: GameUnlock) => ({ ...u, player_id: pid })))
    .sort((a, b) => rank(a.player_id) - rank(b.player_id) || CATALOG_ORDER.indexOf(a.code) - CATALOG_ORDER.indexOf(b.code))
}

export const tierText = (u: GameUnlock) => (u.max_tier > 1 ? `Nivel ${u.tier} de ${u.max_tier}` : 'Logro único')
