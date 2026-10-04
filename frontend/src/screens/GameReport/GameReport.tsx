// Informe de partida (F29, SCR-04): port de docs/redesign/mockup/js/screens/game.js con datos de la API.
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { bySignup, eloShift, playerIndex, type PlayerIndex } from '@/data/instruments'
import { useGameReport, usePlayersList } from '@/data/hooks'
import type { GameReport as Report } from '@/data/types'
import { PATHS } from '@/shell/paths'
import { Button, Notice, Plate, SectionHead } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { useSearchParam } from '@/ui/hooks/useSearchParam'
import { EloShift } from '@/ui/instruments'
import reveal from '@/ui/reveal.module.css'
import { EmptyState, ErrorState, LoadingState } from '@/ui/states'
import { AchievementsInGame, RecordsInGame } from './Achievements'
import { Board } from './Board'
import { DeleteSheet } from './DeleteSheet'
import { FinalScore } from './FinalScore'
import { ReportHero } from './ReportHero'
import styles from './GameReport.module.css'

const NOTICES: Record<string, string> = {
  editada: 'Cambios guardados. Se recalcularon el ELO, los récords y los logros desde esta partida.',
}

function Actions({ id, onDelete }: { id: string; onDelete: () => void }) {
  const navigate = useNavigate()
  return (
    <div className={styles['report-actions']}>
      <Button icon="spark" onClick={() => navigate(PATHS.ceremony(id))}>Repetir ceremonia</Button>
      <Button variant="ghost" icon="edit" onClick={() => navigate(PATHS.edit(id))}>Editar partida</Button>
      <Button variant="danger" icon="close" onClick={onDelete}>Eliminar</Button>
    </div>
  )
}

function ReportBody({ report, players, rank }: { report: Report; players: PlayerIndex; rank: (id: string) => number }) {
  const [confirm, setConfirm] = useState(false)
  const [aviso] = useSearchParam('aviso')
  return (
    <>
      {aviso && NOTICES[aviso] && <Notice>{NOTICES[aviso]}</Notice>}
      <ReportHero report={report} players={players} />
      <div className={styles['report-grid']}>
        <FinalScore report={report} players={players} />
        <Board report={report} players={players} />
        <Plate className={cx(reveal.reveal, styles['report-elo'])} label="Cambios de ELO">
          <SectionHead title="ELO"><span>K = 32, por pares</span></SectionHead>
          <EloShift changes={eloShift(report, players)} />
        </Plate>
        <RecordsInGame report={report} players={players} />
        <AchievementsInGame report={report} players={players} rank={rank} />
      </div>
      <Actions id={report.game.id} onDelete={() => setConfirm(true)} />
      {confirm && <DeleteSheet report={report} onClose={() => setConfirm(false)} />}
    </>
  )
}

export default function GameReport() {
  const { gameId = '' } = useParams()
  const r = useGameReport(gameId)
  const p = usePlayersList()
  const players = useMemo(() => playerIndex(p.players ?? []), [p.players])
  const order = useMemo(() => bySignup(p.players ?? []).map((x) => x.player_id), [p.players])
  if (r.error && 'status' in r.error && r.error.status === 404) return <EmptyState icon="search" title="Esta partida no está en el archivo" />
  if (r.error || p.error) return <ErrorState onRetry={() => { r.refetch(); p.refetch() }} />
  if (!r.report || !p.players) return <LoadingState />
  return <ReportBody report={r.report} players={players} rank={(id) => order.indexOf(id)} />
}
