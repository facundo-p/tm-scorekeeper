// Escrituras de la API v2.0. Después de cada una se invalida todo el cache: una partida cambia
// el ELO, los récords, los logros y las temporadas de lo que viene después (D-04).
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '@/api/http'

export function useDeleteGame() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (gameId: string) => http<void>(`/games/${encodeURIComponent(gameId)}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries(),
  })
}
