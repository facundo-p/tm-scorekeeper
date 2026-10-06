import { useEffect, useRef, type RefObject } from 'react'
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

/**
 * La primera vez que `active` es verdadero estalla el confetti sobre el nombre del ganador. Corre
 * hasta apagarse solo; se corta (y se limpia el lienzo) recién al desmontar. En el mockup el
 * efecto dependía de la fase y se cortaba al pasar a la siguiente (D-77).
 */
export function useConfetti(active: boolean, canvas: RefObject<HTMLCanvasElement | null>, target: RefObject<HTMLElement | null>, colors: (string | undefined)[]) {
  const cancel = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (!active || cancel.current || !canvas.current) return
    cancel.current = burst(canvas.current, { colors: tokenColors(colors), ...originOf(canvas.current, target.current) })
    // Los colores salen del mismo informe: con `active` alcanza.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
  useEffect(() => () => cancel.current?.(), [])
}
