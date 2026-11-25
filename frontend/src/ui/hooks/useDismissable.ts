import { useCallback, useEffect, useRef, useState } from 'react'

/** Abierto/cerrado que se cierra al tocar afuera o con Escape (burbujas de ayuda). */
export function useDismissable<T extends HTMLElement>() {
  const [open, setOpen] = useState(false)
  const ref = useRef<T>(null)
  const toggle = useCallback(() => setOpen((o) => !o), [])
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return { open, toggle, ref }
}
