// Un Marte WebGL2 persistente detrás de toda la UI (port de docs/redesign/mockup/js/fx/planet.js,
// F27, FX-01, D-71). Las pantallas no tienen globo propio: registran un slot (un elemento vacío)
// y el planeta vuela hasta ahí, girando hacia la región del slot. Sin slot, se estaciona como
// un horizonte tenue abajo. Va en un chunk aparte: lo carga `PlanetCanvas` con import().
import { bake } from './bake'
import { fallbackStage, setPlanetState } from './fallback'
import { attachDrag } from './drag'
import { fullscreenTriangle, program, type Program } from './gl'
import { initialPose, parkedTarget, regionOf, settling, slotTarget, step, wrapAngle, type SlotParams, type Spin, type Target } from './motion'
import { RENDER_FRAG } from './shaders'

export interface SlotHandle {
  update(params: Partial<SlotParams>): void
  remove(): void
}

export interface PlanetStage {
  /** false sin WebGL2 o si los shaders no compilan: los slots dibujan el globo CSS. */
  supported: boolean
  addSlot(el: HTMLElement, params: Partial<SlotParams>): SlotHandle
  destroy(): void
}

interface Slot { el: HTMLElement; params: Partial<SlotParams>; detach?: () => void }

interface DrawRect { x: number; y: number; w: number; h: number }
interface ParityHook { drawRect(): DrawRect | null; settled(): boolean }
declare global { interface Window { __TM_PLANET__?: ParityHook } }

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Crea el motor sobre `canvas`, medido contra `host` (el dispositivo del marco). */
export function createPlanetStage(host: HTMLElement, canvas: HTMLCanvasElement): PlanetStage {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' })
  if (!gl) return fallbackStage()
  try {
    return new Engine(host, canvas, gl)
  } catch (err) {
    console.warn('Planet disabled:', err)
    return fallbackStage()
  }
}

class Engine implements PlanetStage {
  supported = true
  private ready = false
  private alive = true
  private slots: Slot[] = []
  private pointer = { x: 0, y: 0 }
  private spin: Spin = { angle: 0, vel: 0, dragging: false }
  private cur = initialPose()
  private render: Program
  private quad: WebGLVertexArrayObject
  private textures: WebGLTexture[] = []
  private W = 0
  private H = 0
  private dpr = 1
  private raf = 0
  private running = false
  private last = 0
  private time = 0
  private skip = false
  private initialised = false
  private lastStill: string | null = null
  private drawn: DrawRect | null = null
  private resizer = new ResizeObserver(() => this.resize())
  private host: HTMLElement
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext

  constructor(host: HTMLElement, canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.host = host
    this.canvas = canvas
    this.gl = gl
    this.render = program(gl, RENDER_FRAG)
    this.quad = fullscreenTriangle(gl)
    bake(gl, this.quad, () => this.alive).then((textures) => { this.textures = textures; this.ready = true })
    this.resizer.observe(host)
    this.resize()
    document.addEventListener('visibilitychange', this.onVisibility)
    canvas.addEventListener('webglcontextlost', this.onContextLost)
    host.addEventListener('pointermove', this.onPointer, { passive: true })
    window.__TM_PLANET__ = { drawRect: () => (this.canvas.checkVisibility?.() ? this.drawn : null), settled: () => this.settled() }
    this.start()
  }

  addSlot(el: HTMLElement, params: Partial<SlotParams>): SlotHandle {
    const slot: Slot = { el, params: {} }
    this.slots.push(slot)
    this.configure(slot, params)
    return {
      update: (next) => this.configure(slot, next),
      remove: () => { slot.detach?.(); this.slots = this.slots.filter((s) => s !== slot) },
    }
  }

  /** Cambia los parámetros; si cambió `interactive`, engancha o suelta el arrastre. */
  private configure(slot: Slot, params: Partial<SlotParams>) {
    slot.params = { ...params }
    if (params.interactive && !slot.detach) slot.detach = attachDrag(slot.el, this.spin, (dA) => this.turn(slot, dA))
    if (!params.interactive && slot.detach) { slot.detach(); slot.detach = undefined }
  }

  destroy() {
    this.alive = false
    this.stop()
    this.resizer.disconnect()
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    this.host.removeEventListener('pointermove', this.onPointer)
    this.slots.forEach((s) => s.detach?.())
    this.slots = []
    delete window.__TM_PLANET__
    setPlanetState(null)
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }

  private onVisibility = () => (document.hidden ? this.stop() : this.start())
  private onContextLost = (e: Event) => { e.preventDefault(); this.stop() }
  private onPointer = (e: PointerEvent) => {
    const rect = this.host.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1
  }

  private turn(slot: Slot, dA: number) {
    if (!regionOf(slot.params.region ?? null)) this.cur.yaw = wrapAngle(this.cur.yaw + dA)
  }

  private scale() {
    return this.host.getBoundingClientRect().width / (this.host.offsetWidth || 1)
  }

  private resize() {
    const w = this.host.offsetWidth
    this.dpr = Math.min(window.devicePixelRatio || 1, w < 760 ? 1.5 : 1.75) * this.scale()
    this.W = this.canvas.width = Math.max(1, Math.round(w * this.dpr))
    this.H = this.canvas.height = Math.max(1, Math.round(this.host.offsetHeight * this.dpr))
  }

  /** El último slot montado y visible manda. */
  private activeSlot() {
    for (let i = this.slots.length - 1; i >= 0; i--) {
      const s = this.slots[i]
      if (s.el.isConnected && s.el.offsetWidth > 0) return s
    }
    return null
  }

  private target(): Target {
    const slot = this.activeSlot()
    if (!slot) return parkedTarget(this.host.offsetWidth, this.host.offsetHeight)
    return slotTarget(slot.el.getBoundingClientRect(), this.host.getBoundingClientRect(), this.scale(), slot.params)
  }

  // Con reduced-motion el globo es una imagen fija: las nubes quedan quietas (time = 0) y solo
  // se redibuja si cambia el destino, el tamaño o si terminó de hornear (D-11).
  private stillKey(t: Target) {
    return JSON.stringify([this.ready, this.W, this.H, t.x, t.y, t.r, t.region, t.terra, t.fill, t.board, t.bright, t.glow, t.tilt, this.pointer])
  }

  private settled() {
    return this.ready && this.lastStill !== null && this.lastStill === this.stillKey(this.target())
  }

  /** ¿Hay que saltear este cuadro? Quieto con reduced-motion, o a 30 fps si nada se mueve. */
  private idle(t: Target, frozen: boolean) {
    if (frozen) {
      const key = this.stillKey(t)
      if (key === this.lastStill) return true
      this.lastStill = key
    } else {
      this.lastStill = null
    }
    this.skip = !this.skip
    return this.skip && !frozen && !this.spin.dragging && !settling(this.cur, t) && Math.abs(this.spin.vel) < 0.01
  }

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame)
    const t = this.target()
    if (this.idle(t, reduceMotion() && !this.spin.dragging)) return
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000)
    this.last = now
    const still = reduceMotion()
    if (!still) this.time += dt
    step(this.cur, t, { dt, still, first: !this.initialised, spin: this.spin, pointer: this.pointer })
    this.initialised = true
    if (this.ready && !this.gl.isContextLost()) this.paint()
  }

  /** Rect dibujado (px de viewport) para el arnés; el primer dibujo marca `data-planet="ready"`. */
  private markDrawn(rect: [number, number, number, number] | null) {
    const box = this.host.getBoundingClientRect()
    const d = this.dpr
    this.drawn = rect && { x: box.left + rect[0] / d, y: box.top + (this.H - rect[3]) / d, w: (rect[2] - rect[0]) / d, h: (rect[3] - rect[1]) / d }
    if (document.documentElement.dataset.planet !== 'ready') setPlanetState('ready')
  }

  /** Recorte (scissor) alrededor del globo, o null si queda fuera del lienzo. */
  private clip(cx: number, cy: number, r: number): [number, number, number, number] | null {
    if (r < 2) return null
    const m = r * 1.45
    const box: [number, number, number, number] = [Math.max(0, Math.floor(cx - m)), Math.max(0, Math.floor(cy - m)), Math.min(this.W, Math.ceil(cx + m)), Math.min(this.H, Math.ceil(cy + m))]
    return box[2] <= box[0] || box[3] <= box[1] ? null : box
  }

  private paint() {
    const { gl } = this
    gl.disable(gl.SCISSOR_TEST)
    gl.viewport(0, 0, this.W, this.H)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    const [cx, cy, r] = [this.cur.x * this.dpr, this.H - this.cur.y * this.dpr, this.cur.r * this.dpr]
    const box = this.clip(cx, cy, r)
    this.markDrawn(box)
    if (!box) return
    gl.enable(gl.SCISSOR_TEST)
    gl.scissor(box[0], box[1], box[2] - box[0], box[3] - box[1])
    gl.useProgram(this.render.p)
    this.textures.forEach((tex, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex) })
    this.uniforms(cx, cy, r)
    gl.bindVertexArray(this.quad)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  private uniforms(cx: number, cy: number, r: number) {
    const { gl, cur } = this
    const u = this.render.u
    gl.uniform1i(u.uSurf, 0)
    gl.uniform1i(u.uAux, 1)
    gl.uniform1i(u.uCloud, 2)
    gl.uniform3f(u.uPlanet, cx, cy, r)
    gl.uniform3f(u.uLight, cur.lx, cur.ly, 0.72)
    gl.uniform1f(u.uYaw, cur.yaw)
    gl.uniform1f(u.uPitch, cur.pitch)
    gl.uniform1f(u.uTime, this.time)
    gl.uniform1f(u.uTerra, cur.terra)
    gl.uniform4f(u.uFocus, cur.fLat, cur.fLon, 0.5, cur.board)
    gl.uniform2f(u.uHex, 0.083, cur.fill)
    gl.uniform1f(u.uBright, cur.bright)
    gl.uniform1f(u.uGlow, cur.glow)
  }

  private start() {
    if (this.running || !this.alive) return
    this.running = true
    this.last = 0
    this.raf = requestAnimationFrame(this.frame)
  }

  private stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }
}
