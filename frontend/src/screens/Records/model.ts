// Lo puro del salón de récords (port de docs/redesign/mockup/js/screens/records.js).
import type { GroupRecord } from '@/data/types'

export const MONUMENT = 'highest_single_game_score'

/** El récord mayor va al monumento; el resto, a las placas (en el orden del catálogo). */
export function splitRecords(records: GroupRecord[]) {
  return { top: records.find((r) => r.code === MONUMENT), rest: records.filter((r) => r.code !== MONUMENT) }
}

/** Posición de una fecha en la línea de todo el archivo (la misma escala con cualquier filtro). */
export function timeline(first: string, last: string) {
  const a = new Date(first).getTime()
  const span = new Date(last).getTime() - a
  return (d: string) => (span ? (new Date(d).getTime() - a) / span : 0)
}

export const W = 300

/** Escalera del récord: el trazo y cada punto (en % del gráfico); null con menos de 2 pasos. */
export function stepChart(history: GroupRecord['history'], height: number, t: (d: string) => number) {
  if (history.length < 2) return null
  const vals = history.map((e) => e.value)
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const Y = (v: number) => 8 + (1 - (v - lo) / (hi - lo || 1)) * (height - 18)
  const X = (d: string) => 6 + t(d) * (W - 12)
  const d = history.map((e, i) => (i === 0 ? `M${X(e.date)} ${Y(e.value)}` : `H${X(e.date)}V${Y(e.value)}`)).join('') + `H${W - 6}`
  return { d, points: history.map((e) => ({ e, x: (X(e.date) / W) * 100, y: (Y(e.value) / height) * 100 })) }
}

/** Unidad de la placa: «Victoria más ajustada» en 0 es un empate que definió el M€. */
export const unitOf = (r: GroupRecord) => (r.code === 'closest_win' && r.value === 0 ? 'pts, definida por M€' : r.unit)

/** Co-poseedores de un récord de carrera en orden de alta (D-74), como el mockup. */
export const holdersBySignup = (r: GroupRecord, rank: (playerId: string) => number) =>
  r.holders.slice().sort((a, b) => rank(a.player_id) - rank(b.player_id))

export const gamesText = (n: number) => `${n} ${n === 1 ? 'partida' : 'partidas'}`
