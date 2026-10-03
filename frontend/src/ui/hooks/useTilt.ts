import { useEffect, useRef } from 'react'
import { noHover, reducedMotion } from '../motion'

/**
 * Inclinación con el puntero y un brillo que lo sigue (medallas, placas). Escribe
 * --rx/--ry/--gx/--gy en el elemento y le pone `tiltingClass` mientras se mueve.
 * Sin efecto con reduced-motion o sin hover.
 */
export function useTilt<T extends HTMLElement>(max: number, tiltingClass: string) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || noHover()) return undefined
    let raf = 0
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width
        const y = (e.clientY - r.top) / r.height
        el.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`)
        el.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`)
        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`)
        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`)
        el.classList.add(tiltingClass)
      })
    }
    const leave = () => {
      cancelAnimationFrame(raf)
      el.classList.remove(tiltingClass)
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [max, tiltingClass])
  return ref
}
