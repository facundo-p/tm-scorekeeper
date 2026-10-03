import type { KeyboardEvent } from 'react'

/** Enter o Espacio activan un elemento con rol de botón, enlace o casilla. */
export function onActivateKey(action: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    action()
  }
}
