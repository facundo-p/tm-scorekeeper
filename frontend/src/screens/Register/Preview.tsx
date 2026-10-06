// Vista previa al costado: el planeta en la región del mapa y la tabla provisoria.
import type { PlayerIndex } from '@/data/instruments'
import { mapInfo } from '@/domain/catalog'
import { PlanetSlot } from '@/fx/planet'
import { CorpEmblem, Cube } from '@/ui/atoms'
import plate from '@/ui/atoms/Plate.module.css'
import { cx } from '@/ui/cx'
import { MapGlyph } from '@/ui/icons'
import { derived, type WizardState } from './model'
import styles from './Register.module.css'

/** En los pasos de puntos la tabla se esconde: la reemplaza el marcador provisorio de arriba. */
export function Preview({ s, players, table }: { s: WizardState; players: PlayerIndex; table: boolean }) {
  const rows = derived(s).rows.sort((a, b) => b.total - a.total)
  return (
    <aside className={styles.wpreview} aria-label="Vista previa">
      <PlanetSlot region={s.map || null} board={!!s.map} terra={0.3} className={styles.wpreview__slot} label={s.map ? `Región de ${s.map}` : 'Marte'} />
      <div className={cx(plate.plate, plate['plate--glass'], styles.wpreview__card)} data-sheen>
        <p className={styles.wpreview__map}>{s.map ? <><MapGlyph glyph={mapInfo(s.map).glyph} size={20} />{s.map}</> : 'Elegí un mapa'}</p>
        {table && <ul className={styles.wpreview__table}>
          {rows.map((r) => {
            const corp = s.players.find((p) => p.id === r.id)?.corp
            return (
              <li key={r.id}><Cube color={players.get(r.id)?.color} size={15} /><span>{players.get(r.id)?.name}</span>
                {corp && <CorpEmblem name={corp} size="s" />}<b>{r.total}</b></li>
            )
          })}
        </ul>}
        {table && !s.players.length && <p className="faint">Los jugadores aparecen acá a medida que los elegís.</p>}
      </div>
    </aside>
  )
}
