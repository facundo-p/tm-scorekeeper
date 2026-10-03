const matches = (query: string) => typeof matchMedia === 'function' && matchMedia(query).matches

/** true si el sistema pide menos movimiento (también congela las capturas, D-11). */
export const reducedMotion = () => matches('(prefers-reduced-motion: reduce)')

/** true en pantallas táctiles sin puntero que flote. */
export const noHover = () => matches('(hover: none)')
