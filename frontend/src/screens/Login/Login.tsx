// Acceso (F28, SCR-01): port de docs/redesign/mockup/js/screens/login.js con el login real (D-03).
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PlanetCanvas, PlanetSlot } from '@/fx/planet'
import { PATHS } from '@/shell/paths'
import { Sky } from '@/shell/Sky'
import { Mark } from '@/shell/Wordmark'
import { Button, Field, inputClassFor, Plate } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Frame } from '@/ui/frame'
import { Icon } from '@/ui/icons'
import { useLoginForm } from './useLoginForm'
import styles from './Login.module.css'

function Brand() {
  return (
    <div className={styles.login__brand}>
      <Mark className={styles.login__mark} />
      <h1 className={styles.login__title}>Archivo de Terraformación</h1>
      <p className={styles.login__sub}>Partidas, ranking y récords del grupo de Terraforming Mars.</p>
    </div>
  )
}

function PasswordInput({ value, onChange, bad }: { value: string; onChange: (v: string) => void; bad: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <span className={styles.login__pass}>
      <input className={inputClassFor(bad)} id="login-pass" type={show ? 'text' : 'password'} autoComplete="current-password"
        value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={bad || undefined} />
      <button type="button" className={styles.login__eye} aria-pressed={show} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setShow(!show)}><Icon name="eye" size={18} /></button>
    </span>
  )
}

function LoginForm() {
  const f = useLoginForm()
  return (
    <Plate as="form" tone="glass" className={styles.login__form} onSubmit={f.submit} noValidate>
      <h2 className={styles.login__h}>Acceso</h2>
      {f.error && <p className={styles.login__error} role="alert"><Icon name="info" size={16} />{f.error}</p>}
      <Field label="Usuario">
        <input className={inputClassFor(!!f.error && !f.user.trim())} id="login-user" autoComplete="username" value={f.user}
          onChange={(e) => f.setUser(e.target.value)} aria-invalid={(!!f.error && !f.user.trim()) || undefined} />
      </Field>
      <Field label="Contraseña"><PasswordInput value={f.pass} onChange={f.setPass} bad={!!f.error && !f.pass} /></Field>
      <Button type="submit" variant="primary" size="l" full disabled={f.busy}>{f.busy ? 'Entrando…' : 'Ingresar'}</Button>
      <p className={cx(styles.login__help, 'faint')}>La cuenta es compartida por el grupo. Si no la tenés, pedísela a quien administra la app.</p>
    </Plate>
  )
}

export default function Login() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to={PATHS.home} replace />
  return (
    <Frame screen="login" variant="bare" sky={<><Sky /><PlanetCanvas /></>}>
      <div className={styles.login}>
        <div className={styles.login__planet}>
          <PlanetSlot terra={0.04} tilt={0.1} bright={0.95} className={styles.login__slot} label="Marte sin terraformar, visto desde la órbita" />
        </div>
        <div className={styles.login__col}>
          <Brand />
          <LoginForm />
          <p className={styles.login__status}><span className={styles.login__dot} aria-hidden="true" />Enlace con el archivo estable</p>
        </div>
      </div>
    </Frame>
  )
}
