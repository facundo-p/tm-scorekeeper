import { MAPS } from '@/domain/catalog'
import { MapGlyph } from '../icons'
import styles from './MapBadge.module.css'

interface MapBadgeProps {
  map: string
  size?: number
  withName?: boolean
}

export function MapBadge({ map, size = 22, withName = true }: MapBadgeProps) {
  return (
    <span className={styles.mapbadge}>
      <MapGlyph glyph={MAPS[map]?.glyph} size={size} label={withName ? null : map} />
      {withName && <span className={styles.mapbadge__name}>{map}</span>}
    </span>
  )
}
