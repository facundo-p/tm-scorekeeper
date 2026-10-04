import { useContext, useEffect, useRef, useState } from 'react'
import { PlanetContext } from './context'
import { fallbackStage } from './fallback'
import type { PlanetStage } from './stage'
import styles from './planet.module.css'

/**
 * Lienzo del planeta persistente, en la capa `.fx` del marco. Se mide contra el dispositivo
 * (`[data-device]`, como `host` en el mockup). El motor se carga en un chunk aparte; hasta
 * entonces, y si no hay WebGL2 o el chunk no carga, los slots dibujan el globo CSS.
 */
export function PlanetCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const { setStage } = useContext(PlanetContext)
  const [supported, setSupported] = useState(true)
  useEffect(() => {
    let disposed = false
    let stage: PlanetStage | null = null
    const publish = (next: PlanetStage) => {
      if (disposed) { next.destroy(); return }
      stage = next
      setSupported(next.supported)
      setStage(next)
    }
    import('./stage')
      .then(({ createPlanetStage }) => {
        const el = canvas.current
        const host = el?.closest<HTMLElement>('[data-device]')
        if (!disposed) publish(el && host ? createPlanetStage(host, el) : fallbackStage())
      })
      .catch(() => publish(fallbackStage()))
    return () => { disposed = true; stage?.destroy(); setStage(null) }
  }, [setStage])
  return supported ? <canvas ref={canvas} className={styles.canvas} aria-hidden="true" /> : null
}
