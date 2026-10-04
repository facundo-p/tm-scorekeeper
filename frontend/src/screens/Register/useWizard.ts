import { useEffect, useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSaveGame } from '@/data/mutations'
import { PATHS } from '@/shell/paths'
import { reducedMotion } from '@/ui/motion'
import { clearDraft, saveDraft } from './draft'
import { toPayload } from './io'
import { reducer, validate, type WizardError, type WizardState } from './model'

/** «Borrador guardado»: el borrador se guarda enseguida; la demora solo anima el aviso (D-39). */
function useSavedBadge(s: WizardState) {
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    if (!s.example && !s.editing) saveDraft(s)
    if (reducedMotion()) { setSaved(true); return undefined }
    setSaved(false)
    const t = window.setTimeout(() => setSaved(true), 700)
    return () => window.clearTimeout(t)
  }, [s])
  return saved
}

/** Estado, pasos, validación y guardado del asistente. */
export function useWizard(initial: WizardState, name: (id: string) => string) {
  const navigate = useNavigate()
  const [s, d] = useReducer(reducer, initial)
  const [errors, setErrors] = useState<WizardError[]>([])
  const saved = useSavedBadge(s)
  const save = useSaveGame((id) => {
    if (!s.editing) clearDraft()
    navigate(s.editing ? `${PATHS.game(id)}?aviso=editada` : PATHS.ceremony(id))
  })
  const go = (step: number) => {
    setErrors([])
    d({ type: 'step', step })
    document.querySelector('[data-scroll-root]')?.scrollTo?.({ top: 0 })
  }
  const next = () => {
    const e = validate(s, name)
    setErrors(e)
    if (!e.length) go(s.step + 1)
  }
  const reset = () => { d({ type: 'reset' }); setErrors([]) }
  const submit = () => save.mutate({ id: s.editing, body: toPayload(s) })
  return { s, d, errors, saved, go, next, reset, submit, saving: save.isPending, saveError: save.error }
}
