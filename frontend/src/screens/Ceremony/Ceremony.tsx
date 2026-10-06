// Ceremonia de fin de partida (F31, SCR-07): port de docs/redesign/mockup/js/screens/ceremony.js con
// datos de la API. Una sola secuencia: se suma categoría por categoría (las filas se reordenan), y
// después aterrizan el ganador (con confetti), el ELO, los récords y los logros.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { bySignup, playerIndex, type PlayerIndex } from '@/data/instruments'
import { useGameReport, usePlayersList } from '@/data/hooks'
import type { GameReport } from '@/data/types'
import { mapInfo, type CategoryInfo } from '@/domain/catalog'
import { fmtDate } from '@/domain/format'
import { PlanetCanvas, PlanetSlot } from '@/fx/planet'
import { PATHS } from '@/shell/paths'
import { Sky } from '@/shell/Sky'
import { Button } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Frame } from '@/ui/frame'
import { Icon, MapGlyph } from '@/ui/icons'
import instruments from '@/ui/instruments/instruments.module.css'
import { EmptyState, ErrorState, LoadingState } from '@/ui/states'
import { AchBlock, EloBlock, RecordsBlock, WinnerBanner } from './Blocks'
import { ceremonyCats, statusText } from './model'
import { Tally } from './Tally'
import { useConfetti } from './useConfetti'
import { useSequence } from './useSequence'
import styles from './Ceremony.module.css'

interface SceneProps { report: GameReport; players: PlayerIndex; rank: (id: string) => number }

function Head({ report, onSkip }: { report: GameReport; onSkip?: () => void }) {
  const g = report.game
  return (
    <header className={styles.cer__head}>
      <span className={styles.cer__map}><MapGlyph glyph={mapInfo(g.map).glyph} size={26} />{g.map}<small>{fmtDate(g.date)}, {g.generations} generaciones</small></span>
      {onSkip && <Button variant="ghost" size="s" onClick={onSkip}>Saltar animación</Button>}
    </header>
  )
}

function Actions({ id }: { id: string }) {
  const navigate = useNavigate()
  return (
    <div className={styles.cer__actions}>
      <Button variant="primary" size="l" onClick={() => navigate(PATHS.game(id))}>Ver informe completo</Button>
      <Button variant="ghost" icon="home" onClick={() => navigate(PATHS.home)}>Volver al inicio</Button>
    </div>
  )
}

/** Qué se está sumando; al final queda un h1 oculto para que la pantalla no pierda su título. */
function CategoryCue({ cat, done }: { cat?: CategoryInfo; done: boolean }) {
  return (
    <div className={styles.cer__cat}>
      {done ? <h1 className="vh">Puntaje final</h1>
        : cat ? <span className={cx(styles.cer__catchip, instruments[`catkey--${cat.key}`])}><Icon name={cat.icon} size={22} />{cat.long}</span>
          : <h1 className={styles.cer__title}>Puntaje final</h1>}
    </div>
  )
}

function After({ phase, N, report, players, rank }: SceneProps & { phase: number; N: number }) {
  return (
    <>
      <div className={styles.cer__after}>
        {phase >= N + 2 && <EloBlock report={report} players={players} />}
        {phase >= N + 3 && <RecordsBlock report={report} players={players} />}
        {phase >= N + 4 && <AchBlock report={report} players={players} rank={rank} />}
      </div>
      {phase >= N + 5 && <Actions id={report.game.id} />}
    </>
  )
}

/** Secuencia de la ceremonia; al saltarla, el foco va al nombre del ganador. */
function useCeremony(report: GameReport) {
  const cats = useMemo(() => ceremonyCats(report.game.expansions), [report])
  const [phase, skip] = useSequence(cats.length + 5)
  const [skipped, setSkipped] = useState(false)
  const winner = useRef<HTMLHeadingElement>(null)
  const done = phase > cats.length
  useEffect(() => { if (skipped && done) winner.current?.focus() }, [skipped, done])
  return { cats, phase, done, winner, shown: Math.min(cats.length, phase), skip: () => { setSkipped(true); skip() } }
}

function Scene({ report, players, rank }: SceneProps) {
  const { cats, phase, done, winner, shown, skip } = useCeremony(report)
  const N = cats.length
  const canvas = useRef<HTMLCanvasElement>(null)
  useConfetti(phase === N + 1, canvas, winner, report.results.map((r) => players.get(r.player_id)?.color))
  return (
    <div className={styles.cer}>
      <div className={styles.cer__planet}><PlanetSlot terra={0.35} tilt={0.15} bright={0.75} className={styles.cer__slot} /></div>
      <canvas className={styles.cer__confetti} ref={canvas} aria-hidden="true" />
      <Head report={report} onSkip={phase < N + 5 ? skip : undefined} />
      <div className={styles.cer__main}>
        <p className={styles.cer__status} aria-live="polite">{statusText(cats, shown, done)}</p>
        <CategoryCue key={shown} cat={cats[shown - 1]} done={done} />
        {done && <WinnerBanner report={report} players={players} nameRef={winner} />}
        <Tally results={report.results} cats={cats} shown={shown} players={players} />
        <After phase={phase} N={N} report={report} players={players} rank={rank} />
      </div>
    </div>
  )
}

function CeremonyData() {
  const { gameId = '' } = useParams()
  const r = useGameReport(gameId)
  const p = usePlayersList()
  const players = useMemo(() => playerIndex(p.players ?? []), [p.players])
  const order = useMemo(() => bySignup(p.players ?? []).map((x) => x.player_id), [p.players])
  if (r.error && 'status' in r.error && r.error.status === 404) return <EmptyState icon="search" title="Esta partida no está en el archivo" />
  if (r.error || p.error) return <ErrorState onRetry={() => { r.refetch(); p.refetch() }} />
  if (!r.report || !p.players) return <LoadingState />
  return <Scene report={r.report} players={players} rank={(id) => order.indexOf(id)} />
}

/** Marco desnudo (sin navegación), como el acceso: la ceremonia ocupa toda la pantalla. */
export default function Ceremony() {
  return (
    <Frame screen="ceremony" variant="bare" sky={<><Sky /><PlanetCanvas /></>}>
      <CeremonyData />
    </Frame>
  )
}
