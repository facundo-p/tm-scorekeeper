import { useEffect, useMemo, useRef } from 'react'
import { cx } from '@/ui/cx'
import { usePlanetStage } from './context'
import { DEFAULTS, type SlotParams } from './motion'
import type { SlotHandle } from './stage'
import styles from './planet.module.css'

interface PlanetSlotProps extends Partial<SlotParams> {
  className?: string
  /** Si el globo dice algo (por ejemplo, el mapa de la partida), es una imagen con nombre. */
  label?: string
}

/**
 * Una pantalla pide el planeta dibujando un slot vacío: el motor persistente lleva el globo ahí
 * (port de docs/redesign/mockup/js/ui/planet-slot.js). Sin WebGL2, el slot pinta un globo CSS.
 */
export function PlanetSlot({ className, label, ...props }: PlanetSlotProps) {
  const stage = usePlanetStage()
  const ref = useRef<HTMLDivElement>(null)
  const handle = useRef<SlotHandle | null>(null)
  const { region, terra, board, fill, interactive, bright, glow, tilt } = { ...DEFAULTS, ...props }
  const params = useMemo(() => ({ region, terra, board, fill, interactive, bright, glow, tilt }), [region, terra, board, fill, interactive, bright, glow, tilt])
  const latest = useRef(params)
  latest.current = params

  useEffect(() => {
    if (!stage?.supported || !ref.current) return undefined
    handle.current = stage.addSlot(ref.current, latest.current)
    return () => { handle.current?.remove(); handle.current = null }
  }, [stage])
  useEffect(() => { handle.current?.update(params) }, [params])

  const fallback = stage !== null && !stage.supported
  return (
    <div ref={ref} data-planet-slot className={cx(styles.slot, interactive && styles['slot--grab'], className)}
      role={label ? 'img' : undefined} aria-label={label}>
      {fallback && <span className={styles.fallback} aria-hidden="true" />}
    </div>
  )
}
