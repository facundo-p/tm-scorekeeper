import type { PlayerLike } from '@/ui/atoms'
import { MAPS, MAP_ORDER } from '@/domain/catalog'
import type { GameSort } from '@/domain/sort'
import { Cube } from '@/ui/atoms'
import { FilterChip, FilterGroup, FilterPanel } from '@/ui/filters'
import { MapGlyph } from '@/ui/icons'
import { MesaFilter, type TableSize } from '@/ui/MesaFilter'
import type { GameFilters as Filters } from './model'
import { SortBar } from './SortBar'
import styles from './Games.module.css'

function MapFilter({ maps, value, onChange }: { maps: string[]; value: string; onChange: (m: string) => void }) {
  return (
    <FilterGroup label="Mapa">
      <FilterChip on={!value} onClick={() => onChange('')}>Todos</FilterChip>
      {MAP_ORDER.filter((m) => maps.includes(m)).map((m) => (
        <FilterChip key={m} on={value === m} onClick={() => onChange(value === m ? '' : m)}><MapGlyph glyph={MAPS[m].glyph} size={18} />{m}</FilterChip>
      ))}
    </FilterGroup>
  )
}

function PlayerFilter({ players, value, onChange }: { players: PlayerLike[]; value: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  return (
    <FilterGroup label="Con" ariaLabel="Jugadores en la mesa">
      {players.map((p) => (
        <FilterChip key={p.id} on={value.includes(p.id)} onClick={() => toggle(p.id)}><Cube color={p.color} size={14} />{p.name}</FilterChip>
      ))}
    </FilterGroup>
  )
}

export interface FilterState {
  f: Filters
  setF: (f: Filters) => void
  mesa: TableSize | null
  setMesa: (n: TableSize | null) => void
  sort: GameSort
  setSort: (s: GameSort) => void
}

/** Mapa, jugadores y mesa, y el orden debajo (en escritorio, en la página; en el teléfono, en una hoja). */
export function GameFilters({ state, maps, players }: { state: FilterState; maps: string[]; players: PlayerLike[] }) {
  const { f, setF, mesa, setMesa, sort, setSort } = state
  return (
    <>
      <FilterPanel>
        <MapFilter maps={maps} value={f.map} onChange={(map) => setF({ ...f, map })} />
        <PlayerFilter players={players} value={f.players} onChange={(ids) => setF({ ...f, players: ids })} />
        <MesaFilter value={mesa} onChange={setMesa} />
      </FilterPanel>
      <FilterPanel className={styles['games-sort-row']}><SortBar sort={sort} onChange={setSort} /></FilterPanel>
    </>
  )
}
