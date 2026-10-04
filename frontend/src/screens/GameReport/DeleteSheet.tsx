import { useNavigate } from 'react-router-dom'
import { useDeleteGame } from '@/data/mutations'
import type { GameReport } from '@/data/types'
import { fmtDate } from '@/domain/format'
import { PATHS } from '@/shell/paths'
import { Button } from '@/ui/atoms'
import { Sheet, SheetActions } from '@/ui/sheet'
import styles from './GameReport.module.css'

/** Eliminar pregunta antes: se recalcula todo lo que vino después de la partida (#44). */
export function DeleteSheet({ report, onClose }: { report: GameReport; onClose: () => void }) {
  const navigate = useNavigate()
  const del = useDeleteGame()
  const { id, date, map } = report.game
  const confirm = () => del.mutate(id, { onSuccess: () => navigate(`${PATHS.games}?aviso=eliminada`, { replace: true }) })
  return (
    <Sheet title="Eliminar partida" onClose={onClose}>
      <p>¿Eliminar la partida del <b>{fmtDate(date)}</b> en <b>{map}</b>? Se recalculan el ELO, los récords y los logros
        de todas las partidas posteriores. No se puede deshacer.</p>
      {del.isError && <p className={styles['report-delete__error']} role="alert">No se pudo eliminar la partida. Probá de nuevo.</p>}
      <SheetActions>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" icon="close" disabled={del.isPending} onClick={confirm}>Eliminar partida</Button>
      </SheetActions>
    </Sheet>
  )
}
