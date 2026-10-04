import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { cssVars } from '@/domain/cssVars'
import { LAYERS, layerSeed, paintLayer, twinkles } from '@/fx/stars'
import { reducedMotion } from '@/ui/motion'
import styles from './Sky.module.css'

const METEOR_FIRST_MS = 6000

/** Repinta los lienzos con el tamaño del cielo (que ocupa todo el dispositivo): en forma
 * sincrónica al montar (D-39) y en cada cambio de tamaño. */
function usePaint(host: RefObject<HTMLElement | null>, canvases: RefObject<(HTMLCanvasElement | null)[]>) {
  useLayoutEffect(() => {
    const el = host.current
    if (!el) return undefined
    const draw = () => canvases.current?.forEach((c, i) => c && paintLayer(c, LAYERS[i], el.offsetWidth, el.offsetHeight, layerSeed(i)))
    draw()
    let pending = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(pending)
      pending = requestAnimationFrame(draw)
    })
    observer.observe(el)
    return () => { observer.disconnect(); cancelAnimationFrame(pending) }
  }, [host, canvases])
}

/** Paralaje con el puntero sobre el dispositivo; con movimiento reducido el cielo queda quieto (D-11). */
function useParallax(sky: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame || reducedMotion()) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const el = sky.current
        if (!el) return
        const r = el.getBoundingClientRect()
        el.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
        el.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
      })
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => { document.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame) }
  }, [sky])
}

/** Un meteoro de vez en cuando (nunca con movimiento reducido ni con la pestaña oculta). */
function useMeteor(meteor: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let timer = 0
    const launch = () => {
      const el = meteor.current
      if (el && !reducedMotion() && !document.hidden) {
        el.style.setProperty('--top', `${8 + Math.random() * 35}%`)
        el.style.setProperty('--left', `${25 + Math.random() * 60}%`)
        el.classList.remove(styles['is-on'])
        void el.offsetWidth
        el.classList.add(styles['is-on'])
      }
      timer = window.setTimeout(launch, 16000 + Math.random() * 22000)
    }
    timer = window.setTimeout(launch, METEOR_FIRST_MS)
    return () => window.clearTimeout(timer)
  }, [meteor])
}

/** El cielo del escenario: nebulosa, tres capas de estrellas, titileos y meteoros. */
export function Sky() {
  const sky = useRef<HTMLDivElement>(null)
  const canvases = useRef<(HTMLCanvasElement | null)[]>([])
  const meteor = useRef<HTMLElement>(null)
  const stars = useMemo(twinkles, [])
  usePaint(sky, canvases)
  useParallax(sky)
  useMeteor(meteor)
  return (
    <div className={styles.sky} ref={sky} aria-hidden="true">
      <div className={styles.sky__nebula} />
      {LAYERS.map((layer, i) => (
        <canvas key={layer.depth} className={styles.sky__layer} style={cssVars({ depth: `${layer.depth}px` })}
          ref={(c) => { canvases.current[i] = c }} />
      ))}
      {stars.map((s) => (
        <i key={`${s.left}${s.top}`} className={styles.sky__twinkle}
          style={cssVars({ left: s.left, top: s.top, delay: s.delay, dur: s.duration })} />
      ))}
      <i className={styles.sky__meteor} ref={meteor} />
    </div>
  )
}
