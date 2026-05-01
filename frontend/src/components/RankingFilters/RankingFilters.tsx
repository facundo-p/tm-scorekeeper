import MultiSelect, { type MultiSelectOption } from '@/components/MultiSelect/MultiSelect'
import Button from '@/components/Button/Button'
import styles from './RankingFilters.module.css'

export interface RankingFiltersProps {
  players: string[]
  fromDate: string | null
  activePlayersOptions: MultiSelectOption[]
  onPlayersChange: (next: string[]) => void
  onFromDateChange: (next: string | null) => void
  onClear: () => void
}

export default function RankingFilters({
  players,
  fromDate,
  activePlayersOptions,
  onPlayersChange,
  onFromDateChange,
  onClear,
}: RankingFiltersProps) {
  return (
    <div className={styles.wrapper}>
      <MultiSelect label="Jugadores" options={activePlayersOptions} value={players} onChange={onPlayersChange} />
      <label className={styles.dateField}>
        <span className={styles.dateLabel}>Desde</span>
        <input
          type="date"
          className={styles.dateInput}
          value={fromDate ?? ''}
          onChange={(e) => onFromDateChange(e.target.value === '' ? null : e.target.value)}
        />
      </label>
      <Button variant="ghost" onClick={onClear}>Limpiar filtros</Button>
    </div>
  )
}
