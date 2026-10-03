const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** Controles que pueden recibir foco dentro de `root`, en orden de documento. */
export function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => !(n as HTMLButtonElement).disabled)
}

/** Con Tab en el último control vuelve al primero, y con Shift+Tab en el primero, al último. */
export function trapTab(e: KeyboardEvent | React.KeyboardEvent, root: HTMLElement) {
  if (e.key !== 'Tab') return
  const nodes = focusables(root)
  if (!nodes.length) return
  const [first, last] = [nodes[0], nodes[nodes.length - 1]]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
