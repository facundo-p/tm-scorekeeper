import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button/Button'
import styles from './Records.module.css'

export default function Records() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <span className={styles.icon}>🏆</span>
      <h1 className={styles.title}>Records</h1>
      <p className={styles.subtitle}>Esta sección estará disponible próximamente.</p>
      <Button onClick={() => navigate('/home')}>Volver al inicio</Button>
    </div>
  )
}
