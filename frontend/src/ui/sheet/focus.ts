const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const visible = (n: HTMLElement) => !n.closest('[hidden]') && (n.checkVisibility?.() ?? true)

/** Controles que pueden recibir foco dentro de `root`, en orden de documento (sin deshabilitados ni ocultos). */
export function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => !(n as HTMLButtonElement).disabled && visible(n))
}

/** Control que recibe el foco al abrir: el marcado con `data-autofocus` o, si no hay, el primero. */
export function initialFocus(root: HTMLElement): HTMLElement | undefined {
  return root.querySelector<HTMLElement>('[data-autofocus]') ?? focusables(root)[0]
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
