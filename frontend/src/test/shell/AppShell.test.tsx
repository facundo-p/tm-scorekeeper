import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { TOKEN_KEY } from '@/api/http'
import { AuthProvider } from '@/context/AuthContext'
import { createQueryClient } from '@/data/query'
import { AppRoutes } from '@/routes'
import { ErrorBoundary } from '@/shell/ErrorBoundary'

const FEED = [
  { date: '2026-09-27', type: 'game', game_id: 'g-063', player_id: 'p-juli', text: 'Juli ganó en Tharsis por 3 puntos' },
  { date: '2026-09-27', type: 'record', game_id: 'g-063', player_id: 'p-juli', code: 'x', text: 'Juli rompió «Rey de los bosques»' },
]
const SEASON = { number: 3, pct: 0.4567, race: { qualified: [], pending: [] } }
const PLAYERS = [{ player_id: 'p-juli', name: 'Juli', color: 'verde', is_active: true, elo: 1000, since: null }]

function api(url: string) {
  const body = url.includes('/feed') ? FEED : url.includes('/seasons/current') ? SEASON : url.includes('/players/') ? PLAYERS : []
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
}

function Where() {
  return <output data-testid="where">{useLocation().pathname}</output>
}

function renderAt(url: string) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={[url]}><AppRoutes /><Where /></MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('shell y rutas', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn(api))
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
  })
  afterEach(() => vi.unstubAllGlobals())

  it('without a session every screen goes to /acceso', async () => {
    renderAt('/ranking')
    expect(await screen.findByRole('button', { name: /ingresar/i })).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent('/acceso')
  })

  it('an unknown path shows the 404 inside the shell, with the ticker and the season', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    renderAt('/no-existe')
    expect(await screen.findByRole('heading', { name: 'Esta coordenada no está en el archivo' })).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'Secciones' })).toHaveLength(2)
    expect(await screen.findByText('Juli rompió «Rey de los bosques»')).toBeInTheDocument()
    expect(await screen.findByText('46 % terraformado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
  })

  it.each([
    ['/home', '/'], ['/games', '/partidas'], ['/games/new', '/registrar'], ['/achievements', '/logros'],
    ['/players/p-facu/profile', '/jugadores/p-facu'],
  ])('old route %s redirects to %s (D-02)', async (from, to) => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    renderAt(from)
    expect(await screen.findByTestId('where')).toHaveTextContent(new RegExp(`^${to}$`))
  })

  it('the old login route goes to /acceso', async () => {
    renderAt('/login')
    expect(await screen.findByRole('button', { name: /ingresar/i })).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent('/acceso')
  })

  it('the current section is marked in the navigation', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    renderAt('/logros')
    const current = await screen.findAllByRole('link', { current: 'page' })
    expect(current.map((a) => a.textContent)).toEqual(['Trofeos', 'Trofeos'])
  })
})

describe('ErrorBoundary', () => {
  function Boom(): never {
    throw new Error('boom')
  }

  it('shows the error state instead of a blank screen and recovers on navigation', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { rerender } = render(<ErrorBoundary resetKey="/a"><Boom /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toHaveTextContent('Se perdió el enlace con el archivo')
    rerender(<ErrorBoundary resetKey="/b"><p>ok</p></ErrorBoundary>)
    expect(screen.getByText('ok')).toBeInTheDocument()
  })
})
