import { nextSort, SORTS, type GameSort } from '@/domain/sort'
import { FilterChip, FilterGroup } from '@/ui/filters'
import styles from './Games.module.css'

/** Orden del archivo: tocar la columna activa invierte el sentido. */
export function SortBar({ sort, onChange }: { sort: GameSort; onChange: (s: GameSort) => void }) {
  return (
    <FilterGroup label="Ordenar" ariaLabel="Ordenar partidas">
      {SORTS.map((o) => {
        const on = sort.by === o.id
        const dir = sort.dir === 'asc' ? 'ascendente' : 'descendente'
        return (
          <FilterChip key={o.id} on={on} ariaLabel={on ? `Ordenar por ${o.label}, ${dir}` : `Ordenar por ${o.label}`}
            onClick={() => onChange(nextSort(sort, o.id))}>
            {o.label}{on && <span className={styles['games-sort__dir']} aria-hidden="true">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
          </FilterChip>
        )
      })}
    </FilterGroup>
  )
}
