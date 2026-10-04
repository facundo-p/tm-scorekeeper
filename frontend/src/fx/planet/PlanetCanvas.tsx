import { useContext, useEffect, useRef, useState } from 'react'
import { PlanetContext } from './context'
import styles from './planet.module.css'

/**
 * Lienzo del planeta persistente. Va en la capa `.fx` del marco, hija directa del dispositivo,
 * que es contra lo que se mide (como `host` en el mockup). El motor se carga en un chunk aparte;
 * hasta entonces, y sin WebGL2, los slots dibujan el globo CSS.
 */
export function PlanetCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const { setStage } = useContext(PlanetContext)
  const [supported, setSupported] = useState(true)
  useEffect(() => {
    let disposed = false
    let destroy = () => {}
    import('./stage').then(({ createPlanetStage }) => {
      const el = canvas.current
      const host = el?.parentElement?.parentElement
      if (disposed || !el || !host) return
      const stage = createPlanetStage(host, el)
      destroy = () => stage.destroy()
      setSupported(stage.supported)
      setStage(stage)
    })
    return () => { disposed = true; destroy(); setStage(null) }
  }, [setStage])
  return supported ? <canvas ref={canvas} className={styles.canvas} aria-hidden="true" /> : null
}
