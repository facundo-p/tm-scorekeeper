import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/Button/Button'
import Input from '@/components/Input/Input'
import styles from './Login.module.css'

export default function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to="/home" replace />

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const ok = login(username, password)
    if (ok) {
      navigate('/home')
    } else {
      setError('Usuario o contraseña incorrectos.')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <h1 className={styles.title}>TM Scorekeeper</h1>
          <p className={styles.subtitle}>Terraforming Mars — Registro de partidas</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}
          <Input
            label="Usuario"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoFocus
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button type="submit" fullWidth>
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  )
}
