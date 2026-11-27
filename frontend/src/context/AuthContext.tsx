import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { loginRequest } from '@/api/auth'
import { setUnauthorizedHandler, tokenStore } from '@/api/client'
import { loginErrorMessage } from './loginErrors'

/** Marca de la sesión simulada anterior a v2.0; se borra al iniciar. */
const LEGACY_SESSION_KEY = 'tm_session'

export type LoginResult = { ok: true } | { ok: false; error: string }

interface AuthContextValue {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function dropLegacySession() {
  try { localStorage.removeItem(LEGACY_SESSION_KEY) } catch { /* sin almacenamiento */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => tokenStore.get() !== null)

  const logout = useCallback(() => {
    tokenStore.clear()
    setIsAuthenticated(false)
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    try {
      const { access_token } = await loginRequest(username, password)
      tokenStore.set(access_token)
      setIsAuthenticated(true)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: loginErrorMessage(error) }
    }
  }, [])

  useEffect(() => {
    dropLegacySession()
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
