import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Un parámetro de la URL como estado: [valor, setter]; `null` lo quita y conserva el resto. */
export function useSearchParam(name: string): [string | null, (value: string | null) => void] {
  const [params, setParams] = useSearchParams()
  const set = useCallback((value: string | null) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(name, value)
      else next.delete(name)
      return next
    })
  }, [name, setParams])
  return [params.get(name), set]
}
