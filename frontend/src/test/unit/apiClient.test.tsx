import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { api, ApiError, setUnauthorizedHandler, TOKEN_KEY } from '@/api/client'
import { AuthProvider, useAuth } from '@/context/AuthContext'

const ok = (body: unknown = {}) => new Response(JSON.stringify(body), { status: 200 })

describe('api client', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setUnauthorizedHandler(null)
  })

  it('sends the Bearer token when there is one, and JSON content type', async () => {
    fetchMock.mockImplementation(async () => ok([]))
    await api.get('/players/')
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'application/json' })
    localStorage.setItem(TOKEN_KEY, 'tok')
    await api.post('/games/', { a: 1 })
    expect(fetchMock.mock.calls[1][1].headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer tok' })
    expect(fetchMock.mock.calls[1][1].method).toBe('POST')
  })

  it('a 401 calls the unauthorized handler and throws ApiError', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ detail: 'No autenticado' }), { status: 401 }))
    await expect(api.get('/players/')).rejects.toEqual(new ApiError(401, 'No autenticado'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('other errors do not close the session', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    fetchMock.mockResolvedValue(new Response('no json', { status: 500 }))
    await expect(api.get('/x')).rejects.toMatchObject({ status: 500, message: 'Error 500' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('a 401 from any call logs the user out', async () => {
    localStorage.setItem(TOKEN_KEY, 'vencido')
    localStorage.setItem('tm_session', 'true')
    function Status() { return <p>{useAuth().isAuthenticated ? 'dentro' : 'fuera'}</p> }
    render(<AuthProvider><Status /></AuthProvider>)
    expect(screen.getByText('dentro')).toBeInTheDocument()
    expect(localStorage.getItem('tm_session')).toBeNull()
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }))
    await act(async () => { await api.get('/players/').catch(() => {}) })
    expect(screen.getByText('fuera')).toBeInTheDocument()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
