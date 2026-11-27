// Color de cubo de un jugador en esta partida (D-88): uno de los cinco del juego.
import { GAME_COLORS } from '@/data/instruments'
import { Cube } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import styles from './Register.module.css'

interface CubePickerProps {
  /** Nombre del jugador (para la etiqueta del grupo). */
  name: string
  /** Color que se ve hoy (el elegido o el suyo). */
  value: string | undefined
  /** Colores que ya usan los demás, con el nombre de quién. */
  takenBy: Record<string, string>
  onPick: (color: string) => void
}

export function CubePicker({ name, value, takenBy, onPick }: CubePickerProps) {
  return (
    <div role="radiogroup" aria-label={`Color de ${name} en esta partida`} className={styles.cubepick}>
      {GAME_COLORS.map((c) => {
        const by = takenBy[c]
        return (
          <button key={c} type="button" role="radio" aria-checked={value === c} disabled={!!by}
            className={cx(styles.cubepick__opt, value === c && styles['is-on'])}
            aria-label={by ? `${c} (lo usa ${by})` : c} title={by ? `Lo usa ${by}` : c} onClick={() => onPick(c)}>
            <Cube color={c} size={18} />
          </button>
        )
      })}
    </div>
  )
}
