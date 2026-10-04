import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ApiError, http } from '@/api/http'

/** fetch que nunca responde: solo termina si lo cancelan. */
const hanging = (_url: string, init: RequestInit) => new Promise<Response>((_, reject) => {
  init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
})

describe('http', () => {
  const fetchMock = vi.fn()
  beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock) })
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

  it('gives up after the timeout with a typed error', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(hanging)
    const pending = http('/feed', { timeoutMs: 1000 }).catch((e) => e)
    await vi.advanceTimersByTimeAsync(1000)
    const error = await pending
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'timeout', status: 0 })
  })

  it('reports a network failure as a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(http('/feed')).rejects.toMatchObject({ kind: 'network', status: 0 })
  })

  it('lets an external cancellation through untouched', async () => {
    fetchMock.mockImplementation(hanging)
    const controller = new AbortController()
    const pending = http('/feed', { signal: controller.signal }).catch((e) => e)
    controller.abort()
    const error = await pending
    expect(error).not.toBeInstanceOf(ApiError)
    expect(error.name).toBe('AbortError')
  })

  it('http errors keep the status and the server detail', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ detail: 'Season not found' }), { status: 404 }))
    await expect(http('/seasons/9')).rejects.toMatchObject({ kind: 'http', status: 404, message: 'Season not found' })
  })
})
