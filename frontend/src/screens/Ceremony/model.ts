// Lo puro de la ceremonia (port de docs/redesign/mockup/js/screens/ceremony.js).
import type { ReportResult } from '@/data/types'
import type { CategoryInfo } from '@/domain/catalog'

export const ROW_H = 62

export interface TallyRow { r: ReportResult; parts: { c: CategoryInfo; v: number }[]; total: number }

/** Filas con las primeras `shown` categorías sumadas y su orden (el M€ desempata recién al final). */
export function tally(results: ReportResult[], cats: CategoryInfo[], shown: number) {
  const rows: TallyRow[] = results.map((r) => {
    const parts = cats.slice(0, shown).map((c) => ({ c, v: Number(r.scores[c.key as keyof ReportResult['scores']] ?? 0) }))
    return { r, parts, total: parts.reduce((s, x) => s + x.v, 0) }
  })
  const done = shown >= cats.length
  const order = rows.slice().sort((a, b) => b.total - a.total || (done ? b.r.mc_total - a.r.mc_total : 0))
  return { rows, order, done }
}

/** Texto de estado: qué categoría se está sumando o el final. */
export function statusText(cats: CategoryInfo[], shown: number, tallyDone: boolean) {
  if (tallyDone) return 'Resultados finales'
  const cur = cats[shown - 1]
  return cur ? `Sumando ${cur.long}` : 'Fin de la partida'
}
