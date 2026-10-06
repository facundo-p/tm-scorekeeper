import type { PlayerIndex } from '@/data/instruments'
import type { CatalogAchievement, PlayerAchievement, PlayerSummary } from '@/data/types'
import { TIER_MATERIALS } from '@/domain/catalog'
import { cssVars } from '@/domain/cssVars'
import { fmtDate } from '@/domain/format'
import { Cube, Medal, PlayerTag, ProgressBar, TierPips } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { FilterChip, FilterGroup } from '@/ui/filters'
import reveal from '@/ui/reveal.module.css'
import { Sheet } from '@/ui/sheet'
import { holdersText, ladderRow, sheetTitle, shownTier, thresholdText, tierTitle } from './model'
import styles from './Achievements.module.css'

export function MaterialStrip() {
  return (
    <ol className={styles.materials} aria-label="Materiales por nivel">
      {TIER_MATERIALS.map((m) => <li key={m.level}><Medal glyph="trophy" tier={m.level} size="s" /><span><b>Nivel {m.level}</b>{m.name}</span></li>)}
    </ol>
  )
}

export function PlayerPicker({ players, value, onChange }: { players: PlayerSummary[]; value: string | null; onChange: (id: string | null) => void }) {
  return (
    <FilterGroup label="Ver progreso de" className={styles['ach-picker']}>
      <FilterChip on={!value} onClick={() => onChange(null)}>Todo el grupo</FilterChip>
      {players.map((p) => <FilterChip key={p.player_id} on={value === p.player_id} onClick={() => onChange(p.player_id)}><Cube color={p.color} size={14} />{p.name}</FilterChip>)}
    </FilterGroup>
  )
}

function TileFoot({ a, mine, players }: { a: CatalogAchievement; mine?: PlayerAchievement; players: PlayerIndex }) {
  if (mine) {
    return mine.progress ? <span className={styles.mtile__prog}><ProgressBar progress={mine.progress} /><small>{mine.progress.current}/{mine.progress.target}</small></span> : null
  }
  return (
    <span className={styles.mtile__holders}>
      {a.holders.slice(0, 5).map((h) => <Cube key={h.player_id} color={players.get(h.player_id)?.color} size={13} />)}
      <small>{holdersText(a.holders.length)}</small>
    </span>
  )
}

interface TileProps { a: CatalogAchievement; mine?: PlayerAchievement; i: number; players: PlayerIndex; onOpen: () => void }

export function Tile({ a, mine, i, players, onOpen }: TileProps) {
  const tier = shownTier(a, mine)
  return (
    <li className={reveal.reveal} style={cssVars({ i: Math.min(i + 3, 10) })}>
      <button type="button" className={cx(styles.mtile, !tier && styles['is-locked'])} onClick={onOpen}>
        <Medal glyph={a.glyph} tier={tier} size="m" single={a.tiers.length === 1} />
        <span className={styles.mtile__title}>{tierTitle(a, tier)}</span>
        <span className={styles.mtile__desc}>{a.description}</span>
        {a.tiers.length > 1 ? <TierPips tier={tier} max={a.tiers.length} /> : <span className={styles.mtile__single}>Logro único</span>}
        <TileFoot a={a} mine={mine} players={players} />
      </button>
    </li>
  )
}

function Ladder({ a, mine, players }: { a: CatalogAchievement; mine?: PlayerAchievement; players: PlayerIndex }) {
  return (
    <ol className={styles.ladder}>
      {a.tiers.map((t) => {
        const { at, reached } = ladderRow(a, t.level, mine)
        const mat = TIER_MATERIALS[t.level - 1]
        return (
          <li key={t.level} className={cx(styles.ladder__row, reached && styles['is-reached'])}>
            <span className={cx(styles.ladder__mat, styles[`mat--${mat.token}`])}>{t.level}</span>
            <div className={styles.ladder__text}><b>{t.title}</b><span className="faint">{thresholdText(a, t.threshold)} ({mat.name})</span></div>
            <div className={styles.ladder__who}>
              {at.length ? at.map((h) => <PlayerTag key={h.player_id} player={players.get(h.player_id)} size="s" sub={fmtDate(h.unlocked_at, { short: true })} />)
                : <span className="faint">{reached ? '' : 'Nadie en este nivel'}</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

interface DetailProps { a: CatalogAchievement; mine?: PlayerAchievement; who: string | null; players: PlayerIndex; onClose: () => void }

/** Hoja del logro: medalla, descripción, cita y la escalera de niveles con quién llegó a cada uno. */
export function Detail({ a, mine, who, players, onClose }: DetailProps) {
  const p = who ? players.get(who) : undefined
  return (
    <Sheet title={sheetTitle(a)} onClose={onClose} wide>
      <div className={styles.adetail}>
        <div className={styles.adetail__hero}>
          <Medal glyph={a.glyph} tier={shownTier(a, mine)} size="l" single={a.tiers.length === 1} />
          <div><p className={styles.adetail__desc}>{a.description}</p><p className="flavor">«{a.flavor}»</p></div>
        </div>
        <Ladder a={a} mine={mine} players={players} />
        {p && mine?.progress && <p className={styles.adetail__prog}><Cube color={p.color} size={14} />
          {p.name} va {mine.progress.current} de {mine.progress.target} para el siguiente nivel.</p>}
      </div>
    </Sheet>
  )
}
