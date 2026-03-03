import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/Button/Button'
import styles from './Home.module.css'

const navItems = [
  { to: '/players', icon: '👥', title: 'Jugadores', description: 'Gestión de jugadores', disabled: false },
  { to: '/games/new', icon: '🎯', title: 'Cargar Partida', description: 'Registrar nueva partida', disabled: false },
  { to: '/games', icon: '📋', title: 'Partidas', description: 'Historial de partidas', disabled: false },
  { to: '/records', icon: '🏆', title: 'Records', description: 'Próximamente', disabled: true },
]

export default function Home() {
  const { logout } = useAuth()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.headerTitle}>TM Scorekeeper</span>
        <Button variant="ghost" size="sm" onClick={logout}>
          Salir
        </Button>
      </header>
      <main className={styles.main}>
        <div className={styles.welcome}>
          <h1 className={styles.welcomeTitle}>Terraforming Mars</h1>
          <p className={styles.welcomeSubtitle}>¿Qué querés hacer?</p>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) =>
            item.disabled ? (
              <div key={item.to} className={[styles.card, styles.disabled].join(' ')}>
                <span className={styles.cardIcon}>{item.icon}</span>
                <span className={styles.cardTitle}>{item.title}</span>
                <span className={styles.cardBadge}>Próximamente</span>
              </div>
            ) : (
              <Link key={item.to} to={item.to} className={styles.card}>
                <span className={styles.cardIcon}>{item.icon}</span>
                <span className={styles.cardTitle}>{item.title}</span>
                <span className={styles.cardBadge}>{item.description}</span>
              </Link>
            ),
          )}
        </nav>
      </main>
    </div>
  )
}
