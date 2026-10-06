import { useNavigate } from 'react-router-dom'
import type { GroupSummary, Season } from '@/data/types'
import { corpLabel } from '@/domain/catalog'
import { cssVars } from '@/domain/cssVars'
import { PlanetSlot } from '@/fx/planet'
import { PATHS } from '@/shell/paths'
import { Button, CountUp } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { Icon } from '@/ui/icons'
import { OceanSlots, OxygenArc, Thermometer } from '@/ui/instruments'
import plate from '@/ui/atoms/Plate.module.css'
import reveal from '@/ui/reveal.module.css'
import { gamesLeft } from './model'
import styles from './Home.module.css'

/** Datos del archivo alrededor del planeta (en escritorio, en órbita). */
function Orbit({ summary }: { summary: GroupSummary }) {
  const items = [
    { k: 'a', label: 'Partidas archivadas', value: summary.games },
    { k: 'b', label: 'Generaciones jugadas', value: summary.generations },
    { k: 'c', label: 'Puntaje medio del ganador', value: summary.avg_winner },
    { k: 'd', label: 'Corporación más elegida', value: summary.top_corp ? corpLabel(summary.top_corp.name) : '—', sub: summary.top_corp && `${summary.top_corp.games} veces` },
  ]
  return (
    <ul className={styles.orbit} aria-label="Datos del archivo">
      {items.map((it) => (
        <li key={it.k} className={cx(styles.orbit__item, styles[`orbit__item--${it.k}`])}>
          <span className={styles.orbit__value}>{typeof it.value === 'number' ? <CountUp value={it.value} delay={500} /> : it.value}</span>
          <span className={styles.orbit__label}>{it.label}{it.sub && <> <em>{it.sub}</em></>}</span>
        </li>
      ))}
    </ul>
  )
}

function Console({ season }: { season: Season }) {
  return (
    <div className={cx(styles.hero__console, plate.plate, plate['plate--glass'])} data-sheen>
      <Thermometer value={season.temperature} />
      <div className={styles.hero__pair}><OxygenArc value={season.oxygen_pct} /><OceanSlots value={season.ocean_count} /></div>
    </div>
  )
}

function HeroPlanet({ season, summary }: { season: Season; summary: GroupSummary }) {
  return (
    <div className={styles.hero__planet}>
      <PlanetSlot terra={0.18 + season.pct * 0.62} interactive className={styles.hero__slot}
        label={`Marte al ${Math.round(season.pct * 100)} % de terraformación. Arrastrá para girarlo.`} />
      <Orbit summary={summary} />
      <span className={styles.hero__hint} aria-hidden="true"><Icon name="swap" size={14} />Arrastrá para girar</span>
    </div>
  )
}

/** Héroe de la temporada: lectura de los parámetros, acciones y el planeta que se arrastra. */
export function SeasonHero({ season, summary, onRules }: { season: Season; summary: GroupSummary; onRules: () => void }) {
  const navigate = useNavigate()
  return (
    <section className={cx(styles.hero, reveal.reveal)} style={cssVars({ i: 0 })} aria-labelledby="hero-title">
      <div className={styles.hero__text}>
        <h1 className={styles.hero__title} id="hero-title">Marte, temporada {season.number}</h1>
        <p className={styles.hero__lede}>
          <b>{Math.round(season.pct * 100)} % terraformado.</b> Cada partida registrada sube la temperatura, el oxígeno y los océanos
          de este planeta. Al completar los tres termina la temporada, y el título es para el mejor promedio de puntos.
        </p>
        <Console season={season} />
        <div className={styles.hero__actions}>
          <Button variant="primary" size="l" icon="plus" onClick={() => navigate(PATHS.register)}>Registrar partida</Button>
          <Button variant="ghost" icon="info" onClick={onRules}>Cómo avanza la temporada</Button>
        </div>
        <p className={styles.hero__eta}>Faltan unas {gamesLeft(season.temperature)} partidas para completarla.</p>
      </div>
      <HeroPlanet season={season} summary={summary} />
    </section>
  )
}
