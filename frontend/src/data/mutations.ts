// Escrituras de la API v2.0. Después de cada una se invalida todo el cache: una partida cambia
// el ELO, los récords, los logros y las temporadas de lo que viene después (D-04).
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '@/api/http'

/**
 * Borra una partida. `onDeleted` corre antes de invalidar (por ejemplo, para salir del informe):
 * si no, el informe borrado se volvería a pedir, daría 404 y desmontaría a quien navega.
 */
export function useDeleteGame(onDeleted: () => void) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (gameId: string) => http<void>(`/games/${encodeURIComponent(gameId)}`, { method: 'DELETE' }),
    onSuccess: (_, gameId) => {
      onDeleted()
      client.removeQueries({ queryKey: [`/games/${encodeURIComponent(gameId)}/report`] })
      void client.invalidateQueries()
    },
  })
}

interface GameWriteResponse { id: string }

/** Crea (POST) o edita (PUT) una partida; el servidor recalcula todo lo posterior en la misma transacción. */
export function useSaveGame(onSaved: (id: string) => void) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: unknown }) =>
      http<GameWriteResponse>(id ? `/games/${encodeURIComponent(id)}` : '/games/', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) }),
    onSuccess: (res, { id }) => {
      onSaved(id ?? res.id)
      void client.invalidateQueries()
    },
  })
}

export interface PlayerWrite { name?: string; color?: string; is_active?: boolean }

/** Alta (POST) o edición (PATCH) de un jugador; 409 si el color ya lo usa otro activo. */
export function useSavePlayer(onSaved: () => void) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: PlayerWrite }) =>
      http<unknown>(id ? `/players/${encodeURIComponent(id)}` : '/players/', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      onSaved()
      void client.invalidateQueries()
    },
  })
}
