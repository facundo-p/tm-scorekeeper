import { ApiError } from '@/api/client'

const BY_STATUS: Record<number, string> = {
  401: 'Usuario o contraseña incorrectos.',
  422: 'Completá usuario y contraseña.',
  429: 'Demasiados intentos. Esperá 30 segundos y volvé a probar.',
  503: 'El acceso no está configurado en el servidor.',
}

/** Mensaje para la pantalla de acceso según la respuesta del login. */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return BY_STATUS[error.status] ?? 'No se pudo ingresar. Probá de nuevo.'
  return 'No se pudo conectar con el servidor.'
}
