import { useNavigate } from 'react-router-dom'
import type { PlayerIndex } from '@/data/instruments'
import type { Composition, PlayerInsights, Rival } from '@/data/types'
import { cssVars } from '@/domain/cssVars'
import { mapInfo } from '@/domain/catalog'
import { fmt, MINUS } from '@/domain/format'
import { PATHS } from '@/shell/paths'
import { CorpEmblem, Cube, NewBadge, Plate, Readout, SectionHead, type PlayerLike } from '@/ui/atoms'
import delta from '@/ui/atoms/Delta.module.css'
import { cx } from '@/ui/cx'
import { ByTablePanel, InfoTip, RelPos, TIPS, VsExpected } from '@/ui/fairness'
import { MapGlyph } from '@/ui/icons'
import { catClass, CategoryLegend, CompositionBar, EloChart, FormStrip } from '@/ui/instruments'
import reveal from '@/ui/reveal.module.css'
import { corpRows, dnaRows, mapRows } from './model'
import styles from './Profile.module.css'

interface SummaryProps { p: PlayerInsights; me: PlayerLike; group: Composition; players: PlayerIndex; mesa: number | null }

function EloPanel({ p, me }: { p: PlayerInsights; me: PlayerLike }) {
  return (
    <Plate className={cx(reveal.reveal, styles.pelo)} label="Evolución del ELO">
      <SectionHead title="Evolución del ELO"><span>{p.elo_series.length} partidas</span></SectionHead>
      <EloChart series={[{ player: me, points: p.elo_series }]} highlight={[me.id]} height={240} />
    </Plate>
  )
}

function ScoreDNA({ p, me, group }: { p: PlayerInsights; me: PlayerLike; group: Composition }) {
  return (
    <Plate className={cx(reveal.reveal, styles.dna)} label="ADN de puntaje">
      <SectionHead title="ADN de puntaje"><NewBadge /></SectionHead>
      <p className={cx('muted', styles.dna__lede)}>De dónde salen sus puntos, comparado con el promedio del grupo.</p>
      <div className={styles.dna__bars}><CompositionBar share={p.composition.share} label={me.name} /><CompositionBar share={group.share} label="Grupo" /></div>
      <CategoryLegend />
      <ul className={styles.dna__list}>
        {dnaRows(p.composition, group).map(({ cat, own, diff, tone }) => (
          <li key={cat.key}><span className={catClass(cat.key)} aria-hidden="true" /><span>{cat.long}</span><b>{fmt.dec(own)}</b>
            <span className={cx(styles.dna__diff, delta[`delta--${tone}`])}>{diff >= 0 ? '+' : MINUS}{fmt.dec(Math.abs(diff))}</span></li>
        ))}
      </ul>
    </Plate>
  )
}

function Fairness({ p }: { p: PlayerInsights }) {
  return (
    <Plate className={cx(reveal.reveal, styles.fairness)} label="Equidad">
      <SectionHead title="Equidad"><NewBadge /></SectionHead>
      <div className={styles.fairness__grid}>
        <div><span className="faint">Victorias vs. esperado <InfoTip text={TIPS.expected} /></span><VsExpected e={p.equity} /></div>
        <div><span className="faint">Posición relativa <InfoTip text={TIPS.relPos} /></span><RelPos e={p.equity} /></div>
        <div><span className="faint">Victorias esperadas</span><b>{fmt.dec(p.equity.expected)}</b></div>
      </div>
    </Plate>
  )
}

function RivalCard({ r, kind, text, players }: { r: Rival | null; kind: 'nemesis' | 'victim'; text: string; players: PlayerIndex }) {
  const navigate = useNavigate()
  if (!r) return null
  const who = players.get(r.player_id)
  return (
    <button type="button" className={cx(styles.rival, styles[`rival--${kind}`])} onClick={() => navigate(PATHS.profile(r.player_id))}>
      <span className={styles.rival__kind}>{kind === 'nemesis' ? 'Némesis' : 'Víctima favorita'}</span>
      <span className={styles.rival__who}><Cube color={who?.color} size={22} /><b>{who?.name}</b></span>
      <span className={styles.rival__rec}>{text}</span>
    </button>
  )
}

function Streaks({ p }: { p: PlayerInsights }) {
  return (
    <div className={styles.streaks}>
      <div><span className="faint">Forma reciente</span><FormStrip form={p.form} /></div>
      <Readout label="Mejor racha" value={p.streak.best} sub="victorias seguidas" />
      <Readout label="Racha actual" value={p.streak.current} sub={p.streak.current ? 'en curso' : 'sin racha'} />
      <Readout label="Hitos por partida" value={fmt.dec(p.avg_milestones)} />
      <Readout label="Recompensas ganadas" value={fmt.dec(p.avg_awards)} sub="por partida" />
    </div>
  )
}

function RivalsPanel({ p, me, players }: { p: PlayerInsights; me: PlayerLike; players: PlayerIndex }) {
  return (
    <Plate className={cx(reveal.reveal, styles['rivals-panel'])} label="Rivales">
      <SectionHead title="Rivales"><NewBadge /></SectionHead>
      <div className={styles['rival-pair']}>
        <RivalCard r={p.nemesis} kind="nemesis" players={players} text={p.nemesis ? `Le ganó a ${me.name} en ${p.nemesis.behind} de ${p.nemesis.games} partidas` : ''} />
        <RivalCard r={p.victim} kind="victim" players={players} text={p.victim ? `${me.name} le ganó en ${p.victim.ahead} de ${p.victim.games} partidas` : ''} />
      </div>
      <Streaks p={p} />
    </Plate>
  )
}

function MapsPanel({ p }: { p: PlayerInsights }) {
  return (
    <Plate className={cx(reveal.reveal, styles['maps-panel'])} label="Por mapa">
      <SectionHead title="Por mapa"><NewBadge /></SectionHead>
      <ul className={styles.mapgrid}>
        {mapRows(p.maps).map(({ name, stat: m }) => (
          <li key={name} className={cx(styles.mapgrid__item, !m && styles['is-none'])}>
            <MapGlyph glyph={mapInfo(name).glyph} size={34} /><span className={styles.mapgrid__name}>{name}</span>
            {m ? <><span className={styles.mapgrid__rate}>{fmt.pct(m.wins / m.games)}</span><span className={styles.mapgrid__sub}>{m.wins} de {m.games} ganadas</span>
              <span className={styles.mapgrid__bar} style={cssVars({ w: ((m.wins / m.games) * 100).toFixed(0) })} /></>
              : <span className={styles.mapgrid__sub}>Sin partidas</span>}
          </li>
        ))}
      </ul>
    </Plate>
  )
}

function CorpsPanel({ p }: { p: PlayerInsights }) {
  return (
    <Plate className={cx(reveal.reveal, styles['corps-panel'])} label="Corporaciones">
      <SectionHead title="Corporaciones"><span>{p.corps.length} distintas</span></SectionHead>
      <ul className={styles.corplist}>
        {corpRows(p.corps).map((c) => (
          <li key={c.name} className={styles.corplist__row}><CorpEmblem name={c.name} withName />
            <span className={styles.corplist__bar} style={cssVars({ g: c.g, w: c.w })} role="img" aria-label={`${c.games} partidas, ${c.wins} victorias`}><i /><b /></span>
            <span className={styles.corplist__n}>{c.wins}/{c.games}</span></li>
        ))}
      </ul>
      <p className={cx(styles.corplist__key, 'faint')}><i className={styles['k-g']} />Partidas <i className={styles['k-w']} />Victorias</p>
    </Plate>
  )
}

/** Pestaña «Resumen»: ELO, ADN de puntaje, equidad, por mesa, rivales, mapas y corporaciones. */
export function Summary({ p, me, group, players, mesa }: SummaryProps) {
  return (
    <div className={styles['profile-grid']}>
      <EloPanel p={p} me={me} /><ScoreDNA p={p} me={me} group={group} /><Fairness p={p} />
      <ByTablePanel name={me.name} rows={p.by_table} mesa={mesa} className={styles.bytable} />
      <RivalsPanel p={p} me={me} players={players} /><MapsPanel p={p} /><CorpsPanel p={p} />
    </div>
  )
}
