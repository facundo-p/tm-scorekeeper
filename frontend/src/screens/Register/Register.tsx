// Registrar y editar partida (F30, SCR-05..06): port de docs/redesign/mockup/js/screens/register.js.
import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '@/api/http'
import { bySignup, playerIndex, type PlayerIndex } from '@/data/instruments'
import { fmtDate } from '@/domain/format'
import { useGameReport, usePlayersList } from '@/data/hooks'
import type { PlayerLike } from '@/ui/atoms'
import { Button, NewBadge, Plate } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { ScreenHead } from '@/ui/frame'
import { Icon } from '@/ui/icons'
import { EmptyState, ErrorState, LoadingState } from '@/ui/states'
import { loadDraft } from './draft'
import { ErrorList } from './ErrorList'
import { stateFromGame, type SavedGame } from './io'
import { blankState, STEPS, type WizardState } from './model'
import { Preview } from './Preview'
import { ScorePad } from './ScorePad'
import { StepBoard } from './StepBoard'
import { StepGame } from './StepGame'
import { StepReview } from './StepReview'
import { StepTable } from './StepTable'
import { useWizard } from './useWizard'
import { WizardSteps } from './WizardSteps'
import styles from './Register.module.css'

const VIEWS = [StepGame, StepTable, StepBoard, ScorePad, StepReview]

function Subtitle({ s, saved }: { s: WizardState; saved: boolean }) {
  return (
    <>
      {s.example ? 'Ejemplo precargado con la partida del 27 de septiembre.' : s.editing ? null : 'Partida nueva.'}
      <span className={cx(styles.draftnote, saved && styles['is-saved'])}><Icon name="check" size={14} />Borrador guardado <NewBadge /></span>
    </>
  )
}

function NavButtons({ w }: { w: ReturnType<typeof useWizard> }) {
  const { s } = w
  const last = s.step === STEPS.length - 1
  return (
    <div className={styles.wizard__nav}>
      {s.step > 0 ? <Button icon="back" onClick={() => w.go(s.step - 1)}>Atrás</Button> : <span />}
      {!last && <Button variant="primary" onClick={w.next}>{`Siguiente: ${STEPS[s.step + 1]}`}</Button>}
      {last && <Button variant="primary" size="l" icon="check" disabled={w.saving} onClick={w.submit}>{s.editing ? 'Guardar cambios' : 'Guardar partida'}</Button>}
    </div>
  )
}

interface WizardProps { initial: WizardState; players: PlayerIndex; active: PlayerLike[]; editSub?: string }

function Wizard({ initial, players, active, editSub }: WizardProps) {
  const w = useWizard(initial, (id) => players.get(id)?.name ?? id)
  const View = VIEWS[w.s.step]
  const saveError = w.saveError instanceof ApiError ? w.saveError.message : w.saveError ? 'No se pudo guardar la partida.' : null
  return (
    <>
      <ScreenHead title={w.s.editing ? 'Editar partida' : 'Registrar partida'} revealAt={0} sub={<>{editSub}<Subtitle s={w.s} saved={w.saved} /></>}>
        {w.s.example && <Button variant="ghost" size="s" icon="close" onClick={w.reset}>Empezar en blanco</Button>}
      </ScreenHead>
      <WizardSteps step={w.s.step} onJump={w.go} />
      <div className={styles.wizard}>
        <Plate className={styles.wizard__main} label={STEPS[w.s.step]}>
          <h2 className={styles.wizard__title}>{STEPS[w.s.step]}</h2>
          <ErrorList errors={saveError ? [{ field: 'save', msg: saveError }, ...w.errors] : w.errors} />
          <View s={w.s} d={w.d} errors={w.errors} players={players} active={active} />
          <NavButtons w={w} />
        </Plate>
        <Preview s={w.s} players={players} />
      </div>
    </>
  )
}

/** Ejemplo precargado (`?ejemplo=<id>`, solo en modo comparación, D-76) y paso inicial (`?step=`, como el mockup). */
function useExample() {
  const [params] = useSearchParams()
  if (import.meta.env.MODE !== 'parity') return { id: null, step: 0 }
  return { id: params.get('ejemplo'), step: Math.max(0, Math.min(STEPS.length - 1, Number(params.get('step')) || 0)) }
}

function usePlayers() {
  const p = usePlayersList()
  const players = useMemo(() => playerIndex(p.players ?? []), [p.players])
  const active = useMemo(() => bySignup(p.players ?? []).filter((x) => x.is_active).map((x) => players.get(x.player_id)!), [p.players, players])
  return { players, active, ready: !!p.players, error: p.error, refetch: p.refetch }
}

function editSubtitle(g: SavedGame) {
  return `Partida del ${fmtDate(g.date)} en ${g.map}. Al guardar se recalculan el ELO, los récords y los logros.`
}

/** Registrar: borrador o en blanco; con `?ejemplo=` (comparación) o en `/editar`, precargado con una partida guardada. */
export default function Register() {
  const { gameId } = useParams()
  const example = useExample()
  const source = gameId ?? example.id
  const r = useGameReport(source ?? '', !!source)
  const p = usePlayers()
  if ((source && r.error) || p.error) {
    return r.error instanceof ApiError && r.error.status === 404
      ? <EmptyState icon="search" title="Esta partida no está en el archivo" />
      : <ErrorState onRetry={() => { r.refetch(); p.refetch() }} />
  }
  if (!p.ready || (source && !r.report)) return <LoadingState />
  const game = r.report?.game as SavedGame | undefined
  const initial = gameId && game ? stateFromGame(game, { editing: gameId })
    : example.id && game ? stateFromGame(game, { example: true, step: example.step })
      : loadDraft() ?? blankState()
  return <Wizard key={source ?? 'nueva'} initial={initial} players={p.players} active={p.active} editSub={gameId && game ? editSubtitle(game) : undefined} />
}
