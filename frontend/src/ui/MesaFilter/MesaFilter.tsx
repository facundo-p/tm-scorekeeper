import type { ReactNode } from 'react'
import { FilterChip, FilterGroup } from '../filters'
import { Icon } from '../icons'
import { TABLE_SIZES, type TableSize } from './useMesaParam'
import styles from './MesaFilter.module.css'

interface MesaFilterProps {
  value: TableSize | null
  onChange: (n: TableSize | null) => void
  className?: string
}

/** Filtro de jugadores por partida: Todas, 2, 3, 4, 5 (tocar el activo lo apaga). */
export function MesaFilter({ value, onChange, className }: MesaFilterProps) {
  return (
    <FilterGroup label="Mesa" ariaLabel="Jugadores por partida" className={className}>
      <FilterChip on={!value} onClick={() => onChange(null)}>Todas</FilterChip>
      {TABLE_SIZES.map((n) => (
        <FilterChip key={n} on={value === n} ariaLabel={`Mesas de ${n} jugadores`}
          onClick={() => onChange(value === n ? null : n)}>{n}</FilterChip>
      ))}
    </FilterGroup>
  )
}

interface MesaNoticeProps {
  value: TableSize | null
  onClear: () => void
  children?: ReactNode
}

/** Recuerda qué está mostrando la pantalla cuando hay filtro de mesa. */
export function MesaNotice({ value, onClear, children }: MesaNoticeProps) {
  if (!value) return null
  return (
    <p className={styles['mesa-notice']} role="status">
      <Icon name="players" size={16} />
      <span>Solo partidas de {value} jugadores{children ? <> · {children}</> : null}</span>
      <button type="button" className={styles['mesa-notice__clear']} onClick={onClear}>Quitar</button>
    </p>
  )
}
