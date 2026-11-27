// Gradientes impresos del tablero (temperatura y oxígeno), interpolados por tramo.

export const TEMP_STOPS = ['#23ade3', '#2f86c8', '#6a5cb0', '#93418a', '#b8396c', '#de3446']
export const OXY_STOPS = ['#6a4560', '#7e7aa6', '#92cae7']

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Color en la posición `t` (0..1) de una lista de paradas, como `rgb(r g b)`. */
export function mixStops(stops: string[], t: number) {
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(x))
  const a = hexToRgb(stops[i])
  const b = hexToRgb(stops[i + 1])
  const f = x - i
  return `rgb(${a.map((v, k) => Math.round(lerp(v, b[k], f))).join(' ')})`
}
