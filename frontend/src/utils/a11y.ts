import type { KeyboardEvent } from 'react'

/**
 * Enter o Espacio activan un elemento con rol de botón, enlace o casilla. Solo cuando el
 * foco está en el propio elemento: las teclas que suben desde un control hijo (un botón
 * dentro de una tarjeta) son de ese control.
 */
export function onActivateKey(action: () => void) {
  return (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    action()
  }
}
