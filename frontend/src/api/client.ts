// Dev: VITE_API_URL undefined → '/api' → vite proxy strips prefix → backend local
// Prod: VITE_API_URL = 'https://backend.onrender.com' → llamadas directas
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

/** Clave del token en localStorage (D-25). */
export const TOKEN_KEY = 'tm_token'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** localStorage puede fallar (modo privado, bloqueado): sin token no hay sesión. */
export const tokenStore = {
  get(): string | null {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set(token: string) {
    try { localStorage.setItem(TOKEN_KEY, token) } catch { /* sesión solo en memoria */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY) } catch { /* nada que borrar */ }
  },
}

let onUnauthorized: (() => void) | null = null

/** Lo registra la sesión: un 401 de cualquier llamada la cierra (D-53). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

function authHeader(): Record<string, string> {
  const token = tokenStore.get()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function errorMessage(response: Response) {
  try {
    const data = await response.json()
    return data.detail ?? data.message ?? `Error ${response.status}`
  } catch {
    return `Error ${response.status}`
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = options
  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...headers },
  })
  if (!response.ok) {
    if (response.status === 401) onUnauthorized?.()
    throw new ApiError(response.status, await errorMessage(response))
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
