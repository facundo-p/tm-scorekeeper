import { useState } from 'react'
import { useCurrentSeason } from '@/data/hooks'
import type { RankingRow } from '@/data/types'
import { Button, Cube, Empty, Plate, SectionHead } from '@/ui/atoms'
import { FilterChip, FilterChips } from '@/ui/filters'
import { EloChart } from '@/ui/instruments'
import reveal from '@/ui/reveal.module.css'
import { ranges, seriesOf, type Range } from './model'
import styles from './Ranking.module.css'

const firstFour = (rows: RankingRow[]) => rows.slice(0, 4).map((p) => p.player_id)

function Chart({ rows, sel, from, reset }: { rows: RankingRow[]; sel: string[]; from: string | null; reset: () => void }) {
  if (!sel.length) {
    return (
      <Empty icon="chart" title="Elegí al menos un jugador" action={<Button onClick={reset}>Ver los 4 primeros</Button>}>
        El gráfico resalta a los jugadores elegidos y deja al resto en gris.
      </Empty>
    )
  }
  return <EloChart series={seriesOf(rows)} highlight={sel} from={from ?? undefined} height={300} />
}

interface FiltersProps { list: Range[]; range: string; setRange: (id: string) => void; rows: RankingRow[]; sel: string[]; toggle: (id: string) => void }

function Filters({ list, range, setRange, rows, sel, toggle }: FiltersProps) {
  return (
    <div className={styles['elo-panel__filters']}>
      <FilterChips label="Rango de fechas">
        {list.map((r) => <FilterChip key={r.id} on={range === r.id} onClick={() => setRange(r.id)}>{r.label}</FilterChip>)}
      </FilterChips>
      <FilterChips label="Jugadores resaltados">
        {rows.map((p) => <FilterChip key={p.player_id} on={sel.includes(p.player_id)} onClick={() => toggle(p.player_id)}><Cube color={p.color} size={14} />{p.name}</FilterChip>)}
      </FilterChips>
    </div>
  )
}

/** Evolución del ELO (o del ELO de mesa) con rango de fechas y jugadores resaltados. */
export function EloPanel({ rows, mesa }: { rows: RankingRow[]; mesa: number | null }) {
  const { season } = useCurrentSeason()
  const [sel, setSel] = useState(() => firstFour(rows))
  const [range, setRange] = useState('all')
  const list = ranges(season)
  const toggle = (id: string) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id])
  return (
    <Plate className={reveal.reveal} label="Evolución del ELO">
      <SectionHead title={mesa ? `Evolución del ELO de mesa ${mesa}` : 'Evolución del ELO'} />
      <Filters list={list} range={range} setRange={setRange} rows={rows} sel={sel} toggle={toggle} />
      <Chart rows={rows} sel={sel} from={list.find((r) => r.id === range)?.from ?? null} reset={() => setSel(firstFour(rows))} />
    </Plate>
  )
}
