import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PATHS } from '@/shell/paths'

export const EMPTY_ERROR = 'Completá usuario y contraseña para entrar al archivo.'

/** Error de validación antes de llamar al servidor (vacío si se puede enviar). */
export const checkLogin = (user: string, pass: string) => (!user.trim() || !pass ? EMPTY_ERROR : '')

/** Estado y envío del formulario de acceso; los errores del servidor vienen de `loginErrors` (D-03). */
export function useLoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const invalid = checkLogin(user, pass)
    setError(invalid)
    if (invalid) return
    setBusy(true)
    const result = await login(user.trim(), pass)
    setBusy(false)
    if (result.ok) navigate(PATHS.home, { replace: true })
    else setError(result.error)
  }
  return { user, setUser, pass, setPass, error, busy, submit }
}
