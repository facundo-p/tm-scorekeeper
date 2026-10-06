import { useNavigate } from 'react-router-dom'
import type { CatalogAchievement, GroupRecord, HistoryRow, PlayerAchievement } from '@/data/types'
import { mapInfo, RECORD_ICON } from '@/domain/catalog'
import { fmtDate } from '@/domain/format'
import { PATHS } from '@/shell/paths'
import { Button, CorpEmblem, Delta, Empty, Medal, Plate, ProgressBar, TagDisc, TierPips } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { MapGlyph } from '@/ui/icons'
import reveal from '@/ui/reveal.module.css'
import { achievementRows } from './model'
import styles from './Profile.module.css'

function HistRow({ h }: { h: HistoryRow }) {
  const navigate = useNavigate()
  return (
    <li><button type="button" className={styles.hist__row} onClick={() => navigate(PATHS.game(h.game_id))}>
      <span className={cx(styles.hist__pos, h.position === 1 && styles['is-win'])}>{h.position}<small>/{h.n}</small></span>
      <span className={styles.hist__map}><MapGlyph glyph={mapInfo(h.map).glyph} size={20} />{h.map}</span>
      <span className={styles.hist__date}>{fmtDate(h.date, { short: true })}</span>
      <span className={styles.hist__corp}><CorpEmblem name={h.corporation} size="s" withName /></span>
      <span className={styles.hist__pts}>{h.total}</span>
      <span className={styles.hist__delta}><Delta value={h.delta} size="s" /></span>
    </button></li>
  )
}

/** Pestaña «Partidas»: el historial, de la más nueva a la más vieja; cada fila abre el informe. */
export function History({ rows }: { rows: HistoryRow[] }) {
  return <Plate className={reveal.reveal} label="Historial"><ol className={styles.hist}>{rows.map((h) => <HistRow key={h.game_id} h={h} />)}</ol></Plate>
}

/** Pestaña «Récords»: los récords del grupo que tiene. */
export function RecordsHeld({ name, held }: { name: string; held: GroupRecord[] }) {
  const navigate = useNavigate()
  if (!held.length) {
    return <Empty icon="trophy" title="Sin récords por ahora" action={<Button onClick={() => navigate(PATHS.records)}>Ver todos los récords</Button>}>{name} todavía no tiene ningún récord del grupo.</Empty>
  }
  return (
    <ul className={styles.heldlist}>
      {held.map((r) => (
        <li key={r.code} className={reveal.reveal}><Plate className={styles.held} cut="s">
          <TagDisc icon={RECORD_ICON[r.code] ?? 'trophy'} tone="blue" />
          <div className={styles.held__text}><b>{r.title}</b><span className="muted">{r.description}</span></div>
          <span className={styles.held__val}>{r.value}<small>{r.unit}</small></span>
        </Plate></li>
      ))}
    </ul>
  )
}

function AchItem({ def, a }: { def: CatalogAchievement; a: PlayerAchievement }) {
  const tier = def.tiers.find((t) => t.level === a.tier)
  const next = def.tiers.find((t) => t.level === a.tier + 1)
  const multi = def.tiers.length > 1
  return (
    <li className={cx(styles.pach__item, !a.tier && styles['is-locked'])}>
      <Medal glyph={def.glyph} tier={a.tier} size="m" single={!multi} />
      <div className={styles.pach__text}>
        <b>{tier?.title ?? def.tiers[0]?.title}</b><span className="muted">{def.description}</span>
        {multi && <TierPips tier={a.tier} max={def.tiers.length} />}
        {a.progress && <span className={styles.pach__prog}>
          <ProgressBar progress={a.progress} />
          <span className="faint">{a.progress.current}/{a.progress.target}{next ? ` para ${next.title}` : ''}</span></span>}
      </div>
    </li>
  )
}

/** Pestaña «Logros»: todos, los desbloqueados primero y por nivel. */
export function AchievementsTab({ catalog, mine }: { catalog: CatalogAchievement[]; mine: PlayerAchievement[] }) {
  return <ul className={styles.pach}>{achievementRows(catalog, mine).map(({ def, a }) => <AchItem key={def.code} def={def} a={a} />)}</ul>
}
