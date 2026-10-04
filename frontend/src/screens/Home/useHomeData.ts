import { useMemo } from 'react'
import { playerIndex } from '@/data/instruments'
import { useCurrentSeason, useFeed, useGameReport, useGameSummaries, useGroupSummary, usePlayersList, useRanking } from '@/data/hooks'
import type { TableSize } from '@/ui/MesaFilter'

/**
 * Todo lo que muestra Inicio. La carrera es la única parte que sigue al filtro de mesa y a la
 * categoría; el resto es siempre del grupo completo (como en el mockup).
 */
export function useHomeData(category: string, mesa: TableSize | null) {
  const s = useCurrentSeason({ category: category === 'total' ? undefined : category, mesa })
  const sum = useGroupSummary()
  const g = useGameSummaries()
  const lastId = g.games?.[0]?.id
  const r = useGameReport(lastId ?? '', !!lastId)
  const rk = useRanking()
  const f = useFeed()
  const pl = usePlayersList()
  const players = useMemo(() => playerIndex(pl.players ?? []), [pl.players])
  const all = [s, sum, g, r, rk, f, pl]
  const error = all.find((q) => q.error)?.error ?? null
  const refetch = () => all.forEach((q) => q.error && q.refetch())
  const ready = !!(s.season && sum.summary && g.games && (r.report || !lastId) && rk.ranking && f.feed && pl.players)
  return { season: s.season, summary: sum.summary, report: r.report, ranking: rk.ranking, feed: f.feed, players, ready, error, refetch }
}
