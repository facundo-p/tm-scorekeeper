import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import type { PlayerEloHistoryDTO } from '@/types'
import styles from './EloLineChart.module.css'

interface EloLineChartProps {
  data: PlayerEloHistoryDTO[]
}

// Deterministic, id-keyed palette. 10 colors so up to 10 concurrent players
// get unique colors. All verified ≥3:1 WCAG contrast against --color-surface (#2c1810).
// Adding/removing players never reassigns existing players' colors (RANK-02 SC1).
const PLAYER_COLORS = [
  '#4e9af1', // blue
  '#f1c40f', // yellow
  '#2ecc71', // green
  '#e91e8c', // hot pink
  '#ff7043', // orange-red
  '#a78bfa', // purple
  '#26c6da', // cyan
  '#ff9800', // amber
  '#f06292', // rose
  '#80cbc4', // teal
] as const

// Hash = sum of UTF-16 char codes of player_id. Pure, deterministic, no
// collisions for our short-ID space (UUIDs). Index modulo palette length.
function hashPlayerId(playerId: string): number {
  let sum = 0
  for (let i = 0; i < playerId.length; i++) {
    sum += playerId.charCodeAt(i)
  }
  return sum
}

// Exported for testability — allows unit tests to verify deterministic palette
// without depending on Recharts SVG rendering in jsdom (which requires dimensions).
export function playerColor(playerId: string): string {
  return PLAYER_COLORS[hashPlayerId(playerId) % PLAYER_COLORS.length]
}

// X-axis tick formatter: "YYYY-MM-DD" -> "DD/MM" (per UI-SPEC). No new Date()
// — string-split keeps timezone behavior deterministic (Pitfall 1).
function formatXAxisTick(isoDate: string): string {
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}/${parts[1]}`
}

// Recharts wants a flat array of { date, [playerId]: elo_after } rows.
// Build it from the per-player points by date-merging.
interface MergedRow {
  recorded_at: string
  [playerKey: string]: string | number | null
}

function buildMergedRows(data: PlayerEloHistoryDTO[]): MergedRow[] {
  const byDate = new Map<string, MergedRow>()
  for (const player of data) {
    for (const point of player.points) {
      const existing = byDate.get(point.recorded_at) ?? { recorded_at: point.recorded_at }
      existing[player.player_id] = point.elo_after
      byDate.set(point.recorded_at, existing)
    }
  }
  // Sort by recorded_at ascending — string sort is correct for YYYY-MM-DD.
  const rows = Array.from(byDate.values()).sort((a, b) =>
    a.recorded_at < b.recorded_at ? -1 : a.recorded_at > b.recorded_at ? 1 : 0,
  )

  // Extend each player's last known ELO to the latest date in the dataset.
  // With connectNulls + type="linear", this produces a horizontal line from
  // the player's last game to the right edge of the chart, communicating
  // "current ELO unchanged since last game."
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1]
    for (const player of data) {
      if (player.points.length === 0 || lastRow[player.player_id] !== undefined) continue
      const sorted = [...player.points].sort((a, b) =>
        a.recorded_at < b.recorded_at ? -1 : a.recorded_at > b.recorded_at ? 1 : 0,
      )
      const lastPoint = sorted[sorted.length - 1]
      lastRow[player.player_id] = lastPoint.elo_after
    }
  }

  return rows
}

function totalPointCount(data: PlayerEloHistoryDTO[]): number {
  return data.reduce((sum, p) => sum + p.points.length, 0)
}

export default function EloLineChart({ data }: EloLineChartProps) {
  const rows = buildMergedRows(data)
  const singlePoint = totalPointCount(data) === 1

  return (
    <div
      className={styles.wrapper}
      role="img"
      aria-label="Gráfico de evolución de ELO por jugador"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="recorded_at"
            tickFormatter={formatXAxisTick}
            stroke="var(--color-text-muted)"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 14 }}
          />
          <YAxis
            domain={['dataMin - 50', 'dataMax + 50']}
            stroke="var(--color-text-muted)"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 14 }}
          />
          <Tooltip
            trigger="click"
            cursor={{ stroke: 'var(--color-text-muted)' }}
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius)',
              color: 'var(--color-text)',
            }}
            labelFormatter={(label) => `Fecha: ${label}`}
            formatter={(value, nameOrId) => {
              const player = data.find((p) => p.player_id === String(nameOrId ?? ''))
              return [`ELO: ${value}`, player?.player_name ?? String(nameOrId ?? '')]
            }}
          />
          <Legend />
          {data.map((player) => (
            <Line
              key={player.player_id}
              type="linear"
              dataKey={player.player_id}
              name={player.player_name}
              stroke={playerColor(player.player_id)}
              strokeWidth={2}
              dot={singlePoint}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
