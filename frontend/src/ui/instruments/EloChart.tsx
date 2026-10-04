// Gráfico de ELO con cruz al pasar el puntero (y vista de tabla con los mismos datos).
import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { cssVars } from '@/domain/cssVars'
import { cx } from '@/ui/cx'
import { chartDates, chartScale, chartSeries, hoverRows, layoutLabels, PAD, type ChartSeries, type Scale } from './eloChart'
import type { EloSeries } from './types'
import { TableWrap } from './TableWrap'
import styles from './instruments.module.css'

const lineClass = (color: string) => styles[`line--${color}`]

/** Ancho del contenedor (mínimo 280), seguido con ResizeObserver. */
function useWidth(ref: RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    setW(Math.max(280, el.getBoundingClientRect().width || 640))
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}

interface PlotProps { series: ChartSeries[]; hl: Set<string>; scale: Scale; w: number }

function Lines({ series, hl, scale }: PlotProps) {
  const ordered = [...series.filter((s) => !hl.has(s.player.id)), ...series.filter((s) => hl.has(s.player.id))]
  return ordered.map(({ player, pts }) => {
    const d = pts.map(([i, v], k) => `${k ? 'L' : 'M'}${scale.X(i).toFixed(1)} ${scale.Y(v).toFixed(1)}`).join('')
    const on = hl.size === 0 || hl.has(player.id)
    return <path key={player.id} d={d} className={cx(styles.elochart__line, on ? cx(styles['is-on'], lineClass(player.color)) : styles['is-off'])} />
  })
}

/** Punto final y nombre al margen derecho de cada jugador resaltado. */
function EndLabels({ series, hl, scale, w }: PlotProps) {
  const marked = series.filter((s) => hl.has(s.player.id))
  const labels = layoutLabels(marked.map((s) => ({ s, y: scale.Y(s.pts[s.pts.length - 1]?.[1] ?? 1000) })))
  return (
    <>
      {marked.map(({ player, pts }) => {
        const last = pts[pts.length - 1]
        return last && <circle key={player.id} cx={scale.X(last[0])} cy={scale.Y(last[1])} r="4.5" className={cx(styles.elochart__dot, lineClass(player.color))} />
      })}
      {labels.map(({ s, y, ly }) => (
        <g key={s.player.id} className={styles.elochart__label}>
          <line x1={w - PAD.r + 6} x2={w - PAD.r + 14} y1={y} y2={ly} className={styles.elochart__leader} />
          <text x={w - PAD.r + 17} y={ly + 4}>{s.player.name}</text>
        </g>
      ))}
    </>
  )
}

function Grid({ scale, w }: { scale: Scale; w: number }) {
  return scale.ticks.map((v) => (
    <g key={v}>
      <line x1={PAD.l} x2={w - PAD.r} y1={scale.Y(v)} y2={scale.Y(v)} className={cx(styles.elochart__grid, v === 1000 && styles['is-base'])} />
      <text x={PAD.l - 8} y={scale.Y(v) + 4} className={styles.elochart__tick}>{v}</text>
    </g>
  ))
}

interface TipProps { series: ChartSeries[]; hl: Set<string>; dates: string[]; hover: number; x: number; w: number }

function Tip({ series, hl, dates, hover, x, w }: TipProps) {
  return (
    <div className={cx(styles.elochart__tip, x > w * 0.6 && styles['is-left'])} style={cssVars({ x: `${x}px` })}>
      <b>{dates[hover]}</b>
      {hoverRows(series, hover, hl).slice(0, 6).map((r) => (
        <span key={r.player.id}><i className={cx(styles.linekey, lineClass(r.player.color))} />{r.v}<em>{r.player.name}</em></span>
      ))}
    </div>
  )
}

function EloTable({ series, dates }: { series: ChartSeries[]; dates: string[] }) {
  return (
    <TableWrap>
      <table className={styles.dtable}>
        <thead><tr><th>Fecha</th>{series.map((s) => <th key={s.player.id} className={styles.n}>{s.player.name}</th>)}</tr></thead>
        <tbody>{dates.map((d, i) => (
          <tr key={d}><td>{d}</td>{series.map((s) => {
            const p = s.pts.find((x) => x[0] === i)
            return <td key={s.player.id} className={styles.n}>{p?.[2] ? p[1] : '—'}</td>
          })}</tr>
        ))}</tbody>
      </table>
    </TableWrap>
  )
}

interface EloChartProps {
  series: EloSeries[]
  /** Ids resaltados; el resto queda en gris. */
  highlight?: string[]
  height?: number
  /** Primera fecha visible (ISO). */
  from?: string
  showTable?: boolean
}

/** Índice de fecha bajo el puntero (null fuera del gráfico). */
function useHover(w: number, count: number) {
  const [hover, setHover] = useState<number | null>(null)
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((((e.clientX - r.left) / r.width) * w - PAD.l) / (w - PAD.l - PAD.r)) * (count - 1))
    setHover(Math.max(0, Math.min(count - 1, i)))
  }
  return { hover, handlers: { onPointerMove, onPointerLeave: () => setHover(null) } }
}

function Plot({ series, hl, scale, w, height, dates, hover, count }: PlotProps & { height: number; dates: string[]; hover: number | null; count: number }) {
  const plot = { series, hl, scale, w }
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label={`Evolución del ELO de ${count} jugadores`}>
      <Grid scale={scale} w={w} />
      <Lines {...plot} />
      <EndLabels {...plot} />
      {hover != null && <line x1={scale.X(hover)} x2={scale.X(hover)} y1={PAD.t} y2={height - PAD.b} className={styles.elochart__cross} />}
      <text x={PAD.l} y={height - 6} className={cx(styles.elochart__tick, styles['elochart__tick--x'])}>{dates[0] ?? ''}</text>
      <text x={w - PAD.r} y={height - 6} className={cx(styles.elochart__tick, styles['elochart__tick--x'], styles['is-end'])}>{dates[dates.length - 1] ?? ''}</text>
    </svg>
  )
}

export function EloChart({ series: input, highlight = [], height = 260, from, showTable }: EloChartProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const w = useWidth(wrap)
  const dates = useMemo(() => chartDates(input, from), [input, from])
  const series = useMemo(() => chartSeries(input, dates, from), [input, dates, from])
  const hl = useMemo(() => new Set(highlight), [highlight])
  const { hover, handlers } = useHover(w, dates.length)
  if (showTable) return <EloTable series={series} dates={dates} />
  // Antes de medir, un hueco del alto final (como el mockup) para que la página no salte.
  if (!w) return <div className={styles.elochart} ref={wrap} style={cssVars({ h: `${height}px` })} />
  const scale = chartScale(series, dates.length, w, height)
  return (
    <div className={styles.elochart} ref={wrap} {...handlers}>
      <Plot series={series} hl={hl} scale={scale} w={w} height={height} dates={dates} hover={hover} count={input.length} />
      {hover != null && <Tip series={series} hl={hl} dates={dates} hover={hover} x={scale.X(hover)} w={w} />}
    </div>
  )
}
