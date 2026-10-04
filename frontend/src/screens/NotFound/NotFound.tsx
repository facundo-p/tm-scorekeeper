import { PATHS } from '@/shell/paths'
import { ButtonLink } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import reveal from '@/ui/reveal.module.css'
import styles from './NotFound.module.css'

/** 404: una ruta que no corresponde a ninguna pantalla. */
export default function NotFound() {
  return (
    <section className={cx(styles.notfound, reveal.reveal)} aria-labelledby="nf-title">
      <span className={styles.notfound__code} aria-hidden="true">404</span>
      <h1 className={styles.notfound__title} id="nf-title">Esta coordenada no está en el archivo</h1>
      <p className="muted">La página que buscás no existe o cambió de lugar. Las partidas, el ranking y los récords siguen donde siempre.</p>
      <ButtonLink to={PATHS.home} variant="primary" icon="home" className={styles.notfound__go}>Volver al inicio</ButtonLink>
    </section>
  )
}
