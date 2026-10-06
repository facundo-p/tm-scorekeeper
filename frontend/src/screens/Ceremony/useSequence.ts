import { useEffect, useState } from 'react'
import { reducedMotion } from '@/ui/motion'

/**
 * Fases de la ceremonia: arranca a los 700 ms y avanza cada 950 ms hasta `total`.
 * Con reduced-motion empieza en el final. `skip` salta al final.
 */
export function useSequence(total: number, step = 950, start = 700): [number, () => void] {
  const [phase, setPhase] = useState(() => (reducedMotion() ? total : 0))
  useEffect(() => {
    if (phase >= total) return undefined
    const t = window.setTimeout(() => setPhase((p) => p + 1), phase === 0 ? start : step)
    return () => window.clearTimeout(t)
  }, [phase, total, step, start])
  return [phase, () => setPhase(total)]
}
