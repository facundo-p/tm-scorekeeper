// Horneado de la superficie (equirectangular, 3 texturas) en 12 franjas, una por cuadro,
// para no trabar la pantalla (port de docs/redesign/mockup/js/fx/planet.js, F27).
import { makeTexture, program } from './gl'
import { BAKE_FRAG } from './shaders'

const STRIPS = 12

/** Ancho de la textura: `?bake=` manda (256..4096); si no, 1024 en equipos chicos y 2048 en el resto. */
export function bakeSize(search = location.search, device = { screen: Math.min(screen.width, screen.height), cores: navigator.hardwareConcurrency || 8 }) {
  const q = new URLSearchParams(search).get('bake')
  if (q) return Math.max(256, Math.min(4096, Number(q) || 1024))
  return device.screen < 700 || device.cores <= 4 ? 1024 : 2048
}

/** Hornea y resuelve con las texturas; `alive()` en falso (contexto perdido o motor destruido) corta. */
export function bake(gl: WebGL2RenderingContext, quad: WebGLVertexArrayObject, alive: () => boolean) {
  const bw = bakeSize()
  const bh = bw / 2
  const bk = program(gl, BAKE_FRAG)
  const textures = [0, 1, 2].map(() => makeTexture(gl, bw, bh))
  const fb = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  textures.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0))
  gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2])
  gl.useProgram(bk.p)
  gl.uniform2f(bk.u.uTexel, 1 / bw, 1 / bh)
  const strip = (i: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.useProgram(bk.p)
    gl.viewport(0, 0, bw, bh)
    gl.enable(gl.SCISSOR_TEST)
    const y0 = Math.floor((i / STRIPS) * bh)
    gl.scissor(0, y0, bw, Math.floor(((i + 1) / STRIPS) * bh) - y0)
    gl.bindVertexArray(quad)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
  const finish = () => {
    gl.disable(gl.SCISSOR_TEST)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.deleteFramebuffer(fb)
    gl.deleteProgram(bk.p)
  }
  return new Promise<WebGLTexture[]>((resolve) => {
    let i = 0
    const next = () => {
      if (!alive() || gl.isContextLost()) return
      strip(i++)
      if (i < STRIPS) { requestAnimationFrame(next); return }
      finish()
      resolve(textures)
    }
    requestAnimationFrame(next)
  })
}
