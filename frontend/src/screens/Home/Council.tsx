import { useNavigate } from 'react-router-dom'
import type { RankingRow } from '@/data/types'
import { PATHS } from '@/shell/paths'
import { Button, Delta, Plate, PlayerTag, SectionHead } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Sparkline } from '@/ui/instruments'
import reveal from '@/ui/reveal.module.css'
import styles from './Home.module.css'

/** Los cinco primeros del ranking, con su tendencia de las últimas 12 partidas. */
export function Council({ rows }: { rows: RankingRow[] }) {
  const navigate = useNavigate()
  const top = rows.slice().sort((a, b) => a.rank - b.rank).slice(0, 5)
  return (
    <Plate className={cx(styles.council, reveal.reveal)} label="Ranking">
      <SectionHead title="Consejo de Terraformación"><span>ELO</span></SectionHead>
      {top.length === 0 && <p className="muted">El ranking aparece con la primera partida.</p>}
      <ol className={styles.council__list}>
        {top.map((p) => (
          <li key={p.player_id} className={cx(styles.council__row, styles[`council__row--${p.rank}`])}>
            <span className={styles.council__rank}>{p.rank}</span>
            <PlayerTag player={{ id: p.player_id, name: p.name, color: p.color }} />
            <Sparkline values={p.elo_series.slice(-12).map((s) => s.elo)} width={72} height={22} color={p.color} />
            <span className={styles.council__elo}>{p.elo}</span>
            <Delta value={p.last_delta} size="s" />
          </li>
        ))}
      </ol>
      <Button variant="ghost" size="s" iconRight="next" onClick={() => navigate(PATHS.ranking)}>Ranking completo</Button>
    </Plate>
  )
}
