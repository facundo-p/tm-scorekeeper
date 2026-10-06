// Cielo de fondo (port de docs/redesign/mockup/js/fx/stars.js): tres lienzos de estrellas que se
// pintan una vez por tamaño y se mueven por CSS con el puntero, más estrellas que titilan.
import { rng } from './rand'

interface Layer {
  depth: number
  density: number
  size: [number, number]
  alpha: [number, number]
  glint?: boolean
}

export const LAYERS: Layer[] = [
  { depth: 6, density: 1 / 2600, size: [0.35, 0.9], alpha: [0.25, 0.7] },
  { depth: 14, density: 1 / 9000, size: [0.6, 1.3], alpha: [0.45, 0.9] },
  { depth: 26, density: 1 / 40000, size: [1, 1.8], alpha: [0.7, 1], glint: true },
]
const TINTS = ['255,244,230', '255,226,200', '214,226,255', '255,255,255']
export const MARGIN = 40

function glint(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, tint: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, s * 6)
  g.addColorStop(0, `rgba(${tint},${a * 0.35})`)
  g.addColorStop(1, `rgba(${tint},0)`)
  ctx.fillStyle = g
  ctx.fillRect(x - s * 6, y - s * 6, s * 12, s * 12)
  ctx.fillStyle = `rgba(${tint},${a * 0.5})`
  ctx.fillRect(x - s * 4, y - 0.35, s * 8, 0.7)
  ctx.fillRect(x - 0.35, y - s * 4, 0.7, s * 8)
}

function star(ctx: CanvasRenderingContext2D, layer: Layer, rand: () => number, w: number, h: number) {
  const x = rand() * w
  const y = rand() * h
  const s = layer.size[0] + rand() * (layer.size[1] - layer.size[0])
  const a = layer.alpha[0] + rand() * (layer.alpha[1] - layer.alpha[0])
  const tint = TINTS[Math.floor(rand() * TINTS.length)]
  ctx.fillStyle = `rgba(${tint},${a})`
  ctx.beginPath()
  ctx.arc(x, y, s, 0, Math.PI * 2)
  ctx.fill()
  if (layer.glint && rand() > 0.45) glint(ctx, x, y, s, tint, a)
}

/** Pinta una capa sobre el lienzo para un anfitrión de `w`×`h` (con margen para el paralaje). */
export function paintLayer(canvas: HTMLCanvasElement, layer: Layer, w: number, h: number, seed: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const fullW = w + MARGIN * 2
  const fullH = h + MARGIN * 2
  canvas.width = fullW * dpr
  canvas.height = fullH * dpr
  canvas.style.width = `${fullW}px`
  canvas.style.height = `${fullH}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  const rand = rng(seed)
  const count = Math.round(fullW * fullH * layer.density)
  for (let i = 0; i < count; i++) star(ctx, layer, rand, fullW, fullH)
}

export const layerSeed = (index: number) => 11 + index * 97

export interface Twinkle {
  left: string
  top: string
  delay: string
  duration: string
}

/** Las 14 estrellas que titilan, en el mismo orden de sorteo que el mockup. */
export function twinkles(): Twinkle[] {
  const rand = rng(77)
  return Array.from({ length: 14 }, () => ({
    left: `${rand() * 100}%`,
    top: `${rand() * 100}%`,
    delay: `${(rand() * 9).toFixed(2)}s`,
    duration: `${(5 + rand() * 6).toFixed(2)}s`,
  }))
}
