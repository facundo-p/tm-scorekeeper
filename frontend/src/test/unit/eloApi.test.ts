import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the api client BEFORE importing the SUT so the mock is applied.
// We capture every path passed to api.get so each test can assert on it.
const getMock = vi.fn((_path: string) => Promise.resolve([]))
vi.mock('@/api/client', () => ({
  api: {
    get: (path: string) => getMock(path),
  },
}))

// Import AFTER vi.mock so the SUT picks up the mocked client.
import { getEloHistory } from '@/api/elo'

describe('getEloHistory', () => {
  beforeEach(() => {
    getMock.mockClear()
  })

  it('calls /elo/history with no query string when no params', async () => {
    await getEloHistory()
    expect(getMock).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledWith('/elo/history')
  })

  it('calls /elo/history with no query string when params is empty object', async () => {
    await getEloHistory({})
    expect(getMock).toHaveBeenCalledWith('/elo/history')
  })

  it('calls /elo/history with no query string when playerIds is empty array', async () => {
    await getEloHistory({ playerIds: [] })
    expect(getMock).toHaveBeenCalledWith('/elo/history')
  })

  it('serializes single playerId as ?player_ids=<id>', async () => {
    await getEloHistory({ playerIds: ['p-alice'] })
    const path = getMock.mock.calls[0][0] as string
    expect(path).toMatch(/^\/elo\/history\?player_ids=p-alice$/)
  })

  it('serializes multiple playerIds joined by comma in a single param', async () => {
    await getEloHistory({ playerIds: ['p-alice', 'p-bob'] })
    const path = getMock.mock.calls[0][0] as string
    // URLSearchParams may percent-encode the comma (%2C) or leave it raw — accept both.
    expect(path).toMatch(/^\/elo\/history\?player_ids=p-alice(%2C|,)p-bob$/)
    // Must be a single param (no &player_ids= repeated).
    const occurrences = (path.match(/player_ids=/g) ?? []).length
    expect(occurrences).toBe(1)
  })
})
