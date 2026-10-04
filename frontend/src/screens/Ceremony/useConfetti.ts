import { useEffect, type RefObject } from 'react'
import { burst } from '@/fx/confetti'

/** Colores de los jugadores (tokens `--p-<color>`) y el dorado del M€, leídos del CSS. */
function tokenColors(colors: (string | undefined)[]) {
  const css = getComputedStyle(document.documentElement)
  const read = (name: string) => css.getPropertyValue(name).trim()
  const gold = read('--mc') || '#f4c43a'
  return [...colors.map((c) => (c && read(`--p-${c}`)) || gold), gold, gold]
}

/** Centro de `target` en fracción del lienzo (o arriba al medio si no está). */
function originOf(canvas: HTMLCanvasElement, target: HTMLElement | null) {
  const c = canvas.getBoundingClientRect()
  const w = target?.getBoundingClientRect()
  if (!w || !c.width || !c.height) return { x: 0.5, y: 0.3 }
  return { x: (w.left + w.width / 2 - c.left) / c.width, y: (w.top + w.height / 2 - c.top) / c.height }
}

/** Cuando `active` pasa a verdadero, estalla el confetti sobre el nombre del ganador. */
export function useConfetti(active: boolean, canvas: RefObject<HTMLCanvasElement | null>, target: RefObject<HTMLElement | null>, colors: (string | undefined)[]) {
  useEffect(() => {
    if (!active || !canvas.current) return undefined
    return burst(canvas.current, { colors: tokenColors(colors), ...originOf(canvas.current, target.current) })
    // Los colores salen del mismo informe: con `active` alcanza.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
