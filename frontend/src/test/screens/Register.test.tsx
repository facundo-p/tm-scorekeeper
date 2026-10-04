import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { createQueryClient } from '@/data/query'
import Register from '@/screens/Register/Register'
import { DRAFT_KEY } from '@/screens/Register/draft'

const PLAYERS = [
  { player_id: 'a', name: 'Ana', color: 'rojo', is_active: true, elo: 1000, since: null, seq: 1 },
  { player_id: 'b', name: 'Beto', color: 'azul', is_active: true, elo: 1000, since: null, seq: 2 },
]
const GAME = {
  id: 'g-1', date: '2026-01-10', map: 'Hellas', expansions: [], draft: false, generations: 9, awards: [],
  player_results: [
    { player_id: 'a', corporation: 'Helion', end_stats: { mc_total: 5 }, scores: { terraform_rating: 30, milestones: [] } },
    { player_id: 'b', corporation: 'Ecoline', end_stats: { mc_total: 3 }, scores: { terraform_rating: 25, milestones: [] } },
  ],
}

function Where() {
  const { pathname, search } = useLocation()
  return <span data-testid="where">{pathname + search}</span>
}

let calls: { url: string; init?: RequestInit }[] = []
function api(url: string, init?: RequestInit) {
  calls.push({ url, init })
  const body = init?.method === 'POST' || init?.method === 'PUT' ? { id: 'g-new' }
    : url.includes('/players') ? PLAYERS : { game: GAME }
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
}

const renderAt = (url: string) => render(
  <QueryClientProvider client={createQueryClient()}>
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/registrar" element={<Register />} />
        <Route path="/partidas/:gameId/editar" element={<Register />} />
        <Route path="*" element={<p>otra</p>} />
      </Routes>
      <Where />
    </MemoryRouter>
  </QueryClientProvider>,
)

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('Registrar', () => {
  beforeEach(() => { calls = []; sessionStorage.clear(); vi.stubGlobal('fetch', vi.fn(api)) })
  afterEach(() => vi.unstubAllGlobals())

  it('a new game walks the five steps and is saved with POST, then goes to the ceremony', async () => {
    renderAt('/registrar')
    fireEvent.click(await screen.findByRole('radio', { name: /Tharsis/ }))
    click('Siguiente: Mesa')
    click('Ana'); click('Beto')
    fireEvent.change(screen.getByLabelText('Corporación de Ana'), { target: { value: 'Helion' } })
    fireEvent.change(screen.getByLabelText('Corporación de Beto'), { target: { value: 'Ecoline' } })
    click('Siguiente: Hitos y recompensas'); click('Siguiente: Puntaje'); click('Siguiente: Revisión')
    click('Guardar partida')
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/partidas/g-new/ceremonia'))
    const post = calls.find((c) => c.init?.method === 'POST')!
    expect(JSON.parse(String(post.init!.body))).toMatchObject({ map: 'Tharsis', player_results: [{ player_id: 'a', corporation: 'Helion' }, { player_id: 'b' }] })
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('errors stop the step and say what is missing', async () => {
    renderAt('/registrar')
    fireEvent.click(await screen.findByRole('button', { name: 'Siguiente: Mesa' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Elegí el mapa en el que jugaron.')
    expect(screen.getByRole('heading', { level: 2, name: 'Partida' })).toBeInTheDocument()
  })

  it('the draft survives a reload of the tab', async () => {
    const { unmount } = renderAt('/registrar')
    fireEvent.click(await screen.findByRole('radio', { name: /Hellas/ }))
    await waitFor(() => expect(sessionStorage.getItem(DRAFT_KEY)).toContain('"map":"Hellas"'))
    unmount()
    renderAt('/registrar')
    expect(await screen.findByRole('radio', { name: /Hellas/ })).toBeChecked()
  })

  it('editing loads the game and saves it with PUT, back to the report with a notice', async () => {
    renderAt('/partidas/g-1/editar')
    expect(await screen.findByRole('heading', { level: 1, name: 'Editar partida' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Hellas/ })).toBeChecked()
    for (const step of ['Siguiente: Mesa', 'Siguiente: Hitos y recompensas', 'Siguiente: Puntaje', 'Siguiente: Revisión']) click(step)
    click('Guardar cambios')
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/partidas/g-1?aviso=editada'))
    expect(calls.some((c) => c.init?.method === 'PUT' && c.url.endsWith('/games/g-1'))).toBe(true)
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('a rejected save stays on the review and shows the error; the edit is not kept as a draft', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => (init?.method === 'PUT'
      ? Promise.resolve(new Response(JSON.stringify({ detail: 'Ya existe esa partida' }), { status: 422 }))
      : api(url, init))))
    renderAt('/partidas/g-1/editar')
    await screen.findByRole('heading', { level: 1, name: 'Editar partida' })
    for (const step of ['Siguiente: Mesa', 'Siguiente: Hitos y recompensas', 'Siguiente: Puntaje', 'Siguiente: Revisión']) click(step)
    click('Guardar cambios')
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe esa partida')
    expect(screen.getByTestId('where')).toHaveTextContent('/partidas/g-1/editar')
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull()
  })
})
