import Select from '@/components/Select/Select'
import Input from '@/components/Input/Input'
import { Corporation } from '@/constants/enums'
import type { GameFormState, PlayerFormData } from '../GameForm.types'
import styles from '../GameForm.module.css'

const CORP_OPTIONS = Object.values(Corporation)
  .sort()
  .map((v) => ({ value: v, label: v }))

interface Props {
  state: GameFormState
  onChange: (patch: Partial<GameFormState>) => void
}

export default function StepCorpsAndTR({ state, onChange }: Props) {
  const updatePlayer = (playerId: string, patch: Partial<PlayerFormData>) => {
    const updated = state.players.map((p) =>
      p.player_id === playerId ? { ...p, ...patch } : p,
    )
    onChange({ players: updated })
  }

  const usedCorps = state.players.map((p) => p.corporation).filter(Boolean)

  return (
    <div className={styles.stepContent}>
      {state.players.map((player) => {
        const otherCorps = usedCorps.filter(
          (c) => c !== player.corporation && c !== Corporation.NOVEL,
        )
        const corpOptions = CORP_OPTIONS.map((opt) => ({
          ...opt,
          disabled: otherCorps.includes(opt.value as Corporation),
        }))

        return (
          <div
            key={player.player_id}
            className={styles.card}
          >
            <h3 className={styles.cardTitleMd}>
              {player.name}
            </h3>
            <div className={styles.colStack}>
              <Select
                label="Corporación"
                options={corpOptions}
                value={player.corporation}
                onChange={(e) => updatePlayer(player.player_id, { corporation: e.target.value as Corporation })}
                placeholder="Seleccionar corporación..."
                required
              />
              <Input
                label="Terraform Rating (TR)"
                type="number"
                value={player.terraform_rating}
                min={0}
                onChange={(e) =>
                  updatePlayer(player.player_id, { terraform_rating: parseInt(e.target.value) || 0 })
                }
                required
              />
              <Input
                label="Megacréditos finales (MC)"
                type="number"
                value={player.mc_total}
                min={0}
                onChange={(e) =>
                  updatePlayer(player.player_id, { mc_total: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
