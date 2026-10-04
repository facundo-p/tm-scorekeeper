import { cssVars } from '@/domain/cssVars'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import { STEPS } from './model'
import styles from './Register.module.css'

/** Pasos del asistente: los hechos se pueden volver a abrir; los que siguen, no. */
export function WizardSteps({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <nav className={styles.wsteps} aria-label="Pasos" style={cssVars({ p: `${((step + 1) / STEPS.length) * 100}%` })}>
      <ol>
        {STEPS.map((label, i) => (
          <li key={label} className={cx(styles.wsteps__item, i < step && styles['is-done'], i === step && styles['is-on'])}>
            <button type="button" disabled={i > step} onClick={() => onJump(i)} aria-current={i === step ? 'step' : undefined}>
              <span className={styles.wsteps__hex}>{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
              <span className={styles.wsteps__label}>{label}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className={styles.wsteps__mobile}>Paso {step + 1} de {STEPS.length}: <b>{STEPS[step]}</b></p>
    </nav>
  )
}
