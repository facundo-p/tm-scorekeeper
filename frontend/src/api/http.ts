// Cliente HTTP de la API (F26, SHELL-03): Bearer, 15 s de espera, cancelación y errores tipados.
// Dev: VITE_API_URL sin definir → '/api' → el proxy de Vite quita el prefijo → backend local.
// Prod: VITE_API_URL = 'https://backend.onrender.com' → llamadas directas.
export const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

/** Clave del token en localStorage (D-25). */
export const TOKEN_KEY = 'tm_token'

/** El servidor gratuito puede tardar en despertar; después de esto se muestra el error. */
export const REQUEST_TIMEOUT_MS = 15_000

export type ApiErrorKind = 'http' | 'timeout' | 'network'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public kind: ApiErrorKind = 'http',
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

export interface HttpOptions extends Omit<RequestInit, 'signal'> {
  /** Cancelación externa (por ejemplo, la de TanStack Query al desmontar). */
  signal?: AbortSignal
  timeoutMs?: number
}

/** Une la cancelación externa con la de la espera máxima. */
function deadline(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs)
  const forward = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', forward, { once: true })
  const done = () => { clearTimeout(timer); signal?.removeEventListener('abort', forward) }
  return { signal: controller.signal, done, timedOut: () => controller.signal.reason === 'timeout' }
}

async function send(path: string, options: HttpOptions): Promise<Response> {
  const { headers, signal, timeoutMs = REQUEST_TIMEOUT_MS, ...rest } = options
  const limit = deadline(signal, timeoutMs)
  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...rest, signal: limit.signal,
      headers: { 'Content-Type': 'application/json', ...authHeader(), ...headers },
    })
  } catch (error) {
    if (limit.timedOut()) throw new ApiError(0, 'El servidor no respondió a tiempo', 'timeout')
    if (signal?.aborted) throw error
    throw new ApiError(0, 'No se pudo conectar con el servidor', 'network')
  } finally {
    limit.done()
  }
}

/** Pide `path` y devuelve el JSON; un 401 cierra la sesión. */
export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const response = await send(path, options)
  if (!response.ok) {
    if (response.status === 401) onUnauthorized?.()
    throw new ApiError(response.status, await errorMessage(response))
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
