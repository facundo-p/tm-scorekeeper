import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/http'
import { useSavePlayer, type PlayerWrite } from '@/data/mutations'
import type { PlayerSummary } from '@/data/types'
import { Button, Cube, Field, inputClassFor, NewBadge } from '@/ui/atoms'
import field from '@/ui/atoms/Field.module.css'
import { cx } from '@/ui/cx'
import { Sheet, SheetActions } from '@/ui/sheet'
import { COLORS, firstFreeColor, takenColors } from './model'
import styles from './PlayerSheet.module.css'

const errorText = (e: unknown) =>
  e instanceof ApiError && e.status === 409 ? 'Ese color ya lo usa otro jugador activo.' : e ? 'No se pudo guardar el jugador.' : null

function CubePick({ value, taken, onPick }: { value: string; taken: Set<string>; onPick: (c: string) => void }) {
  return (
    <fieldset className={cx(field.field, styles.pform__set)}>
      <legend className={field.field__label}>Color de cubo <NewBadge /></legend>
      <div className={styles.cubepick}>
        {COLORS.map((c) => (
          <label key={c} className={cx(styles.cubepick__opt, value === c && styles['is-on'], taken.has(c) && styles['is-taken'])}>
            <input type="radio" name="cube" value={c} checked={value === c} onChange={() => onPick(c)} />
            <Cube color={c} size={28} /><span>{c}{taken.has(c) ? ' (en uso)' : ''}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** Estado del formulario: nombre, color (en un alta, el primero libre) y guardado. */
function usePlayerForm(player: PlayerSummary | undefined, players: PlayerSummary[], onClose: () => void) {
  const taken = takenColors(players, player?.player_id)
  const [name, setName] = useState(player?.name ?? '')
  const [color, setColor] = useState(() => player?.color ?? firstFreeColor(taken))
  const save = useSavePlayer(onClose)
  const send = (body: PlayerWrite) => save.mutate({ id: player?.player_id ?? null, body })
  const submit = (e: FormEvent) => { e.preventDefault(); send({ name: name.trim(), color }) }
  return { taken, name, setName, color, setColor, send, submit, busy: save.isPending, error: errorText(save.error) }
}

interface ActionsProps { player?: PlayerSummary; busy: boolean; onToggle: () => void; onClose: () => void }

function Actions({ player, busy, onToggle, onClose }: ActionsProps) {
  return (
    <SheetActions>
      {player && <Button variant="danger" onClick={onToggle}>{player.is_active ? 'Desactivar' : 'Reactivar'}</Button>}
      <Button variant="ghost" onClick={onClose}>Cancelar</Button>
      <Button variant="primary" type="submit" disabled={busy}>{player ? 'Guardar cambios' : 'Agregar jugador'}</Button>
    </SheetActions>
  )
}

interface PlayerSheetProps { player?: PlayerSummary; players: PlayerSummary[]; onClose: () => void }

/** Alta o edición de un jugador: nombre y color de cubo; al editar, desactivar o reactivar. */
export function PlayerSheet({ player, players, onClose }: PlayerSheetProps) {
  const f = usePlayerForm(player, players, onClose)
  return (
    <Sheet title={player ? `Editar a ${player.name}` : 'Nuevo jugador'} onClose={onClose}>
      <form className={styles.pform} onSubmit={f.submit}>
        <Field label="Nombre">
          <input className={inputClassFor()} id="player-name" value={f.name} onChange={(e) => f.setName(e.target.value)} autoComplete="off" required />
        </Field>
        <CubePick value={f.color} taken={f.taken} onPick={f.setColor} />
        {!player && <p className="faint">Empieza con 1000 de ELO. Aparece en el ranking después de su primera partida.</p>}
        {f.error && <p className={styles.pform__error} role="alert">{f.error}</p>}
        <Actions player={player} busy={f.busy} onToggle={() => player && f.send({ is_active: !player.is_active })} onClose={onClose} />
      </form>
    </Sheet>
  )
}
