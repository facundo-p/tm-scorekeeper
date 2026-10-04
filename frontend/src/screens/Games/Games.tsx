// Partidas (F29, SCR-03): port de docs/redesign/mockup/js/screens/games.js con datos de la API.
import { useMemo, useState, type ReactNode } from 'react'
import { bySignup, playerIndex } from '@/data/instruments'
import { useGameSummaries, useGroupSummary, usePlayersList } from '@/data/hooks'
import type { GameSummary } from '@/data/types'
import { DEFAULT_SORT, sortGames, type GameSort } from '@/domain/sort'
import { Button, Empty, Notice } from '@/ui/atoms'
import { cssVars } from '@/domain/cssVars'
import { cx } from '@/ui/cx'
import { ScreenHead } from '@/ui/frame'
import { useSearchParam } from '@/ui/hooks/useSearchParam'
import { MesaNotice, useMesaParam } from '@/ui/MesaFilter'
import reveal from '@/ui/reveal.module.css'
import { SheetActions, Sheet } from '@/ui/sheet'
import { ErrorState, LoadingState } from '@/ui/states'
import { ActivityStrip } from './ActivityStrip'
import { GameFilters, type FilterState } from './GameFilters'
import { GameList } from './GameList'
import { activeCount, applyFilters, archiveSub, EMPTY_FILTERS, type GameFilters as Filters } from './model'
import styles from './Games.module.css'

function useFilterState(): FilterState {
  const [f, setF] = useState<Filters>(EMPTY_FILTERS)
  const [mesa, setMesa] = useMesaParam()
  const [sort, setSort] = useState<GameSort>(DEFAULT_SORT)
  return { f, setF, mesa, setMesa, sort, setSort }
}

function useGamesData() {
  const g = useGameSummaries()
  const s = useGroupSummary()
  const p = usePlayersList()
  const players = useMemo(() => playerIndex(p.players ?? []), [p.players])
  const withGames = useMemo(() => bySignup(p.players ?? []).filter((x) => x.since).map((x) => players.get(x.player_id)!), [p.players, players])
  const error = g.error ?? s.error ?? p.error
  const refetch = () => [g, s, p].forEach((q) => q.error && q.refetch())
  return { games: g.games, summary: s.summary, players, withGames, error, refetch, ready: !!(g.games && s.summary && p.players) }
}

function NoMatch({ onClear }: { onClear: () => void }) {
  return (
    <Empty icon="search" title="Ninguna partida coincide" action={<Button onClick={onClear}>Limpiar filtros</Button>}>
      Probá con otro mapa o sacá algún jugador del filtro.
    </Empty>
  )
}

function FiltersSheet({ count, onClear, onClose, children }: { count: number; onClear: () => void; onClose: () => void; children: ReactNode }) {
  return (
    <Sheet title="Filtrar partidas" onClose={onClose}>
      {children}
      <SheetActions>
        <Button variant="ghost" onClick={onClear}>Limpiar</Button>
        <Button variant="primary" onClick={onClose}>{`Ver ${count} partidas`}</Button>
      </SheetActions>
    </Sheet>
  )
}

function ActiveFilters({ shown, total, onClear }: { shown: number; total: number; onClear: () => void }) {
  return (
    <div className={styles.activef}>
      <span>{shown} de {total} partidas</span>
      <Button variant="ghost" size="s" icon="close" onClick={onClear}>Limpiar filtros</Button>
    </div>
  )
}

interface ArchiveProps { d: ReturnType<typeof useGamesData>; state: FilterState; list: GameSummary[] }

function Archive({ d, state, list }: ArchiveProps) {
  const [sheet, setSheet] = useState(false)
  const [aviso] = useSearchParam('aviso')
  const { f, mesa } = state
  const all = d.games!
  const active = activeCount(f)
  const clearAll = () => { state.setF(EMPTY_FILTERS); if (mesa) state.setMesa(null) }
  const filters = <GameFilters state={state} maps={[...new Set(all.map((g) => g.map))]} players={d.withGames} />
  return (
    <>
      <ScreenHead title="Partidas" sub={archiveSub(d.summary!.games, d.summary!.first)} revealAt={0} asideClassName={styles['games-head__btns']}>
        <Button icon="filter" onClick={() => setSheet(true)}>{`Filtros${active ? ` (${active})` : ''}`}</Button>
      </ScreenHead>
      <div className={cx(styles['games-tools'], reveal.reveal)} style={cssVars({ i: 1 })}>
        {d.summary!.last && <ActivityStrip games={all} last={d.summary!.last} />}
        <div className={styles['games-filters']}>{filters}</div>
      </div>
      {aviso === 'eliminada' && <Notice>Partida eliminada. Se recalcularon el ELO, los récords y los logros.</Notice>}
      <MesaNotice value={mesa} onClear={() => state.setMesa(null)}>{list.length} de {all.length} partidas</MesaNotice>
      {active > 0 && <ActiveFilters shown={list.length} total={all.length} onClear={clearAll} />}
      {list.length === 0 ? <NoMatch onClear={clearAll} /> : <GameList list={list} sort={state.sort} players={d.players} />}
      {sheet && <FiltersSheet count={list.length} onClear={clearAll} onClose={() => setSheet(false)}>{filters}</FiltersSheet>}
    </>
  )
}

export default function Games() {
  const state = useFilterState()
  const d = useGamesData()
  const { f, mesa, sort } = state
  const list = useMemo(() => sortGames(applyFilters(d.games ?? [], f, mesa), sort, (id) => d.players.get(id)?.name ?? id), [d.games, d.players, f, mesa, sort])
  if (d.error) return <ErrorState onRetry={d.refetch} />
  if (!d.ready) return <LoadingState />
  return <Archive d={d} state={state} list={list} />
}
