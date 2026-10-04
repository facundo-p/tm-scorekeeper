// Estallido corto de cubos que caen girando, en los colores de los jugadores y el dorado del
// MegaCrédito (port de docs/redesign/mockup/js/fx/confetti.js, F27). Lo usa la ceremonia.

interface Piece { x: number; y: number; vx: number; vy: number; s: number; r: number; vr: number; c: string; life: number }

export interface BurstOptions {
  /** Origen, en fracción del lienzo. */
  x?: number
  y?: number
  colors?: string[]
  count?: number
  random?: () => number
}

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function makePieces(w: number, h: number, { x = 0.5, y = 0.35, colors = ['#f4c43a'], count = 140, random = Math.random }: BurstOptions): Piece[] {
  return Array.from({ length: count }, () => {
    const a = -Math.PI / 2 + (random() - 0.5) * 2.2
    const v = 6 + random() * 9
    return {
      x: x * w, y: y * h, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      s: 4 + random() * 6, r: random() * Math.PI, vr: (random() - 0.5) * 0.3,
      c: colors[Math.floor(random() * colors.length)], life: 1,
    }
  })
}

/** Avanza una pieza `k` cuadros de 60 fps; devuelve si sigue a la vista. */
export function advance(p: Piece, k: number, h: number) {
  p.vy += 0.28 * k
  p.vx *= 0.99 ** k
  p.x += p.vx * k
  p.y += p.vy * k
  p.r += p.vr * k
  p.life -= 0.006 * k
  return p.life > 0 && p.y <= h + 20
}

function drawPiece(ctx: CanvasRenderingContext2D, p: Piece) {
  ctx.save()
  ctx.globalAlpha = Math.min(1, p.life * 1.5)
  ctx.translate(p.x, p.y)
  ctx.rotate(p.r)
  ctx.fillStyle = p.c
  ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s)
  ctx.fillStyle = 'rgba(255,255,255,.35)'
  ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.3)
  ctx.restore()
}

function prepare(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx?.scale(dpr, dpr)
  return { ctx, w, h }
}

/** Lanza el estallido sobre `canvas`; devuelve la cancelación. Con reduced-motion no hace nada. */
export function burst(canvas: HTMLCanvasElement | null, options: BurstOptions = {}): () => void {
  if (!canvas || reduceMotion()) return () => {}
  const { ctx, w, h } = prepare(canvas)
  if (!ctx) return () => {}
  const pieces = makePieces(w, h, options)
  let raf = 0
  let last = performance.now()
  const tick = (now: number) => {
    const k = Math.min(4, (now - last) / 16.7)
    last = now
    ctx.clearRect(0, 0, w, h)
    let alive = 0
    for (const p of pieces) if (advance(p, k, h)) { alive++; drawPiece(ctx, p) }
    if (alive) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}
