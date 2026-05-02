import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGames } from '@/hooks/useGames'
import { triggerAchievements } from '@/api/achievements'
import { getEloChanges } from '@/api/elo'
import type { AchievementsByPlayerDTO, EloChangeDTO } from '@/types'

vi.mock('@/api/achievements', () => ({
  triggerAchievements: vi.fn(),
}))

vi.mock('@/api/elo', () => ({
  getEloChanges: vi.fn(),
}))

const mockTriggerAchievements = vi.mocked(triggerAchievements)
const mockGetEloChanges = vi.mocked(getEloChanges)

const SAMPLE_PAYLOAD: AchievementsByPlayerDTO = {
  achievements_by_player: {
    'p1': [
      { code: 'high_score', title: 'Alcanzar X puntos', tier: 1, is_new: true, is_upgrade: false, icon: null, fallback_icon: 'trophy' },
    ],
  },
}

const SAMPLE_ELO_CHANGES: EloChangeDTO[] = [
  { player_id: 'p1', player_name: 'Alice', elo_before: 1500, elo_after: 1523, delta: 23 },
  { player_id: 'p2', player_name: 'Bob', elo_before: 1500, elo_after: 1477, delta: -23 },
]

describe('useGames.fetchAchievements — retry contract (Phase 02 D-09/D-10)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockTriggerAchievements.mockReset()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('returns the payload on first success without retrying', async () => {
    mockTriggerAchievements.mockResolvedValueOnce(SAMPLE_PAYLOAD)

    const { result } = renderHook(() => useGames())

    let value: AchievementsByPlayerDTO | null = null
    await act(async () => {
      value = await result.current.fetchAchievements('game-123')
    })

    expect(value).toEqual(SAMPLE_PAYLOAD)
    expect(mockTriggerAchievements).toHaveBeenCalledTimes(1)
    expect(mockTriggerAchievements).toHaveBeenCalledWith('game-123')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('retries once and returns the payload when the first call fails and the second succeeds (Caso B)', async () => {
    mockTriggerAchievements
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(SAMPLE_PAYLOAD)

    const { result } = renderHook(() => useGames())

    let value: AchievementsByPlayerDTO | null = null
    await act(async () => {
      value = await result.current.fetchAchievements('game-123')
    })

    expect(value).toEqual(SAMPLE_PAYLOAD)
    expect(mockTriggerAchievements).toHaveBeenCalledTimes(2)
    expect(mockTriggerAchievements).toHaveBeenNthCalledWith(1, 'game-123')
    expect(mockTriggerAchievements).toHaveBeenNthCalledWith(2, 'game-123')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('returns null and warns exactly once when both attempts fail (Caso C)', async () => {
    mockTriggerAchievements
      .mockRejectedValueOnce(new Error('network down 1'))
      .mockRejectedValueOnce(new Error('network down 2'))

    const { result } = renderHook(() => useGames())

    let value: AchievementsByPlayerDTO | null = null
    await act(async () => {
      value = await result.current.fetchAchievements('game-123')
    })

    expect(value).toBeNull()
    expect(mockTriggerAchievements).toHaveBeenCalledTimes(2)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith('Failed to load achievements after retry')
  })

  it('does not retry more than once even if subsequent attempts would succeed', async () => {
    mockTriggerAchievements
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockResolvedValueOnce(SAMPLE_PAYLOAD)

    const { result } = renderHook(() => useGames())

    let value: AchievementsByPlayerDTO | null = null
    await act(async () => {
      value = await result.current.fetchAchievements('game-123')
    })

    expect(value).toBeNull()
    expect(mockTriggerAchievements).toHaveBeenCalledTimes(2)
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})

describe('useGames.fetchEloChanges — retry contract (Phase 10 D-10)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockGetEloChanges.mockReset()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('returns the payload on first success without retrying', async () => {
    mockGetEloChanges.mockResolvedValueOnce(SAMPLE_ELO_CHANGES)
    const { result } = renderHook(() => useGames())

    let value: EloChangeDTO[] | null = null
    await act(async () => {
      value = await result.current.fetchEloChanges('game-123')
    })

    expect(value).toEqual(SAMPLE_ELO_CHANGES)
    expect(mockGetEloChanges).toHaveBeenCalledTimes(1)
    expect(mockGetEloChanges).toHaveBeenCalledWith('game-123')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('retries once and returns the payload when the first call fails and the second succeeds', async () => {
    mockGetEloChanges
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(SAMPLE_ELO_CHANGES)
    const { result } = renderHook(() => useGames())

    let value: EloChangeDTO[] | null = null
    await act(async () => {
      value = await result.current.fetchEloChanges('game-123')
    })

    expect(value).toEqual(SAMPLE_ELO_CHANGES)
    expect(mockGetEloChanges).toHaveBeenCalledTimes(2)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('returns null and warns exactly once when both attempts fail', async () => {
    mockGetEloChanges
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
    const { result } = renderHook(() => useGames())

    let value: EloChangeDTO[] | null = null
    await act(async () => {
      value = await result.current.fetchEloChanges('game-123')
    })

    expect(value).toBeNull()
    expect(mockGetEloChanges).toHaveBeenCalledTimes(2)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith('Failed to load ELO changes after retry')
  })

  it('does not retry more than once even if subsequent attempts would succeed', async () => {
    mockGetEloChanges
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockResolvedValueOnce(SAMPLE_ELO_CHANGES)
    const { result } = renderHook(() => useGames())

    let value: EloChangeDTO[] | null = null
    await act(async () => {
      value = await result.current.fetchEloChanges('game-123')
    })

    expect(value).toBeNull()
    expect(mockGetEloChanges).toHaveBeenCalledTimes(2)
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})
