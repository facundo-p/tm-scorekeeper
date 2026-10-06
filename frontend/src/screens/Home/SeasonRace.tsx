// La carrera de la temporada: promedio por partida, por categoría y por mesa.
import type { PlayerIndex } from '@/data/instruments'
import type { RaceRow as Row, Season } from '@/data/types'
import { cssVars } from '@/domain/cssVars'
import { fmt } from '@/domain/format'
import { NewBadge, Plate, PlayerTag, SectionHead } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { FilterChip, FilterGroup } from '@/ui/filters'
import { useSearchParam } from '@/ui/hooks/useSearchParam'
import { MesaFilter, MesaNotice, type TableSize } from '@/ui/MesaFilter'
import reveal from '@/ui/reveal.module.css'
import { CAT_LABEL, gamesText, missingText, raceLede, SEASON_CATEGORIES } from './model'
import styles from './Home.module.css'

function RaceRow({ r, max, i, players }: { r: Row; max: number; i: number; players: PlayerIndex }) {
  return (
    <li className={styles.race__row} style={cssVars({ w: ((r.avg / max) * 100).toFixed(1), i })}>
      <PlayerTag player={players.get(r.player_id)} size="s" sub={gamesText(r.games)} />
      <span className={styles.race__bar}><i /></span>
      <span className={styles.race__val}>{fmt.dec(r.avg)}</span>
    </li>
  )
}

function CategoryPicker({ value }: { value: string }) {
  const [, setCat] = useSearchParam('cat')
  const setCategory = (c: string) => setCat(c === 'total' ? null : c)
  return (
    <FilterGroup label="Promedio de" ariaLabel="Categoría de la carrera" className={styles.race__cats}>
      {SEASON_CATEGORIES.map((c) => <FilterChip key={c} on={value === c} onClick={() => setCategory(c)}>{CAT_LABEL[c]}</FilterChip>)}
    </FilterGroup>
  )
}

function Pending({ rows, players }: { rows: (Row & { missing: number })[]; players: PlayerIndex }) {
  return (
    <div className={styles.race__pending}>
      <h3 className={styles.race__h}>Sin clasificar</h3>
      <ul>{rows.map((r) => (
        <li key={r.player_id}><PlayerTag player={players.get(r.player_id)} size="s" /><span>{fmt.dec(r.avg)}</span>
          <small className="faint">{missingText(r.missing)}</small></li>
      ))}</ul>
    </div>
  )
}

interface SeasonRaceProps { season: Season; category: string; mesa: TableSize | null; setMesa: (n: TableSize | null) => void; players: PlayerIndex }

export function SeasonRace({ season, category, mesa, setMesa, players }: SeasonRaceProps) {
  const { race } = season
  const max = race.qualified[0]?.avg || race.pending[0]?.avg || 1
  const empty = race.qualified.length === 0 && race.pending.length === 0
  return (
    <Plate className={cx(styles.race, reveal.reveal)} label="Carrera de la temporada">
      <SectionHead title={`Carrera por la temporada ${season.number}`}><NewBadge /></SectionHead>
      <p className={styles.race__lede}>{raceLede(category, race.games)}</p>
      <div className={styles.race__tools}><CategoryPicker value={category} /><MesaFilter value={mesa} onChange={setMesa} /></div>
      <MesaNotice value={mesa} onClear={() => setMesa(null)} className={styles.race__notice} />
      {empty
        ? <p className="muted">Todavía no hay partidas para esta carrera.</p>
        : <ol className={styles.race__list}>{race.qualified.slice(0, 6).map((r, i) => <RaceRow key={r.player_id} r={r} max={max} i={i} players={players} />)}</ol>}
      {race.pending.length > 0 && <Pending rows={race.pending} players={players} />}
    </Plate>
  )
}
