import { useState } from 'react'
import { usePlayerInsights } from '@/data/hooks'
import type { RankingRow } from '@/data/types'
import { inputClassFor } from '@/ui/atoms'
import { ByTablePanel } from '@/ui/fairness'
import type { TableSize } from '@/ui/MesaFilter'
import styles from './Ranking.module.css'

/** Desglose por tamaño de mesa de un jugador elegido de la clasificación. */
export function ByTable({ rows, mesa }: { rows: RankingRow[]; mesa: TableSize | null }) {
  const [who, setWho] = useState(rows[0]?.player_id ?? '')
  const p = rows.find((r) => r.player_id === who) ?? rows[0]
  const { insights } = usePlayerInsights(p?.player_id ?? '', { enabled: !!p })
  if (!p) return null
  return (
    <ByTablePanel name={p.name} rows={insights?.by_table ?? []} mesa={mesa}>
      <label className={styles.bytable__pick}><span className="vh">Jugador</span>
        <select className={inputClassFor()} value={p.player_id} onChange={(e) => setWho(e.target.value)}>
          {rows.map((r) => <option key={r.player_id} value={r.player_id}>{r.name}</option>)}
        </select>
      </label>
    </ByTablePanel>
  )
}
