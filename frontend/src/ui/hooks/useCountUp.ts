import { useEffect, useState } from 'react'
import { reducedMotion } from '../motion'

interface CountUpOptions {
  duration?: number
  delay?: number
  from?: number
}

const easeOutCubic = (p: number) => 1 - (1 - p) ** 3

/** Valor que sube de `from` a `target` (ease-out); con reduced-motion va directo al final. */
export function useCountUp(target: number, { duration = 900, delay = 0, from = 0 }: CountUpOptions = {}) {
  const [v, setV] = useState(() => (reducedMotion() ? target : from))
  useEffect(() => {
    if (reducedMotion()) { setV(target); return undefined }
    let raf = 0
    let t0 = 0
    const tick = (now: number) => {
      if (!t0) t0 = now + delay
      const p = Math.min(1, Math.max(0, (now - t0) / duration))
      setV(from + (target - from) * easeOutCubic(p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, delay, from])
  return v
}
