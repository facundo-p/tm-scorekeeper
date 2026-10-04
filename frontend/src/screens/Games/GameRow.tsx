import { useNavigate } from 'react-router-dom'
import { summaryResults, type PlayerIndex } from '@/data/instruments'
import type { GameSummary } from '@/data/types'
import { corpLabel, MAPS } from '@/domain/catalog'
import { PATHS } from '@/shell/paths'
import { CorpEmblem, Cube, ExpansionTags } from '@/ui/atoms'
import { Icon, MapGlyph } from '@/ui/icons'
import { ScoreTrack } from '@/ui/instruments'
import { rowSub } from './model'
import styles from './Games.module.css'

function Winner({ g, players }: { g: GameSummary; players: PlayerIndex }) {
  const w = g.scores[0]
  const winner = players.get(w.player_id) ?? { id: w.player_id, name: w.player_id, color: 'gris' }
  return (
    <span className={styles.mrow__win}>
      <span className={styles.mrow__corp}><CorpEmblem name={w.corporation} size="s" /></span>
      <span className={styles.mrow__winner}><span><Cube color={winner.color} size={13} />{winner.name}</span>
        <small>{corpLabel(w.corporation)}</small></span>
      <span className={styles.mrow__pts}>{w.total_points}<small>{g.decided_by_mc ? 'M€' : `+${g.margin}`}</small>
        <span className={styles.mrow__who}><Cube color={winner.color} size={11} />{winner.name}</span></span>
    </span>
  )
}

/** Una partida del archivo; agrupada por mes muestra el día de la semana, si no, mes y año. */
export function GameRow({ g, players, flat }: { g: GameSummary; players: PlayerIndex; flat?: boolean }) {
  const navigate = useNavigate()
  const d = new Date(`${g.date}T12:00:00`)
  const w = g.scores[0]
  return (
    <li>
      <button type="button" className={styles.mrow} data-sheen onClick={() => navigate(PATHS.game(g.id))}
        aria-label={`Partida del ${g.date} en ${g.map}, ganó ${players.get(w.player_id)?.name ?? w.player_id} con ${w.total_points} puntos`}>
        <span className={styles.mrow__date}><b>{d.getDate()}</b><span>{rowSub(g.date, !!flat)}</span></span>
        <span className={styles.mrow__map}>
          <span className={styles.mrow__mapname}><MapGlyph glyph={MAPS[g.map].glyph} size={22} />{g.map}</span>
          <span className={styles.mrow__meta}>
            <span><Icon name="generation" size={14} />{g.generations}</span>
            <span><Icon name="players" size={14} />{g.player_count}</span>
            <ExpansionTags expansions={g.expansions} size="s" />
          </span>
        </span>
        <span className={styles.mrow__track}><ScoreTrack results={summaryResults(g, players)} compact /></span>
        <Winner g={g} players={players} />
        <span className={styles.mrow__go} aria-hidden="true"><Icon name="next" size={18} /></span>
      </button>
    </li>
  )
}
