import type { PlayerIndex } from '@/data/instruments'
import { useSeasons } from '@/data/hooks'
import type { Seasons } from '@/data/types'
import { fmtDate } from '@/domain/format'
import { PlayerTag } from '@/ui/atoms'
import { Icon } from '@/ui/icons'
import { Sheet } from '@/ui/sheet'
import { MIN_SEASON_GAMES } from './model'
import styles from './Home.module.css'

function PastSeasons({ seasons, players }: { seasons: Seasons; players: PlayerIndex }) {
  const past = seasons.seasons.filter((s) => s.end)
  return (
    <ol className={styles.rules__past}>
      {past.map((s) => (
        <li key={s.number}>
          <span>Temporada {s.number}</span><span>{fmtDate(s.start, { short: true })} a {fmtDate(s.end!, { short: true })}</span>
          {s.champion ? <PlayerTag player={players.get(s.champion)} size="s" /> : <span className="faint">Sin campeón</span>}
        </li>
      ))}
    </ol>
  )
}

/** Hoja con las reglas de avance de la temporada y los campeones anteriores (se piden al abrirla). */
export function SeasonRules({ players, onClose }: { players: PlayerIndex; onClose: () => void }) {
  const { seasons } = useSeasons()
  return (
    <Sheet title="Cómo avanza la temporada" onClose={onClose}>
      <div className={styles.rules}>
        <p>El grupo terraforma su propio Marte, partida a partida. Los parámetros son los del tablero:</p>
        <ul className={styles.rules__list}>
          <li><Icon name="temperature" size={20} /><span><b>Temperatura:</b> cada partida suma casi un paso de 2 °C (19 pasos, de −30 a +8 °C).</span></li>
          <li><Icon name="oxygen" size={20} /><span><b>Oxígeno:</b> cada 52 puntos de vegetación del grupo suben 1 % (hasta 14 %).</span></li>
          <li><Icon name="ocean" size={20} /><span><b>Océanos:</b> se coloca uno cada dos o tres partidas (9 en total).</span></li>
        </ul>
        <p>Cuando los tres llegan al máximo, Marte queda terraformado y la temporada se cierra. La carrera se ordena por <b>promedio</b> de puntos por partida; hacen falta {MIN_SEASON_GAMES} partidas para clasificar.</p>
        <p>El campeón es el primer clasificado por promedio total al cierre. Si dos empatan, gana quien jugó más partidas, y después quien hizo el mejor puntaje.</p>
        <h3 className={styles.rules__h}>Temporadas anteriores</h3>
        {seasons && <PastSeasons seasons={seasons} players={players} />}
        <p className="flavor">«Con suficiente paciencia, hasta un desierto helado aprende a respirar.»</p>
      </div>
    </Sheet>
  )
}
