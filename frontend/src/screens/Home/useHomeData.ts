import { useMemo } from 'react'
import { playerIndex } from '@/data/instruments'
import { useCurrentSeason, useFeed, useGameReport, useGameSummaries, useGroupSummary, usePlayersList, useRanking } from '@/data/hooks'
import type { TableSize } from '@/ui/MesaFilter'

/**
 * Todo lo que muestra Inicio. La carrera es la única parte que sigue al filtro de mesa y a la
 * categoría; el resto es siempre del grupo completo (como en el mockup).
 */
export function useHomeData(category: string, mesa: TableSize | null) {
  const { season, error: e1 } = useCurrentSeason({ category: category === 'total' ? undefined : category, mesa })
  const { summary, error: e2 } = useGroupSummary()
  const { games, error: e3 } = useGameSummaries()
  const lastId = games?.[0]?.id
  const { report, error: e4 } = useGameReport(lastId ?? '', !!lastId)
  const { ranking, error: e5 } = useRanking()
  const { feed, error: e6 } = useFeed()
  const { players: list, error: e7 } = usePlayersList()
  const players = useMemo(() => playerIndex(list ?? []), [list])
  const error = e1 ?? e2 ?? e3 ?? e4 ?? e5 ?? e6 ?? e7
  const ready = !!(season && summary && games && (report || !lastId) && ranking && feed && list)
  return { season, summary, report, ranking, feed, players, ready, error }
}
