// Lo puro del motor del planeta (port de docs/redesign/mockup/js/fx/planet.js, F27, D-71):
// a dónde tiene que ir el globo y cómo se acerca, cuadro a cuadro. Sin WebGL ni DOM.
import { MAPS } from '@/domain/catalog'

export interface SlotParams {
  /** Mapa (clave del catálogo) sobre el que gira el globo; sin región, rota solo. */
  region: string | null
  terra: number
  fill: number
  board: boolean
  bright: number
  glow: number
  interactive: boolean
  tilt: number
}

export interface Target extends SlotParams {
  x: number
  y: number
  r: number
  parked?: boolean
}

export interface Pose {
  x: number; y: number; r: number; yaw: number; pitch: number
  terra: number; fill: number; board: number; fLat: number; fLon: number
  bright: number; glow: number; lx: number; ly: number
}

/** Giro a mano (arrastre) y su inercia. */
export interface Spin { angle: number; vel: number; dragging: boolean }

export interface Pointer { x: number; y: number }

export interface Box { left: number; top: number; width: number; height: number }

export const DEFAULTS: SlotParams = { region: null, terra: 0.15, fill: 0, board: false, bright: 1, glow: 1, interactive: false, tilt: 0.32 }

export const initialPose = (): Pose => ({ x: 0, y: 0, r: 0, yaw: -1.9, pitch: 0.32, terra: 0.15, fill: 0, board: 0, fLat: 0, fLon: 0, bright: 0.5, glow: 1, lx: 0, ly: 0 })

export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/** Sin slot, el planeta se estaciona como un horizonte tenue abajo a la derecha. */
export function parkedTarget(width: number, height: number): Target {
  const r = Math.max(width, height) * 0.62
  return { ...DEFAULTS, x: width * 0.72, y: height + r * 0.52, r, bright: 0.42, glow: 0.8, parked: true }
}

/** Centro y radio del slot, en px del marco sin escalar (`scale` = ancho real / ancho de layout). */
export function slotTarget(slot: Box, host: Box, scale: number, params: Partial<SlotParams>): Target {
  return {
    ...DEFAULTS, ...params,
    x: (slot.left - host.left + slot.width / 2) / scale,
    y: (slot.top - host.top + slot.height / 2) / scale,
    r: Math.min(slot.width, slot.height) / 2 / scale,
  }
}

export const regionOf = (region: string | null) => (region ? MAPS[region] ?? null : null)

/** ¿El globo todavía se está moviendo hacia su lugar? */
export const settling = (cur: Pose, t: Target) => Math.abs(t.x - cur.x) + Math.abs(t.y - cur.y) + Math.abs(t.r - cur.r) > 0.5

export interface StepContext {
  dt: number
  /** reduced-motion: llega de una vez y no rota solo (D-11). */
  still: boolean
  /** Primer cuadro: sin transición desde la pose inicial. */
  first: boolean
  spin: Spin
  pointer: Pointer
}

/** Avanza la pose un cuadro hacia el objetivo (mismas constantes que el mockup). */
export function step(cur: Pose, t: Target, ctx: StepContext) {
  const snap = ctx.still || ctx.first
  const k = snap ? 1 : 1 - Math.exp(-ctx.dt * 5.5)
  const ks = snap ? 1 : 1 - Math.exp(-ctx.dt * 3.2)
  approachBody(cur, t, k, ks)
  if (!ctx.spin.dragging) {
    ctx.spin.vel *= Math.pow(0.04, ctx.dt)
    ctx.spin.angle = wrapAngle(ctx.spin.angle + ctx.spin.vel * ctx.dt)
  }
  aim(cur, t, ks, ctx)
  approachLight(cur, t, k, ctx.pointer)
}

function approachBody(cur: Pose, t: Target, k: number, ks: number) {
  cur.x += (t.x - cur.x) * k
  cur.y += (t.y - cur.y) * k
  cur.r += (t.r - cur.r) * k
  cur.terra += (t.terra - cur.terra) * ks
  cur.fill += (t.fill - cur.fill) * ks
  cur.bright += (t.bright - cur.bright) * k
  cur.glow += (t.glow - cur.glow) * k
  cur.board += ((t.board ? 1 : 0) - cur.board) * ks
}

/** Con región, gira hasta mostrarla; sin región, rota despacio con la inclinación pedida. */
function aim(cur: Pose, t: Target, ks: number, ctx: StepContext) {
  const { spin, dt, still } = ctx
  const px = t.interactive ? ctx.pointer.x : 0
  const py = t.interactive ? ctx.pointer.y : 0
  const region = regionOf(t.region)
  if (region) {
    cur.fLat = (region.lat * Math.PI) / 180
    cur.fLon = (region.lon * Math.PI) / 180
    cur.yaw += wrapAngle(-cur.fLon + spin.angle + px * 0.12 - cur.yaw) * ks
    cur.pitch += (cur.fLat * 0.9 + py * 0.08 - cur.pitch) * ks
    if (!spin.dragging) spin.angle *= Math.pow(0.15, dt)
    return
  }
  if (!spin.dragging) cur.yaw = wrapAngle(cur.yaw + spin.vel * dt + (still ? 0 : dt * 0.045))
  cur.pitch += (t.tilt + py * 0.07 - cur.pitch) * ks
}

function approachLight(cur: Pose, t: Target, k: number, pointer: Pointer) {
  const lx = -0.62 + pointer.x * (t.interactive ? 0.22 : 0.06)
  const ly = 0.34 - pointer.y * (t.interactive ? 0.16 : 0.04)
  cur.lx += (lx - cur.lx) * k
  cur.ly += (ly - cur.ly) * k
}
