import { describe, it, expect } from 'vitest'
import {
  parseRankingParams,
  serializeRankingParams,
  applyRankingFilters,
} from '@/utils/rankingFilters'
import type { PlayerEloHistoryDTO } from '@/types'

// ---------------------------------------------------------------------------
// Fixtures for applyRankingFilters tests
// ---------------------------------------------------------------------------

const makePlayer = (
  id: string,
  points: Array<{ recorded_at: string; game_id: string; elo_after: number; delta: number }>,
): PlayerEloHistoryDTO => ({
  player_id: id,
  player_name: id,
  points,
})

const POINTS_P1 = [
  { recorded_at: '2026-01-15', game_id: 'g1', elo_after: 1010, delta: 10 },
  { recorded_at: '2026-02-10', game_id: 'g2', elo_after: 1020, delta: 10 },
  { recorded_at: '2026-03-05', game_id: 'g3', elo_after: 1030, delta: 10 },
]

const POINTS_P2 = [
  { recorded_at: '2026-01-20', game_id: 'g4', elo_after: 900, delta: -5 },
  { recorded_at: '2026-03-01', game_id: 'g5', elo_after: 895, delta: -5 },
]

const DATASET: PlayerEloHistoryDTO[] = [
  makePlayer('p1', POINTS_P1),
  makePlayer('p2', POINTS_P2),
  makePlayer('p3', []),
]

// ---------------------------------------------------------------------------
// parseRankingParams
// ---------------------------------------------------------------------------

describe('parseRankingParams', () => {
  it('empty URLSearchParams → default state with hasPlayersKey false (D-C1)', () => {
    const result = parseRankingParams(new URLSearchParams())
    expect(result).toEqual({ players: [], from: null, hasPlayersKey: false })
  })

  it('?players= (key present, empty value) → players empty, hasPlayersKey true (D-C2/D-C3)', () => {
    const result = parseRankingParams(new URLSearchParams('players='))
    expect(result).toEqual({ players: [], from: null, hasPlayersKey: true })
  })

  it('?players=p1,p2,p3 → parsed player list with hasPlayersKey true', () => {
    const result = parseRankingParams(new URLSearchParams('players=p1,p2,p3'))
    expect(result).toEqual({ players: ['p1', 'p2', 'p3'], from: null, hasPlayersKey: true })
  })

  it('?from=2026-01-01 → from set, players empty, hasPlayersKey false', () => {
    const result = parseRankingParams(new URLSearchParams('from=2026-01-01'))
    expect(result).toEqual({ players: [], from: '2026-01-01', hasPlayersKey: false })
  })

  it('?from=invalid-format → from is null (regex rejects non-conforming)', () => {
    const result = parseRankingParams(new URLSearchParams('from=invalid-format'))
    expect(result.from).toBeNull()
  })

  it('?players=p1,,p2 → empty segments filtered out (filter Boolean)', () => {
    const result = parseRankingParams(new URLSearchParams('players=p1,,p2'))
    expect(result.players).toEqual(['p1', 'p2'])
  })
})

// ---------------------------------------------------------------------------
// serializeRankingParams
// ---------------------------------------------------------------------------

describe('serializeRankingParams', () => {
  it('empty state → empty string (URL clean, D-C1)', () => {
    const result = serializeRankingParams({ players: [], from: null })
    expect(result.toString()).toBe('')
  })

  it('empty state with explicitEmptyPlayers → "players=" (D-C2)', () => {
    const result = serializeRankingParams({ players: [], from: null }, { explicitEmptyPlayers: true })
    expect(result.toString()).toBe('players=')
  })

  it('players sorted by string compare, comma encodes as %2C (D-A7 + Pitfall D)', () => {
    const result = serializeRankingParams({ players: ['b', 'a'], from: null })
    expect(result.toString()).toBe('players=a%2Cb')
  })

  it('players set BEFORE from — deterministic key order (Pitfall D)', () => {
    const result = serializeRankingParams({ players: ['p1'], from: '2026-01-01' })
    expect(result.toString()).toBe('players=p1&from=2026-01-01')
  })
})

// ---------------------------------------------------------------------------
// applyRankingFilters
// ---------------------------------------------------------------------------

describe('applyRankingFilters', () => {
  it('empty selectedPlayerIds → empty output (no players selected = no series)', () => {
    const result = applyRankingFilters(DATASET, [], null)
    expect(result).toHaveLength(0)
  })

  it('fromDate null → returns all points for selected players unchanged', () => {
    const result = applyRankingFilters(DATASET, ['p1'], null)
    expect(result).toHaveLength(1)
    expect(result[0].player_id).toBe('p1')
    expect(result[0].points).toHaveLength(3)
  })

  it('fromDate filters points by lexicographic compare (never new Date())', () => {
    const result = applyRankingFilters(DATASET, ['p1'], '2026-02-01')
    expect(result).toHaveLength(1)
    // Only points on or after 2026-02-01 survive
    const dates = result[0].points.map((p) => p.recorded_at)
    expect(dates).toEqual(['2026-02-10', '2026-03-05'])
    expect(dates.every((d) => d >= '2026-02-01')).toBe(true)
  })

  it('players not in selectedPlayerIds are dropped from output', () => {
    const result = applyRankingFilters(DATASET, ['p2'], null)
    expect(result).toHaveLength(1)
    expect(result[0].player_id).toBe('p2')
    // p1 and p3 are dropped
    const ids = result.map((p) => p.player_id)
    expect(ids).not.toContain('p1')
    expect(ids).not.toContain('p3')
  })
})

// ---------------------------------------------------------------------------
// TZ-safe YYYY-MM-DD round-trip (SC#5)
// ---------------------------------------------------------------------------

describe('rankingFilters — TZ-safe YYYY-MM-DD round-trip (SC#5)', () => {
  it('round-trips from=2026-01-01 unchanged regardless of TZ', () => {
    // Defensive guard: setup.ts must have pinned TZ before any import
    expect(process.env.TZ).toBe('America/Argentina/Buenos_Aires')

    const initial = new URLSearchParams('from=2026-01-01')
    const parsed = parseRankingParams(initial)
    expect(parsed.from).toBe('2026-01-01')

    const serialized = serializeRankingParams({ players: [], from: parsed.from })
    expect(serialized.toString()).toBe('from=2026-01-01')

    // Re-parse to confirm symmetry
    const reparsed = parseRankingParams(serialized)
    expect(reparsed.from).toBe('2026-01-01')
  })

  it('encoding stability: players sorted + from after players (Pitfall D regression guard)', () => {
    const result = serializeRankingParams({ players: ['a', 'b'], from: '2026-01-01' })
    expect(result.toString()).toBe('players=a%2Cb&from=2026-01-01')
  })
})
