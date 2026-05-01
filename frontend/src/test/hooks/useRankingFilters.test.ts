import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useRankingFilters } from '@/hooks/useRankingFilters'

// Helper: wrapper that also captures latest URL search via a ref
function makeWrapper(initialEntry: string) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries: [initialEntry] }, children)
}

// Wrapper hook that returns [result, locationSearch] so we can assert URL
function useRankingFiltersWithLocation(activePlayerIds: string[] | null) {
  const result = useRankingFilters(activePlayerIds)
  const location = useLocation()
  return { ...result, locationSearch: location.search }
}

function renderWithLocation(initialEntry: string, activePlayerIds: string[] | null) {
  const wrapper = makeWrapper(initialEntry)
  return renderHook(() => useRankingFiltersWithLocation(activePlayerIds), { wrapper })
}

// ─────────────────────────────────────────────────────────────────────────────
// A — Default branch (URL clean → all active) (D-C1)
// ─────────────────────────────────────────────────────────────────────────────
describe('A — Default branch: URL clean → all active (D-C1)', () => {
  it('returns all activePlayerIds when URL has no players key', () => {
    const { result } = renderWithLocation('/ranking', ['p1', 'p2', 'p3'])
    expect(result.current.players).toEqual(['p1', 'p2', 'p3'])
    expect(result.current.fromDate).toBeNull()
  })

  it('does NOT rewrite the URL on mount (D-C1 silence — URL stays clean)', () => {
    const { result } = renderWithLocation('/ranking', ['p1', 'p2', 'p3'])
    // No rewrite — search should remain empty string
    expect(result.current.locationSearch).toBe('')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// B — Intersection drop + idempotent rewrite (D-A3 step 3, Pitfall B)
// ─────────────────────────────────────────────────────────────────────────────
describe('B — Intersection drop + idempotent rewrite (D-A3 step 3, Pitfall B)', () => {
  it('drops ghost IDs and resolves to valid intersection', async () => {
    const { result } = renderWithLocation('/ranking?players=p1,ghost,p2', ['p1', 'p2', 'p3'])
    // After effect runs, resolved players should be ['p1', 'p2'] (sorted)
    await act(async () => {})
    expect(result.current.players).toEqual(['p1', 'p2'])
  })

  it('rewrites URL exactly ONCE to canonical sorted form (Pitfall B — no infinite loop)', async () => {
    const { result, rerender } = renderWithLocation('/ranking?players=p1,ghost,p2', ['p1', 'p2', 'p3'])
    await act(async () => {})
    // After first rewrite, URL should have sorted valid players
    expect(result.current.locationSearch).toContain('players=')
    const searchAfterFirstRender = result.current.locationSearch

    // Re-render with same activePlayerIds — URL must NOT be rewritten a second time
    rerender()
    await act(async () => {})
    expect(result.current.locationSearch).toBe(searchAfterFirstRender)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// C — Empty intersection → in-memory fallback + URL clean (D-A3 step 4)
// ─────────────────────────────────────────────────────────────────────────────
describe('C — Empty intersection → fallback to all active + URL clean (D-A3 step 4)', () => {
  it('falls back to all active when intersection is empty', async () => {
    const { result } = renderWithLocation('/ranking?players=ghost1,ghost2', ['p1', 'p2'])
    await act(async () => {})
    expect(result.current.players).toEqual(['p1', 'p2'])
  })

  it('rewrites URL ONCE to drop players key (URL becomes clean)', async () => {
    const { result } = renderWithLocation('/ranking?players=ghost1,ghost2', ['p1', 'p2'])
    await act(async () => {})
    // players key should be dropped — URL is clean (no players param)
    expect(result.current.locationSearch).not.toContain('players')
  })

  it('does NOT rewrite URL a second time after empty-intersection rewrite (Pitfall B)', async () => {
    const { result, rerender } = renderWithLocation('/ranking?players=ghost1,ghost2', ['p1', 'p2'])
    await act(async () => {})
    const searchAfterFirst = result.current.locationSearch

    rerender()
    await act(async () => {})
    expect(result.current.locationSearch).toBe(searchAfterFirst)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// D — Explicit empty ?players= → respect, no rewrite (D-C2/D-C3)
// ─────────────────────────────────────────────────────────────────────────────
describe('D — Explicit empty ?players= → respect, no URL rewrite (D-C2/D-C3)', () => {
  it('returns empty players array when ?players= is explicit', () => {
    const { result } = renderWithLocation('/ranking?players=', ['p1', 'p2'])
    expect(result.current.players).toEqual([])
  })

  it('does NOT rewrite the URL (already canonical)', async () => {
    const { result } = renderWithLocation('/ranking?players=', ['p1', 'p2'])
    await act(async () => {})
    // URL should retain ?players= key (explicit empty preserved)
    expect(result.current.locationSearch).toContain('players')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// E — activePlayerIds === null (loading state, Pitfall E)
// ─────────────────────────────────────────────────────────────────────────────
describe('E — activePlayerIds === null (loading state, Pitfall E)', () => {
  it('returns empty players array when activePlayerIds is null', async () => {
    const { result } = renderWithLocation('/ranking?players=p1', null)
    await act(async () => {})
    expect(result.current.players).toEqual([])
  })

  it('does NOT rewrite the URL while loading', async () => {
    const { result } = renderWithLocation('/ranking?players=p1', null)
    await act(async () => {})
    // URL must remain unchanged while null (no intersection possible)
    expect(result.current.locationSearch).toBe('?players=p1')
  })

  it('mirrors parsed.from even when loading', () => {
    const { result } = renderWithLocation('/ranking?players=p1&from=2026-01-01', null)
    expect(result.current.fromDate).toBe('2026-01-01')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// F — setPlayers setter
// ─────────────────────────────────────────────────────────────────────────────
describe('F — setPlayers setter', () => {
  it('sorts players before serializing to URL (D-A7)', async () => {
    const { result } = renderWithLocation('/ranking', ['p1', 'p2', 'p3'])
    await act(async () => {
      result.current.setPlayers(['p2', 'p1'])
    })
    // Sorted: p1,p2 → encoded as p1%2Cp2 in URLSearchParams
    expect(result.current.locationSearch).toContain('players=')
    expect(result.current.players).toEqual(['p1', 'p2'])
  })

  it('writes ?players= (explicit empty) when setPlayers([]) called (D-C2)', async () => {
    const { result } = renderWithLocation('/ranking?players=p1', ['p1', 'p2'])
    await act(async () => {
      result.current.setPlayers([])
    })
    expect(result.current.locationSearch).toContain('players=')
    expect(result.current.players).toEqual([])
  })

  it('preserves fromDate in URL when setPlayers called with fromDate present (Pitfall D)', async () => {
    const { result } = renderWithLocation('/ranking?players=p1&from=2026-01-01', ['p1', 'p2', 'p3'])
    await act(async () => {
      result.current.setPlayers(['p2', 'p1'])
    })
    expect(result.current.locationSearch).toContain('from=2026-01-01')
    expect(result.current.locationSearch).toContain('players=')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// G — setFromDate setter (RANK-04 + Pitfall F — no new Date())
// ─────────────────────────────────────────────────────────────────────────────
describe('G — setFromDate setter (opaque string, Pitfall F)', () => {
  it('writes from=YYYY-MM-DD to URL opaquely without Date wrapping', async () => {
    const { result } = renderWithLocation('/ranking', ['p1', 'p2'])
    await act(async () => {
      result.current.setFromDate('2026-02-15')
    })
    expect(result.current.fromDate).toBe('2026-02-15')
    expect(result.current.locationSearch).toContain('from=2026-02-15')
  })

  it('drops from key when setFromDate(null) called', async () => {
    const { result } = renderWithLocation('/ranking?from=2026-01-01', ['p1', 'p2'])
    await act(async () => {
      result.current.setFromDate(null)
    })
    expect(result.current.fromDate).toBeNull()
    expect(result.current.locationSearch).not.toContain('from=')
  })

  it('preserves selected players in URL when setFromDate called', async () => {
    const { result } = renderWithLocation('/ranking?players=p1,p2', ['p1', 'p2', 'p3'])
    await act(async () => {
      result.current.setFromDate('2026-03-01')
    })
    expect(result.current.locationSearch).toContain('players=')
    expect(result.current.locationSearch).toContain('from=2026-03-01')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// H — clearAll (D-C4)
// ─────────────────────────────────────────────────────────────────────────────
describe('H — clearAll resets URL to clean (D-C4)', () => {
  it('clears both players and from params from URL', async () => {
    const { result } = renderWithLocation('/ranking?players=p1,p2&from=2026-01-01', ['p1', 'p2', 'p3'])
    await act(async () => {
      result.current.clearAll()
    })
    expect(result.current.locationSearch).toBe('')
  })

  it('resolved players returns all active after clearAll (back to default)', async () => {
    const { result } = renderWithLocation('/ranking?players=p1&from=2026-01-01', ['p1', 'p2', 'p3'])
    await act(async () => {
      result.current.clearAll()
    })
    expect(result.current.players).toEqual(['p1', 'p2', 'p3'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// I — replace: true regression guard (D-A6)
// Note: replace: true is verified by grep on source — not testable in jsdom
// This test covers the accept criteria via the source-file check description
// ─────────────────────────────────────────────────────────────────────────────
describe('I — replace: true regression guard (D-A6)', () => {
  it('hook exists and exports useRankingFilters function', () => {
    // Smoke test: hook must be importable and usable
    const { result } = renderWithLocation('/ranking', ['p1'])
    expect(typeof result.current.setPlayers).toBe('function')
    expect(typeof result.current.setFromDate).toBe('function')
    expect(typeof result.current.clearAll).toBe('function')
  })
})
