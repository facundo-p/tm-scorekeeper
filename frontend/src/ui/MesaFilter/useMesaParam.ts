import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Tamaños de mesa válidos para el filtro (owner's point 5). */
export const TABLE_SIZES = [2, 3, 4, 5] as const
export type TableSize = (typeof TABLE_SIZES)[number]

/** `?mesa=N` válido o null (cualquier otro valor se ignora, como en el mockup). */
export function mesaOf(raw: string | null): TableSize | null {
  const n = Number(raw)
  return (TABLE_SIZES as readonly number[]).includes(n) ? (n as TableSize) : null
}

/** El filtro de mesa vive en la URL: [mesa, setMesa] sobre `?mesa=`. */
export function useMesaParam(): [TableSize | null, (n: TableSize | null) => void] {
  const [params, setParams] = useSearchParams()
  const setMesa = useCallback((n: TableSize | null) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (n) next.set('mesa', String(n))
      else next.delete('mesa')
      return next
    })
  }, [setParams])
  return [mesaOf(params.get('mesa')), setMesa]
}
