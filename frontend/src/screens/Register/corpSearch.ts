// Sugerencias de corporación: todas las del catálogo en una sola lista, sin agrupar ni filtrar por expansión.
import { CORPS, corpLabel, type CorpInfo } from '@/domain/catalog'

export const NOVEL = 'Novel Corporation'

export interface CorpSuggestion {
  corp: CorpInfo
  label: string
  /** Nombre de quien ya la eligió (Novel Corporation la pueden repetir todos). */
  takenBy?: string
  /** Tramo del nombre visible que coincide con lo escrito, para resaltarlo. */
  match?: [number, number]
}

/** Minúsculas y sin tildes, letra por letra (así los índices coinciden con el texto original). */
const fold = (text: string) => [...text].map((ch) => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()).join('')

/** 0: empieza con lo escrito; 1: alguna palabra empieza así; 2: lo contiene; null: no coincide. */
function rank(label: string, name: string, q: string): number | null {
  const l = fold(label)
  if (l.startsWith(q)) return 0
  const words = `${l} ${fold(name)}`.split(/[\s()]+/)
  if (words.some((w) => w.startsWith(q))) return 1
  return l.includes(q) || fold(name).includes(q) ? 2 : null
}

/** Corporaciones que coinciden con `query`, primero las que empiezan así y después en orden alfabético. */
export function suggestCorps(query: string, takenBy: Record<string, string> = {}): CorpSuggestion[] {
  const q = fold(query.trim())
  return CORPS.map((corp) => ({ corp, label: corpLabel(corp.name), r: q ? rank(corpLabel(corp.name), corp.name, q) : 0 }))
    .filter((x): x is typeof x & { r: number } => x.r !== null)
    .sort((a, b) => a.r - b.r || a.label.localeCompare(b.label, 'es'))
    .map(({ corp, label }) => {
      const at = q ? fold(label).indexOf(q) : -1
      return {
        corp, label,
        takenBy: corp.name === NOVEL ? undefined : takenBy[corp.name],
        match: at >= 0 ? [at, at + q.length] as [number, number] : undefined,
      }
    })
}
