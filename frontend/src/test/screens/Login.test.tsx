import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Login from '@/screens/Login/Login'
import { TOKEN_KEY } from '@/api/client'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/acceso']}>
        <Routes>
          <Route path="/acceso" element={<Login />} />
          <Route path="/" element={<p>inicio</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

function submit(username: string, password: string) {
  fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: username } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))
}

describe('Login', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    fetchMock.mockReset()
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('renders username and password fields', () => {
    renderLogin()
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })

  it('posts the credentials to /auth/login and stores the token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { access_token: 'tok', token_type: 'bearer', expires_in: 60 }))
    renderLogin()
    submit('grupo', 'marte')
    expect(await screen.findByText('inicio')).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/auth\/login$/)
    expect(JSON.parse(init.body)).toEqual({ username: 'grupo', password: 'marte' })
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok')
  })

  it.each([
    [401, /usuario o contraseña incorrectos/i],
    [429, /demasiados intentos/i],
    [503, /no está configurado/i],
  ])('shows the error for status %i', async (status, message) => {
    fetchMock.mockResolvedValue(jsonResponse(status, { detail: 'x' }))
    renderLogin()
    submit('grupo', 'mal')
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('shows a connection error when the server is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderLogin()
    submit('grupo', 'marte')
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo conectar/i)
  })

  it('clears the error between attempts', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { access_token: 'tok', token_type: 'bearer', expires_in: 60 }))
    renderLogin()
    submit('grupo', 'mal')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    submit('grupo', 'marte')
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('empty fields are flagged without calling the server', () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(screen.getByRole('alert')).toHaveTextContent('Completá usuario y contraseña para entrar al archivo.')
    expect(screen.getByLabelText(/usuario/i)).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('the eye shows and hides the password', () => {
    renderLogin()
    const eye = screen.getByRole('button', { name: 'Mostrar contraseña' })
    fireEvent.click(eye)
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('with a session it goes straight to the start', () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    renderLogin()
    expect(screen.getByText('inicio')).toBeInTheDocument()
  })
})
