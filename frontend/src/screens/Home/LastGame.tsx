import { useNavigate } from 'react-router-dom'
import type { PlayerIndex } from '@/data/instruments'
import { scoredGame } from '@/data/instruments'
import type { GameReport } from '@/data/types'
import { corpLabel } from '@/domain/catalog'
import { fmtDate } from '@/domain/format'
import { PATHS } from '@/shell/paths'
import { Button, CorpEmblem, CountUp, ExpansionTags, MapBadge, Plate, PlayerTag, SectionHead } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import { ScoreTrack } from '@/ui/instruments'
import reveal from '@/ui/reveal.module.css'
import styles from './Home.module.css'

/** Cuántos niveles de logro se alcanzaron en la partida (todos los jugadores), como cuenta el mockup. */
export const unlockedCount = (report: GameReport) =>
  Object.values(report.achievements_by_player).flat().reduce((n, u) => n + u.levels, 0)

function Winner({ report, players }: { report: GameReport; players: PlayerIndex }) {
  const w = report.results[0]
  return (
    <div className={styles.lastgame__win}>
      <CorpEmblem name={w.corporation} size="l" />
      <div className={styles.lastgame__winner}>
        <span className={styles.lastgame__kicker}>Ganó</span>
        <PlayerTag player={players.get(w.player_id)} size="l" />
        <span className={styles.lastgame__corp}>{corpLabel(w.corporation)}, por {report.margin} puntos</span>
      </div>
      <span className={styles.lastgame__score}><CountUp value={w.total_points} delay={300} /><small>pts</small></span>
    </div>
  )
}

function Footer({ report }: { report: GameReport }) {
  const navigate = useNavigate()
  const unlocked = unlockedCount(report)
  const { id } = report.game
  return (
    <div className={styles.lastgame__foot}>
      <span className={styles.lastgame__news}>
        {report.records_broken.length > 0 && <><Icon name="trophy" size={16} />{report.records_broken.length} récords rotos</>}
        {unlocked > 0 && <><Icon name="crown" size={16} />{unlocked} logros</>}
      </span>
      <Button variant="ghost" size="s" icon="spark" onClick={() => navigate(PATHS.ceremony(id))}>Repetir ceremonia</Button>
      <Button size="s" onClick={() => navigate(PATHS.game(id))}>Ver informe</Button>
    </div>
  )
}

export function LastGame({ report, players }: { report: GameReport; players: PlayerIndex }) {
  const g = report.game
  return (
    <Plate className={cx(styles.lastgame, reveal.reveal)} label="Última partida">
      <SectionHead title="Última partida"><span>{fmtDate(g.date)}</span></SectionHead>
      <div className={styles.lastgame__meta}>
        <MapBadge map={g.map} />
        <span className={styles.lastgame__chip}><Icon name="generation" size={16} />{g.generations} generaciones</span>
        <ExpansionTags expansions={g.expansions} draft={g.draft} />
      </div>
      <Winner report={report} players={players} />
      <ScoreTrack results={scoredGame(report, players).results} />
      <Footer report={report} />
    </Plate>
  )
}

/** Archivo vacío: el lugar de la última partida invita a registrar la primera. */
export function NoGames() {
  return (
    <Plate className={cx(styles.lastgame, reveal.reveal)} label="Última partida">
      <SectionHead title="Última partida" />
      <p className="muted">Todavía no hay partidas en el archivo. Registrá la primera para empezar a terraformar.</p>
    </Plate>
  )
}
