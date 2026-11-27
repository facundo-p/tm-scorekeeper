// Borrador de una partida nueva en sessionStorage: sobrevive a recargar la pestaña, no a cerrarla.
import type { WizardState } from './model'

export const DRAFT_KEY = 'tm.registrar.borrador'

export function loadDraft(): WizardState | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as WizardState) : null
  } catch {
    return null
  }
}

export function saveDraft(s: WizardState) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(s)) } catch { /* sin almacenamiento: no hay borrador */ }
}

export function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* nada que borrar */ }
}
