// Parámetros globales con el vocabulario del tablero: termómetro, arco de oxígeno y océanos.
import type { ReactNode } from 'react'
import { cssVars } from '@/domain/cssVars'
import { PARAMS } from '@/domain/catalog'
import { MINUS } from '@/domain/format'
import { cx } from '@/ui/cx'
import { HEX_PATH, Icon } from '@/ui/icons'
import { mixStops, OXY_STOPS, TEMP_STOPS } from './colors'
import styles from './instruments.module.css'

function GaugeHead({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className={styles.gauge__head}>
      <span className={styles.gauge__label}><Icon name={icon} size={16} />{label}</span>
      <span className={styles.gauge__value}>{children}</span>
    </div>
  )
}

export function Thermometer({ value, compact }: { value: number; compact?: boolean }) {
  const { min, max, step } = PARAMS.temperature
  const steps = (max - min) / step
  const filled = Math.round((value - min) / step)
  return (
    <div className={cx(styles.gauge, styles['gauge--temp'], compact && styles['gauge--compact'])}>
      <GaugeHead icon="temperature" label="Temperatura">
        {value > 0 ? '+' : value < 0 ? MINUS : ''}{Math.abs(value)}<small> °C</small>
      </GaugeHead>
      <div className={styles.thermo} role="img" aria-label={`Temperatura ${value} grados, ${filled} de ${steps} pasos`}>
        {Array.from({ length: steps }, (_, i) => (
          <i key={i} className={cx(styles.thermo__seg, i < filled && styles['is-on'], i === filled - 1 && styles['is-tip'])}
            style={cssVars({ c: mixStops(TEMP_STOPS, i / (steps - 1)), i })} />
        ))}
      </div>
      <div className={styles.thermo__scale} aria-hidden="true"><span>−30</span><span>−20</span><span>−10</span><span>0</span><span>+8</span></div>
    </div>
  )
}

const OXY_R = 46

/** Segmento `i` del arco (anillo de radio 46 a 35). */
function oxySegment(i: number, max: number) {
  const a0 = Math.PI * (1 - i / max) - 0.025
  const a1 = Math.PI * (1 - (i + 1) / max) + 0.025
  const p = (a: number, r: number) => `${(60 + Math.cos(a) * r).toFixed(2)} ${(56 - Math.sin(a) * r).toFixed(2)}`
  const inner = OXY_R - 11
  return `M${p(a0, OXY_R)} A${OXY_R} ${OXY_R} 0 0 1 ${p(a1, OXY_R)} L${p(a1, inner)} A${inner} ${inner} 0 0 0 ${p(a0, inner)}Z`
}

export function OxygenArc({ value }: { value: number }) {
  const { max } = PARAMS.oxygen
  return (
    <div className={cx(styles.gauge, styles['gauge--oxy'])}>
      <GaugeHead icon="oxygen" label="Oxígeno">{value}<small> %</small></GaugeHead>
      <svg className={styles.oxy} viewBox="0 0 120 62" role="img" aria-label={`Oxígeno ${value} de ${max} por ciento`}>
        {Array.from({ length: max }, (_, i) => (
          <path key={i} d={oxySegment(i, max)} className={cx(styles.oxy__seg, i < value && styles['is-on'])}
            style={cssVars({ i, c: mixStops(OXY_STOPS, i / (max - 1)) })} />
        ))}
        <text x="13" y="61" className={styles.oxy__tick}>0</text><text x="107" y="61" className={styles.oxy__tick}>14</text>
      </svg>
    </div>
  )
}

const OCEAN_POS = [[0, 0], [1, 0], [2, 0], [0.5, 0.86], [1.5, 0.86], [2.5, 0.86], [0, 1.72], [1, 1.72], [2, 1.72]]
const WAVE = 'M-6.5 -1c1.8-1.4 3.7-1.4 5.5 0s3.7 1.4 5.5 0M-6.5 2.8c1.8-1.4 3.7-1.4 5.5 0s3.7 1.4 5.5 0'

export function OceanSlots({ value }: { value: number }) {
  return (
    <div className={cx(styles.gauge, styles['gauge--ocean'])}>
      <GaugeHead icon="ocean" label="Océanos">{value}<small> / 9</small></GaugeHead>
      <svg className={styles.oceans} viewBox="-14 -14 104 80" role="img" aria-label={`${value} de 9 océanos`}>
        {OCEAN_POS.map(([x, y], i) => (
          <g key={i} transform={`translate(${x * 26} ${y * 26}) scale(1.05)`} className={cx(styles['ocean-slot'], i < value && styles['is-on'])} style={cssVars({ i })}>
            <path d={HEX_PATH} transform="translate(-12 -12)" />
            {i < value && <path className={styles['ocean-slot__wave']} d={WAVE} />}
          </g>
        ))}
      </svg>
    </div>
  )
}
