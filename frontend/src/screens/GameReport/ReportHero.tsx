import { useNavigate } from 'react-router-dom'
import type { PlayerIndex } from '@/data/instruments'
import type { GameReport } from '@/data/types'
import { corpLabel, EXPANSIONS, MAPS } from '@/domain/catalog'
import { cssVars } from '@/domain/cssVars'
import { fmtDate } from '@/domain/format'
import { PlanetSlot } from '@/fx/planet'
import { PATHS } from '@/shell/paths'
import { Button, Chip, CorpEmblem, PlayerTag } from '@/ui/atoms'
import plate from '@/ui/atoms/Plate.module.css'
import { cx } from '@/ui/cx'
import { MapGlyph } from '@/ui/icons'
import reveal from '@/ui/reveal.module.css'
import { coords, winSub } from './model'
import styles from './GameReport.module.css'

function WinPlate({ report, players }: { report: GameReport; players: PlayerIndex }) {
  const w = report.results[0]
  const name = (id: string) => players.get(id)?.name ?? id
  return (
    <div className={cx(styles.winplate, plate.plate, plate['plate--gold'])} data-sheen>
      <CorpEmblem name={w.corporation} size="l" />
      <div className={styles.winplate__text}>
        <span className={styles.winplate__kicker}>Ganó</span>
        <PlayerTag player={players.get(w.player_id)} size="l" />
        <span className={styles.winplate__sub}>{winSub(report, name, corpLabel(w.corporation))}</span>
      </div>
      <span className={styles.winplate__score}>{w.total_points}<small>pts</small></span>
    </div>
  )
}

function Chips({ report }: { report: GameReport }) {
  const g = report.game
  return (
    <div className={styles['report-hero__chips']}>
      <Chip icon="generation">{g.generations} generaciones</Chip>
      <Chip icon="players">{report.results.length} jugadores</Chip>
      {g.draft && <Chip icon="draft">Draft</Chip>}
      {g.expansions.map((e) => <Chip key={e} icon={EXPANSIONS[e].glyph}>{EXPANSIONS[e].label}</Chip>)}
    </div>
  )
}

/** Marte girado hacia la región del mapa con la grilla del tablero, y la placa del ganador. */
export function ReportHero({ report, players }: { report: GameReport; players: PlayerIndex }) {
  const navigate = useNavigate()
  const g = report.game
  return (
    <section className={cx(styles['report-hero'], reveal.reveal)} style={cssVars({ i: 0 })} aria-labelledby="report-title">
      <div className={styles['report-hero__planet']}>
        <PlanetSlot region={g.map} board terra={0.42} className={styles['report-hero__slot']} label={`Marte, región de ${g.map}, con la grilla del tablero`} />
        <span className={styles['report-hero__coords']} aria-hidden="true">{coords(g.map)}</span>
      </div>
      <div className={styles['report-hero__text']}>
        <Button variant="ghost" size="s" icon="back" onClick={() => navigate(PATHS.games)}>Partidas</Button>
        <h1 className={styles['report-hero__title']} id="report-title"><MapGlyph glyph={MAPS[g.map].glyph} size={40} />{g.map}</h1>
        <p className={styles['report-hero__date']}>{fmtDate(g.date)}</p>
        <Chips report={report} />
        <WinPlate report={report} players={players} />
        <p className={cx(styles['report-hero__flavor'], 'flavor')}>{MAPS[g.map].blurb}</p>
      </div>
    </section>
  )
}
