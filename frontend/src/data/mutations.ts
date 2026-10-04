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
