// Lo puro de la vitrina de logros (port de docs/redesign/mockup/js/screens/achievements.js).
import type { CatalogAchievement, PlayerAchievement } from '@/data/types'

/** Nivel que muestra la medalla: el del jugador elegido o el más alto del grupo. */
export const shownTier = (a: CatalogAchievement, mine?: PlayerAchievement) =>
  mine ? mine.tier : Math.max(0, ...a.holders.map((h) => h.tier))

/** Título del nivel mostrado (o del primero si está bloqueado). */
export const tierTitle = (a: CatalogAchievement, tier: number) => (a.tiers.find((t) => t.level === tier) ?? a.tiers[0])?.title ?? ''

/** Título de la hoja: el del nivel más alto. */
export const sheetTitle = (a: CatalogAchievement) => a.tiers[a.tiers.length - 1]?.title ?? ''

export const holdersText = (n: number) => (n ? `${n} ${n === 1 ? 'jugador' : 'jugadores'}` : 'Nadie todavía')

/** Un escalón de la escalera: quiénes están en ese nivel y si se alcanzó (por el jugador o por alguien). */
export function ladderRow(a: CatalogAchievement, level: number, mine?: PlayerAchievement) {
  const at = a.holders.filter((h) => h.tier === level)
  const reached = mine ? mine.tier >= level : a.holders.some((h) => h.tier >= level)
  return { at, reached }
}

export const thresholdText = (a: CatalogAchievement, threshold: number) => (a.kind === 'flag' ? 'Lograrlo una vez' : `Umbral: ${threshold}`)
