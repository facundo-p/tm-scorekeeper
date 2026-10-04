// TanStack Query envuelto en hooks con la forma del skill new-hook (D-10): cada hook devuelve
// { <dato>, loading, error, refetch }. La clave de cache es la ruta con su query string, así
// el filtro (por ejemplo ?player_count=) siempre separa las entradas.
import { keepPreviousData, QueryClient, useQuery } from '@tanstack/react-query'
import { ApiError, http } from '@/api/http'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Un 4xx no mejora reintentando; la red o la espera sí (el servidor puede estar despertando).
        retry: (count, error) => count < 1 && !(error instanceof ApiError && error.kind === 'http'),
      },
    },
  })
}

/** Ruta con la query string ordenada y sin valores vacíos. */
export function apiPath(path: string, query: Record<string, string | number | null | undefined> = {}): string {
  const entries = Object.entries(query).filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (!entries.length) return path
  const qs = new URLSearchParams(entries.sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, String(v)]))
  return `${path}?${qs}`
}

export interface ApiQuery<T> {
  data: T | undefined
  loading: boolean
  error: ApiError | Error | null
  refetch: () => void
}

/**
 * GET de la API con cache por ruta; `enabled: false` no pide nada. `keepPrevious`: al cambiar un filtro (otra clave de la misma vista) se sigue mostrando el dato
 * anterior hasta que llega el nuevo, en vez de volver al estado de carga.
 */
export function useApiQuery<T>(path: string, enabled = true, keepPrevious = false): ApiQuery<T> {
  const query = useQuery({
    queryKey: [path],
    queryFn: ({ signal }) => http<T>(path, { signal }),
    enabled,
    placeholderData: keepPrevious ? keepPreviousData : undefined,
  })
  return { data: query.data, loading: query.isPending && enabled, error: query.error, refetch: () => void query.refetch() }
}
