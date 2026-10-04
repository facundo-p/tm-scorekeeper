// Lo puro del perfil (port de docs/redesign/mockup/js/screens/profile.js).
import type { CatalogAchievement, Composition, GroupRecord, PlayerAchievement, SplitStat } from '@/data/types'
import { CATEGORIES, MAP_ORDER } from '@/domain/catalog'

export const TABS = ['resumen', 'partidas', 'records', 'logros'] as const
export type Tab = (typeof TABS)[number]
export const tabOf = (raw: string | null): Tab => (TABS as readonly string[]).includes(raw ?? '') ? (raw as Tab) : 'resumen'

/** ADN de puntaje: promedio propio por categoría, diferencia con el grupo y su tono (banda de ±0,5). */
export function dnaRows(mine: Composition, group: Composition) {
  return CATEGORIES.map((c) => {
    const own = mine.avg[c.key] ?? 0
    const diff = own - (group.avg[c.key] ?? 0)
    return { cat: c, own, diff, tone: diff >= 0.5 ? 'up' : diff <= -0.5 ? 'down' : 'flat' }
  })
}

/** Todos los mapas en el orden del catálogo, con lo jugado en cada uno (o nada). */
export function mapRows(maps: SplitStat[]) {
  const byName = Object.fromEntries(maps.map((m) => [m.name, m]))
  return MAP_ORDER.map((name) => ({ name, stat: byName[name] as SplitStat | undefined }))
}

/** Las 6 corporaciones más jugadas, con barras relativas a la más jugada. */
export function corpRows(corps: SplitStat[]) {
  const top = corps.slice(0, 6)
  const max = Math.max(1, ...top.map((c) => c.games))
  return top.map((c) => ({ ...c, g: ((c.games / max) * 100).toFixed(0), w: ((c.wins / max) * 100).toFixed(0) }))
}

/** Avance hacia el próximo nivel, en porcentaje entero (0 a 100; 0 si no hay meta). */
export const progressPct = (p: { current: number; target: number }) =>
  p.target > 0 ? Math.min(100, Math.max(0, Math.round((p.current / p.target) * 100))) : 0

export const timesText = (n: number) => `${n} ${n === 1 ? 'vez' : 'veces'}`

/** Logros en el orden del catálogo, los desbloqueados primero y por nivel. */
export function achievementRows(catalog: CatalogAchievement[], mine: PlayerAchievement[]) {
  const byCode = Object.fromEntries(mine.map((a) => [a.code, a]))
  return catalog
    .map((def) => ({ def, a: byCode[def.code] }))
    .filter((x): x is { def: CatalogAchievement; a: PlayerAchievement } => !!x.a)
    .sort((x, y) => Number(y.a.tier > 0) - Number(x.a.tier > 0) || y.a.tier - x.a.tier)
}

/** Récords del grupo que tiene el jugador, en el orden del catálogo de récords. */
export const heldRecords = (records: GroupRecord[], held: string[]) => records.filter((r) => held.includes(r.code))
