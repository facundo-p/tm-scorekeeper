import { useState, useEffect, useCallback } from 'react'
import { getPlayers, createPlayer, updatePlayer } from '@/api/players'
import type { PlayerResponseDTO, PlayerCreateDTO, PlayerUpdateDTO } from '@/types'

interface UsePlayersOptions {
  activeOnly?: boolean
}

export function usePlayers({ activeOnly }: UsePlayersOptions = {}) {
  const [players, setPlayers] = useState<PlayerResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPlayers(activeOnly)
      setPlayers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar jugadores')
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => { fetchPlayers() }, [fetchPlayers])

  const addPlayer = useCallback(async (data: PlayerCreateDTO): Promise<void> => {
    await createPlayer(data)
    await fetchPlayers()
  }, [fetchPlayers])

  const editPlayer = useCallback(async (id: string, data: PlayerUpdateDTO): Promise<void> => {
    await updatePlayer(id, data)
    await fetchPlayers()
  }, [fetchPlayers])

  return { players, loading, error, refetch: fetchPlayers, addPlayer, editPlayer }
}
