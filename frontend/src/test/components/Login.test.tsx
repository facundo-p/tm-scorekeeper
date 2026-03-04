import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Login from '@/pages/Login/Login'

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('Login', () => {
  beforeEach(() => {
    // Clear session state between tests
    localStorage.clear()
  })

  it('renders username and password fields', () => {
    renderLogin()
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('shows error on wrong credentials', () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(screen.getByText(/usuario o contraseña incorrectos/i)).toBeInTheDocument()
  })

  it('does not show error on valid credentials', () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'admin' } })
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(screen.queryByText(/usuario o contraseña incorrectos/i)).not.toBeInTheDocument()
  })

  it('clears error between attempts', () => {
    renderLogin()
    // First attempt - wrong credentials
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: 'bad' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'bad' } })
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(screen.getByText(/usuario o contraseña incorrectos/i)).toBeInTheDocument()

    // Second attempt - correct credentials (form navigates away, error disappears)
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'admin' } })
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(screen.queryByText(/usuario o contraseña incorrectos/i)).not.toBeInTheDocument()
  })
})
