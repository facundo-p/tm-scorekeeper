import { cssVars } from '@/domain/cssVars'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import type { StepInfo } from './model'
import styles from './Register.module.css'

/** Pasos del asistente: los hechos se pueden volver a abrir; los que siguen, no. Con muchos pasos, los
 * rótulos de los demás se recortan y el del actual se ve entero. */
export function WizardSteps({ steps, step, onJump }: { steps: StepInfo[]; step: number; onJump: (i: number) => void }) {
  return (
    <nav className={styles.wsteps} aria-label="Pasos" style={cssVars({ p: `${((step + 1) / steps.length) * 100}%` })}>
      <ol>
        {steps.map(({ id, label, title }, i) => (
          <li key={id} className={cx(styles.wsteps__item, i < step && styles['is-done'], i === step && styles['is-on'])}>
            <button type="button" disabled={i > step} onClick={() => onJump(i)} aria-current={i === step ? 'step' : undefined} title={title}>
              <span className={styles.wsteps__hex}>{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
              <span className={styles.wsteps__label}>{label}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className={styles.wsteps__mobile}>Paso {step + 1} de {steps.length}: <b>{steps[step].title}</b></p>
    </nav>
  )
}
