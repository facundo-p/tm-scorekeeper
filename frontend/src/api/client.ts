// Fachada del cliente HTTP para el código previo a v2.0 (F26 movió el núcleo a ./http).
import { http } from './http'

export { ApiError, TOKEN_KEY, setUnauthorizedHandler, tokenStore } from './http'

const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) })

export const api = {
  get: <T>(path: string) => http<T>(path),
  post: <T>(path: string, body: unknown) => http<T>(path, json('POST', body)),
  patch: <T>(path: string, body: unknown) => http<T>(path, json('PATCH', body)),
  put: <T>(path: string, body: unknown) => http<T>(path, json('PUT', body)),
  delete: <T>(path: string) => http<T>(path, { method: 'DELETE' }),
}
