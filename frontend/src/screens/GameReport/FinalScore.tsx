import { useState } from 'react'
import { scoredGame, type PlayerIndex } from '@/data/instruments'
import type { GameReport } from '@/data/types'
import { Button, CorpEmblem, Cube, Plate, SectionHead } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { CategoryLegend, categoriesOf, ScoreBars, TRTrack } from '@/ui/instruments'
import reveal from '@/ui/reveal.module.css'
import styles from './GameReport.module.css'

/** Pista de TR, barras por categoría (o tabla) y la corporación de cada uno. */
export function FinalScore({ report, players }: { report: GameReport; players: PlayerIndex }) {
  const [table, setTable] = useState(false)
  const game = scoredGame(report, players)
  return (
    <Plate className={cx(reveal.reveal, styles['report-score'])} label="Puntaje final">
      <SectionHead title="Puntaje final">
        <Button variant="ghost" size="s" icon={table ? 'chart' : 'table'} pressed={table} onClick={() => setTable(!table)}>
          {table ? 'Ver barras' : 'Ver tabla'}</Button>
      </SectionHead>
      <TRTrack results={game.results} />
      <div className={styles['report-score__legend']}><CategoryLegend categories={categoriesOf(game.expansions)} /></div>
      <ScoreBars game={game} showTable={table} />
      <ul className={styles['report-score__corps']}>
        {report.results.map((r) => (
          <li key={r.player_id}><Cube color={players.get(r.player_id)?.color} size={12} /><CorpEmblem name={r.corporation} size="s" withName />
            <span className="faint">{r.mc_total} M€</span></li>
        ))}
      </ul>
    </Plate>
  )
}
