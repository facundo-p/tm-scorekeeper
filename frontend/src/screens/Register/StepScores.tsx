// Pasos de puntos: TR y M€ juntos, y después una categoría por paso, con todos los jugadores.
import { CATEGORIES } from '@/domain/catalog'
import { CorpEmblem, Cube, Stepper } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import instruments from '@/ui/instruments/instruments.module.css'
import type { InputCat, WizardPlayer } from './model'
import type { StepProps } from './types'
import styles from './Register.module.css'

const HINT: Record<InputCat, string> = {
  terraform_rating: 'Terraform Rating final y los M€ que le quedaron a cada uno (los M€ desempatan).',
  card_resource_points: 'Puntos de los recursos sobre las cartas (animales, microbios, ciencia…).',
  card_points: 'Puntos de victoria impresos en las cartas jugadas.',
  greenery_points: 'Un punto por cada vegetación propia.',
  city_points: 'Un punto por cada vegetación adyacente a sus ciudades.',
  turmoil_points: 'Puntos que dio Turmoil en la partida.',
}

const catLabel = (k: string) => CATEGORIES.find((c) => c.key === k)!.long

/** Cubo, nombre y corporación del jugador: así se ve de quién es cada fila. */
function Who({ p, players }: { p: WizardPlayer; players: StepProps['players'] }) {
  const who = players.get(p.id)
  return <span className={styles.wscore__who}><Cube color={who?.color} size={20} /><b>{who?.name}</b>{p.corp && <CorpEmblem name={p.corp} size="s" />}</span>
}

const Hint = ({ k }: { k: InputCat }) => <p className={styles.wscore__hint}><span className={cx(instruments.catkey, instruments[`catkey--${k}`])} />{HINT[k]}</p>

/** Paso «TR y M€»: dos contadores por jugador, lado a lado (en pantallas muy angostas, uno debajo del otro). */
export function StepTrMc({ s, d, players }: StepProps) {
  const name = (id: string) => players.get(id)?.name ?? id
  return (
    <div className={styles.wstep}>
      <Hint k="terraform_rating" />
      <ul className={styles.wscore}>
        {s.players.map((p) => (
          <li key={p.id} className={styles.wscore__card}>
            <Who p={p} players={players} />
            <div className={styles.wscore__pair}>
              <div className={styles.wscore__field}><span aria-hidden="true">Terraform Rating</span>
                <Stepper fluid value={p.scores.terraform_rating} label={`Terraform Rating de ${name(p.id)}`}
                  onChange={(v) => d({ type: 'score', id: p.id, key: 'terraform_rating', value: v })} /></div>
              <div className={styles.wscore__field}><span aria-hidden="true">M€ finales</span>
                <Stepper fluid value={p.mc} label={`M€ finales de ${name(p.id)}`} onChange={(v) => d({ type: 'player', id: p.id, patch: { mc: v } })} /></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Un paso por categoría (recursos, cartas, vegetación, ciudades, Turmoil): una fila por jugador. */
export function StepCategory({ k, s, d, players }: StepProps & { k: InputCat }) {
  return (
    <div className={styles.wstep}>
      <Hint k={k} />
      <ul className={styles.wscore}>
        {s.players.map((p) => (
          <li key={p.id} className={cx(styles.wscore__card, styles['wscore__card--row'])}>
            <Who p={p} players={players} />
            <Stepper value={p.scores[k]} label={`${catLabel(k)} de ${players.get(p.id)?.name ?? p.id}`}
              onChange={(v) => d({ type: 'score', id: p.id, key: k, value: v })} />
          </li>
        ))}
      </ul>
    </div>
  )
}
