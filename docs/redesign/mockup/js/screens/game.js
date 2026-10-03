import { html, useState, cls } from '../lib.js';
import { MODEL, gameRecordContext, nearRecords } from '../data/derive.js';
import { MAPS, EXPANSIONS, ACHIEVEMENTS, EXPANSION_MILESTONES, EXPANSION_AWARDS, CATEGORIES, corpLabel } from '../data/catalog.js';
import { milestoneLabel, awardLabel } from '../data/labels.js';
import { useNav } from '../router.js';
import { Icon, MapGlyph } from '../ui/icons.js';
import { Button, Plate, SectionHead, Cube, PlayerTag, CorpEmblem, Medal, Chip, NewBadge, fmtDate } from '../ui/atoms.js';
import { ScoreBars, CategoryLegend, TRTrack, EloShift } from '../ui/instruments.js';
import { PlanetSlot } from '../ui/planet-slot.js';

const P = (id) => MODEL.playerById[id];

function ReportHero({ g }) {
  const nav = useNav();
  const w = g.results[0];
  const second = g.results.find((r) => r.position > 1);
  return html`<section class="report-hero reveal" style="--i:0" aria-labelledby="report-title">
    <div class="report-hero__planet">
      <${PlanetSlot} region=${g.map} board=${true} terra=${0.42} class="report-hero__slot"
        label=${`Marte, región de ${g.map}, con la grilla del tablero`} />
      <span class="report-hero__coords" aria-hidden="true">${MAPS[g.map].lat}° ${MAPS[g.map].lat >= 0 ? 'N' : 'S'} / ${Math.abs(MAPS[g.map].lon)}° ${MAPS[g.map].lon >= 0 ? 'E' : 'O'}</span>
    </div>
    <div class="report-hero__text">
      <${Button} variant="ghost" size="s" icon="back" onClick=${() => nav.go('games')}>Partidas</${Button}>
      <h1 class="report-hero__title" id="report-title"><${MapGlyph} glyph=${MAPS[g.map].glyph} size=${40} />${g.map}</h1>
      <p class="report-hero__date">${fmtDate(g.date)}</p>
      <div class="report-hero__chips">
        <${Chip} icon="generation">${g.generations} generaciones</${Chip}>
        <${Chip} icon="players">${g.results.length} jugadores</${Chip}>
        ${g.draft && html`<${Chip} icon="draft">Draft</${Chip}>`}
        ${g.expansions.map((e) => html`<${Chip} icon=${EXPANSIONS[e].glyph}>${EXPANSIONS[e].label}</${Chip}>`)}
      </div>
      <div class="winplate plate plate--gold" data-sheen>
        <${CorpEmblem} name=${w.corporation} size="l" />
        <div class="winplate__text">
          <span class="winplate__kicker">Ganó</span>
          <${PlayerTag} player=${P(w.player_id)} size="l" />
          <span class="winplate__sub">${corpLabel(w.corporation)}${second ? `, ${g.decidedByMc ? 'por desempate de M€' : `${g.margin} puntos sobre ${P(second.player_id).name}`}` : ''}</span>
        </div>
        <span class="winplate__score">${w.total}<small>pts</small></span>
      </div>
      <p class="report-hero__flavor flavor">${MAPS[g.map].blurb}</p>
    </div>
  </section>`;
}

function FinalScore({ g }) {
  const [table, setTable] = useState(false);
  return html`<${Plate} class="reveal report-score" label="Puntaje final">
    <${SectionHead} title="Puntaje final">
      <${Button} variant="ghost" size="s" icon=${table ? 'chart' : 'table'} pressed=${table} onClick=${() => setTable(!table)}>
        ${table ? 'Ver barras' : 'Ver tabla'}</${Button}>
    </${SectionHead}>
    <${TRTrack} game=${g} />
    <div class="report-score__legend"><${CategoryLegend} categories=${CATEGORIES.filter((c) => c.key !== 'turmoil_points' || g.expansions.includes('Turmoil'))} /></div>
    <${ScoreBars} game=${g} showTable=${table} />
    <ul class="report-score__corps">
      ${g.results.map((r) => html`<li><${Cube} color=${P(r.player_id).color} size=${12} /><${CorpEmblem} name=${r.corporation} size="s" withName /><span class="faint">${r.mc} M€</span></li>`)}
    </ul>
  </${Plate}>`;
}

function Milestones({ g }) {
  const list = [...MAPS[g.map].milestones, ...g.expansions.flatMap((e) => EXPANSION_MILESTONES[e] ?? [])];
  const owner = {};
  g.results.forEach((r) => r.scores.milestones.forEach((m) => { owner[m] = r.player_id; }));
  return html`<div class="board-row">
    <h3 class="board-row__title"><${Icon} name="milestone" size=${18} />Hitos <span>3 como máximo, 5 PV cada uno</span></h3>
    <ul class="slots">
      ${list.map((m) => html`<li class=${cls('slot', owner[m] && 'is-claimed')}>
        <span class="slot__name">${milestoneLabel(m)}</span>
        ${owner[m]
          ? html`<span class="slot__who"><${Cube} color=${P(owner[m]).color} size=${18} label=${P(owner[m]).name} /><span>${P(owner[m]).name}</span></span>`
          : html`<span class="slot__empty">Sin reclamar</span>`}
      </li>`)}
    </ul>
  </div>`;
}

function Awards({ g }) {
  const list = [...MAPS[g.map].awards, ...g.expansions.flatMap((e) => EXPANSION_AWARDS[e] ?? [])];
  const funded = Object.fromEntries(g.awards.map((a) => [a.name, a]));
  const cubes = (ids) => ids.map((id) => html`<${Cube} color=${P(id).color} size=${16} label=${P(id).name} />`);
  return html`<div class="board-row">
    <h3 class="board-row__title"><${Icon} name="award" size=${18} />Recompensas <span>5 PV al 1.º, 2 PV al 2.º</span></h3>
    <ul class="slots">
      ${list.map((name) => {
        const a = funded[name];
        const stolen = a && a.first_place.length === 1 && a.first_place[0] !== a.opened_by;
        return html`<li class=${cls('slot slot--award', a && 'is-claimed')}>
          <span class="slot__name">${awardLabel(name)}</span>
          ${a ? html`<span class="slot__podium">
              <span class="slot__place"><b>1.º</b>${cubes(a.first_place)}</span>
              ${a.second_place.length > 0 && html`<span class="slot__place"><b>2.º</b>${cubes(a.second_place)}</span>`}
            </span>
            <span class="slot__funder">Financió ${P(a.opened_by).name}${stolen ? html` <em class="slot__stolen">robada</em>` : ''}</span>`
            : html`<span class="slot__empty">No financiada</span>`}
        </li>`;
      })}
    </ul>
  </div>`;
}

function RecordsInGame({ g }) {
  const ctx = gameRecordContext(g);
  const broken = ctx.filter((c) => c.broken);
  const near = nearRecords(ctx);
  return html`<${Plate} class="reveal report-records" label="Récords">
    <${SectionHead} title="Récords" />
    ${broken.length === 0 && html`<p class="muted">Esta partida no rompió récords.</p>`}
    <ul class="recbroken">
      ${broken.map((c) => html`<li class="recbroken__item">
        <span class="tagdisc tagdisc--blue"><${Icon} name=${c.def.icon} size=${15} /></span>
        <div><b>${c.def.title}</b><span class="muted">${c.def.description}</span></div>
        <span class="recbroken__vals"><${Cube} color=${P(c.broken.player_id).color} size=${14} />${c.broken.value}
          <small>antes ${c.broken.previous.value}</small></span>
      </li>`)}
    </ul>
    ${near.length > 0 && html`<h3 class="near__title">Cerca del récord <${NewBadge} /></h3>
      <ul class="near">${near.map((c) => html`<li>
        <${Cube} color=${P(c.best.player_id).color} size=${13} />
        <span>${P(c.best.player_id).name} quedó a <b>${c.gap}</b> de «${c.def.title}» (${c.best.value} contra ${c.before.value})</span>
      </li>`)}</ul>`}
  </${Plate}>`;
}

function AchievementsInGame({ g }) {
  if (!g.achievementsUnlocked.length) return null;
  const best = {};
  g.achievementsUnlocked.forEach((a) => {
    const k = `${a.player_id}-${a.code}`;
    if (!best[k] || best[k].level < a.level) best[k] = a;
  });
  return html`<${Plate} class="reveal report-ach" label="Logros desbloqueados">
    <${SectionHead} title="Logros desbloqueados" />
    <ul class="achgrid">
      ${Object.values(best).map((a) => {
        const def = ACHIEVEMENTS.find((d) => d.code === a.code);
        const tier = def.tiers.find((t) => t.level === a.level);
        return html`<li class="achgrid__item">
          <${Medal} glyph=${def.glyph} tier=${a.level} size="m" single=${def.tiers.length === 1} />
          <div><b>${tier.title}</b><span class="muted">${def.tiers.length > 1 ? `Nivel ${a.level} de ${def.tiers.length}` : 'Logro único'}</span>
            <${PlayerTag} player=${P(a.player_id)} size="s" /></div>
        </li>`;
      })}
    </ul>
  </${Plate}>`;
}

export function GameReport({ params }) {
  const nav = useNav();
  const g = MODEL.gameById[params.id] ?? MODEL.games[0];
  return html`
    <${ReportHero} g=${g} />
    <div class="report-grid">
      <${FinalScore} g=${g} />
      <${Plate} class="reveal report-board" label="Hitos y recompensas">
        <${Milestones} g=${g} />
        <${Awards} g=${g} />
      </${Plate}>
      <${Plate} class="reveal report-elo" label="Cambios de ELO">
        <${SectionHead} title="ELO" ><span>K = 32, por pares</span></${SectionHead}>
        <${EloShift} game=${g} />
      </${Plate}>
      <${RecordsInGame} g=${g} />
      <${AchievementsInGame} g=${g} />
    </div>
    <div class="report-actions">
      <${Button} icon="spark" onClick=${() => nav.go('ceremony', { id: g.id })}>Repetir ceremonia</${Button}>
      <${Button} variant="ghost" icon="edit">Editar partida</${Button}>
    </div>
  `;
}
