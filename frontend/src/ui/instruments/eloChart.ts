// Lo puro del gráfico de ELO (port de EloChart en docs/redesign/mockup/js/ui/instruments.js):
// eje de fechas, series escalonadas, escalas y etiquetas que no se pisan.
import type { PlayerLike } from '@/ui/atoms'
import type { EloSeries } from './types'

/** Punto de una serie: índice de fecha, ELO vigente y si hubo partida ese día. */
export type ChartPoint = [number, number, boolean]
export interface ChartSeries { player: PlayerLike; pts: ChartPoint[] }

export const PAD = { l: 40, r: 64, t: 14, b: 26 }

/** Fechas con alguna partida (desde `from`), ordenadas. */
export function chartDates(series: EloSeries[], from?: string) {
  const all = new Set<string>()
  series.forEach((s) => s.points.forEach((p) => (!from || p.date >= from) && all.add(p.date)))
  return [...all].sort()
}

/** Cada serie sobre el eje común: arrastra el último valor (también el anterior a `from`). */
export function chartSeries(series: EloSeries[], dates: string[], from?: string): ChartSeries[] {
  return series.map(({ player, points }) => {
    let last: number | null = null
    for (const p of points) if (from && p.date < from) last = p.elo
    const byDate = new Map(points.map((p) => [p.date, p.elo]))
    const pts: ChartPoint[] = []
    dates.forEach((d, i) => {
      const v = byDate.get(d)
      if (v != null) last = v
      if (last != null) pts.push([i, last, v != null])
    })
    return { player, pts }
  })
}

export interface Scale { lo: number; hi: number; ticks: number[]; X: (i: number) => number; Y: (v: number) => number }

/** Escalas: el eje Y siempre incluye 1000 y va de 50 en 50. */
export function chartScale(series: ChartSeries[], count: number, w: number, height: number): Scale {
  const vals = series.flatMap((s) => s.pts.map((x) => x[1]))
  const lo = Math.floor((Math.min(...vals, 1000) - 20) / 50) * 50
  const hi = Math.ceil((Math.max(...vals, 1000) + 20) / 50) * 50
  const ticks: number[] = []
  for (let v = lo; v <= hi; v += 50) ticks.push(v)
  return {
    lo, hi, ticks,
    X: (i) => PAD.l + (i / Math.max(1, count - 1)) * (w - PAD.l - PAD.r),
    Y: (v) => PAD.t + (1 - (v - lo) / (hi - lo)) * (height - PAD.t - PAD.b),
  }
}

/** Separa las etiquetas del margen derecho al menos 15 px, de arriba hacia abajo. */
export function layoutLabels<T extends { y: number }>(items: T[]) {
  let prev = -Infinity
  return items.slice().sort((a, b) => a.y - b.y).map((it) => {
    const ly = Math.max(it.y, prev + 15)
    prev = ly
    return { ...it, ly }
  })
}

/** Valores en la fecha `hover` (los resaltados, o todos si no hay), de mayor a menor. */
export function hoverRows(series: ChartSeries[], hover: number, hl: Set<string>) {
  return series
    .filter((s) => hl.size === 0 || hl.has(s.player.id))
    .map((s) => ({ player: s.player, v: s.pts.filter((x) => x[0] <= hover).pop()?.[1] }))
    .filter((r): r is { player: PlayerLike; v: number } => r.v != null)
    .sort((a, b) => b.v - a.v)
}
