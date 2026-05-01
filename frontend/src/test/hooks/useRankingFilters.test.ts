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
// A — Default branch: clean URL → resolve to all active players, do not
// rewrite (the URL stays clean unless the user explicitly picks something).
// ─────────────────────────────────────────────────────────────────────────────
describe('A — Default branch: URL clean → all active', () => {
  it('returns all activePlayerIds when URL has no players key', () => {
    const { result } = renderWithLocation('/ranking', ['p1', 'p2', 'p3'])
    expect(result.current.players).toEqual(['p1', 'p2', 'p3'])
    expect(result.current.fromDate).toBeNull()
  })

  it('does NOT rewrite the URL on mount (URL stays clean for the default state)', () => {
    const { result } = renderWithLocation('/ranking', ['p1', 'p2', 'p3'])
    expect(result.current.locationSearch).toBe('')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// B — Intersection drop + idempotent rewrite: when the URL has player ids
// that no longer exist (e.g. a stale shared link), drop them, surface only
// the valid ones, and rewrite the URL to canonical sorted form. The rewrite
// must be idempotent — re-running the effect must NOT trigger a second
// setSearchParams (otherwise: setSearchParams → searchParams change →
// effect re-runs → infinite loop).
// ─────────────────────────────────────────────────────────────────────────────
describe('B — Intersection drop + idempotent URL rewrite', () => {
  it('drops ghost IDs and resolves to valid intersection', async () => {
    const { result } = renderWithLocation('/ranking?players=p1,ghost,p2', ['p1', 'p2', 'p3'])
    // After effect runs, resolved players should be ['p1', 'p2'] (sorted)
    await act(async () => {})
    expect(result.current.players).toEqual(['p1', 'p2'])
  })

  it('rewrites URL exactly ONCE to canonical sorted form (no infinite re-fire loop)', async () => {
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
// C — Empty intersection: when EVERY id in the URL is unknown, the UI falls
// back to all active players in memory AND the URL is cleaned (drop the
// `players` key entirely) so a reload starts fresh instead of re-trying
// the dead ids on every visit.
// ─────────────────────────────────────────────────────────────────────────────
describe('C — Empty intersection → fallback to all active + URL clean', () => {
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

  it('does NOT rewrite URL a second time after empty-intersection rewrite (idempotency guard)', async () => {
    const { result, rerender } = renderWithLocation('/ranking?players=ghost1,ghost2', ['p1', 'p2'])
    await act(async () => {})
    const searchAfterFirst = result.current.locationSearch

    rerender()
    await act(async () => {})
    expect(result.current.locationSearch).toBe(searchAfterFirst)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// D — Explicit empty selection: `?players=` (key present, empty value) means
// the user actively deselected every player. Respect it — render the empty
// state — and do NOT rewrite the URL back to the all-active default.
// ─────────────────────────────────────────────────────────────────────────────
describe('D — Explicit empty ?players= → respect, no URL rewrite', () => {
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
// E — Loading state: when activePlayerIds is null (parent page is still
// fetching the active player list) the hook must render an empty selection
// and leave the URL untouched — there's no way to safely intersect against
// an unknown set, and writing to the URL during the loading flash would
// corrupt the user's filter state.
// ─────────────────────────────────────────────────────────────────────────────
describe('E — activePlayerIds === null (parent still loading)', () => {
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
// F — setPlayers setter: writes player selection to URL with stable sort
// order so reordering the picker doesn't churn the URL, preserves any
// existing `from` filter, and signals "explicit empty" via `?players=`
// when the user deselects everything.
// ─────────────────────────────────────────────────────────────────────────────
describe('F — setPlayers setter', () => {
  it('sorts players before serializing so URL is canonical regardless of selection order', async () => {
    const { result } = renderWithLocation('/ranking', ['p1', 'p2', 'p3'])
    await act(async () => {
      result.current.setPlayers(['p2', 'p1'])
    })
    // Sorted: p1,p2 → encoded as p1%2Cp2 in URLSearchParams
    expect(result.current.locationSearch).toContain('players=')
    expect(result.current.players).toEqual(['p1', 'p2'])
  })

  it('writes ?players= (explicit empty) when setPlayers([]) called', async () => {
    const { result } = renderWithLocation('/ranking?players=p1', ['p1', 'p2'])
    await act(async () => {
      result.current.setPlayers([])
    })
    expect(result.current.locationSearch).toContain('players=')
    expect(result.current.players).toEqual([])
  })

  it('preserves fromDate in URL when setPlayers called with fromDate present', async () => {
    const { result } = renderWithLocation('/ranking?players=p1&from=2026-01-01', ['p1', 'p2', 'p3'])
    await act(async () => {
      result.current.setPlayers(['p2', 'p1'])
    })
    expect(result.current.locationSearch).toContain('from=2026-01-01')
    expect(result.current.locationSearch).toContain('players=')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// G — setFromDate setter: writes the date as an opaque YYYY-MM-DD string
// straight to the URL (no Date constructor, no TZ shifting), and accepts
// null to clear the filter while preserving the player selection.
// ─────────────────────────────────────────────────────────────────────────────
describe('G — setFromDate setter (opaque YYYY-MM-DD string, no Date wrapping)', () => {
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
// H — clearAll: drops both query keys so the URL goes back to clean
// `/ranking`, and the next render falls through to the all-active default.
// ─────────────────────────────────────────────────────────────────────────────
describe('H — clearAll resets URL to clean', () => {
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
// I — `replace: true` regression guard: every URL write must use
// `setSearchParams(..., { replace: true })` so filter changes do NOT add
// browser-history entries (back button should jump straight back to the
// referrer, not walk through every filter toggle). The actual `replace: true`
// flag is verified by source grep — this smoke test just confirms the hook
// remains importable and returns the expected setter shape.
// ─────────────────────────────────────────────────────────────────────────────
describe('I — replace: true regression guard (hook surface)', () => {
  it('hook exists and exports useRankingFilters function', () => {
    // Smoke test: hook must be importable and usable
    const { result } = renderWithLocation('/ranking', ['p1'])
    expect(typeof result.current.setPlayers).toBe('function')
    expect(typeof result.current.setFromDate).toBe('function')
    expect(typeof result.current.clearAll).toBe('function')
  })
})
