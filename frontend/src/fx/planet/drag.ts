// Arrastre del globo en un slot interactivo: gira con el dedo y conserva la inercia al soltar.
import { wrapAngle, type Spin } from './motion'

/** Engancha el arrastre a `el`; `turn(dA)` gira el globo cuando el slot no apunta a una región. Devuelve el desenganche. */
export function attachDrag(el: HTMLElement, spin: Spin, turn: (dA: number) => void) {
  let lastX = 0
  let lastT = 0
  const down = (e: PointerEvent) => {
    spin.dragging = true
    lastX = e.clientX
    lastT = performance.now()
    el.setPointerCapture?.(e.pointerId)
    el.classList.add('is-dragging')
  }
  const move = (e: PointerEvent) => {
    if (!spin.dragging) return
    const now = performance.now()
    const dA = ((e.clientX - lastX) / (el.getBoundingClientRect().width || 300)) * Math.PI
    spin.angle = wrapAngle(spin.angle + dA)
    turn(dA)
    spin.vel = dA / Math.max(0.008, (now - lastT) / 1000)
    lastX = e.clientX
    lastT = now
  }
  const up = () => {
    spin.dragging = false
    el.classList.remove('is-dragging')
    spin.vel = Math.max(-3, Math.min(3, spin.vel))
  }
  const events = [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up]] as const
  events.forEach(([name, fn]) => el.addEventListener(name, fn as EventListener))
  return () => events.forEach(([name, fn]) => el.removeEventListener(name, fn as EventListener))
}
