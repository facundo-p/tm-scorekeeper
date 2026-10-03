import { html, useReducer, useState, useEffect, useRef, cls, fmt } from '../lib.js';
import { MODEL } from '../data/derive.js';
import { MAPS, MAP_ORDER, EXPANSIONS, CORPS, CATEGORIES, EXPANSION_MILESTONES, EXPANSION_AWARDS, corpLabel } from '../data/catalog.js';
import { useNav } from '../router.js';
import { Icon, MapGlyph } from '../ui/icons.js';
import { Button, Plate, Cube, CorpEmblem, NewBadge, Chip, fmtDate } from '../ui/atoms.js';
import { PlanetSlot } from '../ui/planet-slot.js';

const P = (id) => MODEL.playerById[id];
const STEPS = ['Partida', 'Mesa', 'Hitos y recompensas', 'Puntaje', 'Revisión'];
const INPUT_CATS = ['terraform_rating', 'greenery_points', 'city_points', 'card_points', 'card_resource_points', 'turmoil_points'];
const MAX_PLAYERS = 5;

// Lets the prototype index open the wizard on a given step.
export const registerStart = { step: +(new URLSearchParams(location.search).get('step') ?? 0) || 0 };

// The example comes pre-filled with the 27 September session so every step shows real content.
function exampleState() {
  const g = MODEL.gameById['g-063'];
  const milestones = {};
  g.results.forEach((r) => r.scores.milestones.forEach((m) => { milestones[m] = r.player_id; }));
  const step = registerStart.step;
  registerStart.step = 0;
  return {
    step,
    example: true,
    date: g.date, map: g.map, expansions: [...g.expansions], draft: g.draft, generations: g.generations,
    players: g.player_results.map((r) => ({
      id: r.player_id, corp: r.corporation, mc: r.end_stats.mc_total,
      scores: Object.fromEntries(INPUT_CATS.map((k) => [k, r.scores[k] ?? 0])),
    })),
    milestones,
    awards: g.awards.map((a) => ({ name: a.name, opened_by: a.opened_by, first: [...a.first_place], second: [...a.second_place] })),
  };
}

const blankState = () => ({
  step: 0, example: false, date: '2026-10-03', map: '', expansions: ['Prelude'], draft: true, generations: 10,
  players: [], milestones: {}, awards: [],
});

function reducer(s, a) {
  switch (a.type) {
    case 'set': return { ...s, ...a.patch };
    case 'step': return { ...s, step: a.step };
    case 'reset': return blankState();
    case 'togglePlayer': {
      const has = s.players.some((p) => p.id === a.id);
      if (!has && s.players.length >= MAX_PLAYERS) return s;
      const players = has ? s.players.filter((p) => p.id !== a.id)
        : [...s.players, { id: a.id, corp: '', mc: 0, scores: { terraform_rating: 20, greenery_points: 0, city_points: 0, card_points: 0, card_resource_points: 0, turmoil_points: 0 } }];
      const keep = (id) => players.some((p) => p.id === id);
      return {
        ...s,
        players,
        milestones: Object.fromEntries(Object.entries(s.milestones).filter(([, id]) => keep(id))),
        awards: s.awards.map((w) => ({ ...w, opened_by: keep(w.opened_by) ? w.opened_by : '', first: w.first.filter(keep), second: w.second.filter(keep) })),
      };
    }
    case 'player': return { ...s, players: s.players.map((p) => (p.id === a.id ? { ...p, ...a.patch } : p)) };
    case 'score': return { ...s, players: s.players.map((p) => (p.id === a.id ? { ...p, scores: { ...p.scores, [a.key]: Math.max(0, a.value) } } : p)) };
    case 'milestone': {
      const m = { ...s.milestones };
      if (m[a.name] === a.id || !a.id) delete m[a.name];
      else if (m[a.name] || Object.keys(m).length < 3) m[a.name] = a.id;
      return { ...s, milestones: m };
    }
    case 'award': return { ...s, awards: a.awards };
    default: return s;
  }
}

function derived(s) {
  const turmoil = s.expansions.includes('Turmoil');
  const rows = s.players.map((p) => {
    const milestone_points = Object.values(s.milestones).filter((id) => id === p.id).length * 5;
    const award_points = s.awards.reduce((t, w) => t + (w.first.includes(p.id) ? 5 : w.second.includes(p.id) ? 2 : 0), 0);
    const sc = { ...p.scores, milestone_points, award_points, turmoil_points: turmoil ? p.scores.turmoil_points : 0 };
    const total = CATEGORIES.reduce((t, c) => t + (sc[c.key] ?? 0), 0);
    return { id: p.id, total, mc: p.mc, sc };
  });
  const order = rows.slice().sort((a, b) => b.total - a.total || b.mc - a.mc);
  order.forEach((r, i) => {
    const prev = order[i - 1];
    r.position = prev && prev.total === r.total && prev.mc === r.mc ? prev.position : i + 1;
  });
  return { rows, order, turmoil };
}

function validate(s) {
  const e = [];
  if (s.step === 0) {
    if (!s.map) e.push({ field: 'map', msg: 'Elegí el mapa en el que jugaron.' });
    if (s.date > '2026-10-03') e.push({ field: 'date', msg: 'La fecha no puede ser posterior a hoy.' });
  }
  if (s.step === 1) {
    if (s.players.length < 2) e.push({ field: 'players', msg: 'Elegí entre 2 y 5 jugadores.' });
    s.players.filter((p) => !p.corp).forEach((p) => e.push({ field: `corp-${p.id}`, msg: `Falta la corporación de ${P(p.id).name}.` }));
  }
  if (s.step === 2) {
    s.awards.forEach((w) => {
      if (!w.opened_by) e.push({ field: `aw-${w.name}`, msg: `Indicá quién financió ${w.name}.` });
      if (!w.first.length) e.push({ field: `aw-${w.name}`, msg: `Indicá el 1.º puesto de ${w.name}.` });
    });
  }
  return e;
}

// ---------------------------------------------------------------- Stepper
function Stepper({ step, onJump }) {
  return html`<nav class="wsteps" aria-label="Pasos" style=${`--p:${((step + 1) / STEPS.length) * 100}%`}>
    <ol>
      ${STEPS.map((label, i) => html`<li class=${cls('wsteps__item', i < step && 'is-done', i === step && 'is-on')}>
        <button type="button" disabled=${i > step} onClick=${() => onJump(i)} aria-current=${i === step ? 'step' : null}>
          <span class="wsteps__hex">${i < step ? html`<${Icon} name="check" size=${14} />` : i + 1}</span>
          <span class="wsteps__label">${label}</span>
        </button>
      </li>`)}
    </ol>
    <p class="wsteps__mobile">Paso ${step + 1} de ${STEPS.length}: <b>${STEPS[step]}</b></p>
  </nav>`;
}

function ErrorList({ errors }) {
  const ref = useRef(null);
  useEffect(() => { if (errors.length) ref.current?.focus(); }, [errors]);
  if (!errors.length) return null;
  return html`<div class="werrors" role="alert" tabindex="-1" ref=${ref}>
    <${Icon} name="info" size=${18} />
    <ul>${errors.map((e) => html`<li>${e.msg}</li>`)}</ul>
  </div>`;
}

// ---------------------------------------------------------------- Step 1: game
function StepGame({ s, d, errors }) {
  const toggleExp = (e) => d({ type: 'set', patch: { expansions: s.expansions.includes(e) ? s.expansions.filter((x) => x !== e) : [...s.expansions, e] } });
  const bad = (f) => errors.some((e) => e.field === f);
  return html`<div class="wstep">
    <fieldset class="wfield">
      <legend class="wfield__label">Mapa</legend>
      <div class=${cls('maptiles', bad('map') && 'is-bad')}>
        ${MAP_ORDER.map((name) => html`<label class=${cls('maptile', s.map === name && 'is-on')}>
          <input type="radio" name="map" value=${name} checked=${s.map === name} onChange=${() => d({ type: 'set', patch: { map: name } })} />
          <${MapGlyph} glyph=${MAPS[name].glyph} size=${34} />
          <span class="maptile__name">${name}</span>
          <span class="maptile__blurb">${MAPS[name].blurb}</span>
          ${MAPS[name].since >= '2026-01-01' && html`<span class="maptile__new">Nuevo mapa</span>`}
        </label>`)}
      </div>
    </fieldset>
    <div class="wrow">
      <label class="field"><span class="field__label">Fecha</span>
        <input class=${cls('input', bad('date') && 'is-bad')} type="date" id="game-date" value=${s.date} max="2026-10-03"
          onInput=${(e) => d({ type: 'set', patch: { date: e.target.value } })} /></label>
      <div class="field"><span class="field__label" id="gens-l">Generaciones</span>
        <${Stepper2} value=${s.generations} min=${1} max=${30} labelledby="gens-l" onChange=${(v) => d({ type: 'set', patch: { generations: v } })} /></div>
      <div class="field"><span class="field__label">Draft</span>
        <label class="switch"><input type="checkbox" checked=${s.draft} onChange=${(e) => d({ type: 'set', patch: { draft: e.target.checked } })} />
          <span class="switch__track"></span><span>${s.draft ? 'Con draft' : 'Sin draft'}</span></label></div>
    </div>
    <fieldset class="wfield">
      <legend class="wfield__label">Expansiones</legend>
      <div class="exptoggles">
        ${Object.values(EXPANSIONS).map((e) => html`<label class=${cls('exptoggle', s.expansions.includes(e.id) && 'is-on')}>
          <input type="checkbox" checked=${s.expansions.includes(e.id)} onChange=${() => toggleExp(e.id)} />
          <${Icon} name=${e.glyph} size=${20} /><span>${e.label}</span>
          ${e.id === 'Turmoil' && html`<small>suma la fila de puntos de Turmoil</small>`}
          ${e.id === 'Venus next' && html`<small>agrega Hoverlord y Venuphile</small>`}
        </label>`)}
      </div>
    </fieldset>
  </div>`;
}

export function Stepper2({ value, onChange, min = 0, max = 999, labelledby, label, small }) {
  return html`<span class=${cls('stepper', small && 'stepper--s')} role="group" aria-labelledby=${labelledby ?? null} aria-label=${label ?? null}>
    <button type="button" class="stepper__btn" aria-label="Restar 1" onClick=${() => onChange(Math.max(min, value - 1))}><${Icon} name="minus" size=${16} /></button>
    <input class="stepper__val" type="number" inputmode="numeric" min=${min} max=${max} value=${value}
      onFocus=${(e) => e.target.select()} onInput=${(e) => e.target.value !== '' && onChange(Math.max(min, Math.min(max, parseInt(e.target.value, 10) || 0)))} />
    <button type="button" class="stepper__btn" aria-label="Sumar 1" onClick=${() => onChange(Math.min(max, value + 1))}><${Icon} name="plus" size=${16} /></button>
  </span>`;
}

// ---------------------------------------------------------------- Step 2: table
function StepTable({ s, d, errors }) {
  const corpsOk = CORPS.filter((c) => c.exp === 'base' || s.expansions.includes(c.exp));
  const used = (id) => s.players.filter((p) => p.id !== id).map((p) => p.corp);
  return html`<div class="wstep">
    <fieldset class="wfield">
      <legend class="wfield__label">Quiénes jugaron <span class="faint">${s.players.length} de ${MAX_PLAYERS}</span></legend>
      <div class="whotiles">
        ${MODEL.players.filter((p) => p.active).map((p) => {
          const on = s.players.some((x) => x.id === p.id);
          return html`<button type="button" class=${cls('whotile', on && 'is-on')} aria-pressed=${on}
            disabled=${!on && s.players.length >= MAX_PLAYERS} onClick=${() => d({ type: 'togglePlayer', id: p.id })}>
            <${Cube} color=${p.color} size=${26} /><span>${p.name}</span>${on && html`<span class="whotile__check"><${Icon} name="check" size=${14} /></span>`}
          </button>`;
        })}
      </div>
    </fieldset>
    ${s.players.length > 0 && html`<fieldset class="wfield">
      <legend class="wfield__label">Corporaciones</legend>
      <ul class="corprows">
        ${s.players.map((p) => html`<li class=${cls('corprow', errors.some((e) => e.field === `corp-${p.id}`) && 'is-bad')}>
          <span class="corprow__who"><${Cube} color=${P(p.id).color} size=${20} /><b>${P(p.id).name}</b></span>
          <span class="corprow__emblem">${p.corp ? html`<${CorpEmblem} name=${p.corp} size="m" />` : html`<span class="corp__mark corprow__ph">?</span>`}</span>
          <label class="vh" for=${`corp-${p.id}`}>Corporación de ${P(p.id).name}</label>
          <select class="input corprow__select" id=${`corp-${p.id}`} value=${p.corp} onChange=${(e) => d({ type: 'player', id: p.id, patch: { corp: e.target.value } })}>
            <option value="">Elegir corporación</option>
            ${['base', 'Prelude', 'Venus next', 'Colonies', 'Turmoil'].filter((x) => x === 'base' || s.expansions.includes(x)).map((exp) => html`
              <optgroup label=${exp === 'base' ? 'Juego base' : EXPANSIONS[exp].label}>
                ${corpsOk.filter((c) => c.exp === exp).map((c) => html`<option value=${c.name}
                  disabled=${c.name !== 'Novel Corporation' && used(p.id).includes(c.name)}>${corpLabel(c.name)}</option>`)}
              </optgroup>`)}
          </select>
        </li>`)}
      </ul>
    </fieldset>`}
  </div>`;
}

// ---------------------------------------------------------------- Step 3: board
function CubeChoice({ ids, value, onPick, multi, disabled, label }) {
  const on = (id) => (multi ? value.includes(id) : value === id);
  return html`<span class="cubechoice" role="group" aria-label=${label}>
    ${ids.map((id) => html`<button type="button" class=${cls('cubechoice__btn', on(id) && 'is-on')} aria-pressed=${on(id)}
      disabled=${disabled?.(id)} onClick=${() => onPick(id)} title=${P(id).name}>
      <${Cube} color=${P(id).color} size=${18} /><span class="vh">${P(id).name}</span></button>`)}
  </span>`;
}

function StepBoard({ s, d, errors }) {
  const ids = s.players.map((p) => p.id);
  const milestones = [...(MAPS[s.map]?.milestones ?? []), ...s.expansions.flatMap((e) => EXPANSION_MILESTONES[e] ?? [])];
  const awards = [...(MAPS[s.map]?.awards ?? []), ...s.expansions.flatMap((e) => EXPANSION_AWARDS[e] ?? [])];
  const claimed = Object.keys(s.milestones).length;
  const funded = (n) => s.awards.find((w) => w.name === n);
  const setAward = (name, patch) => d({ type: 'award', awards: s.awards.map((w) => (w.name === name ? { ...w, ...patch } : w)) });
  const toggleFund = (name) => d({ type: 'award', awards: funded(name) ? s.awards.filter((w) => w.name !== name)
    : s.awards.length >= 3 ? s.awards : [...s.awards, { name, opened_by: '', first: [], second: [] }] });
  const flip = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return html`<div class="wstep wboard">
    <section class="wboard__col">
      <h3 class="board-row__title"><${Icon} name="milestone" size=${18} />Hitos <span>${claimed} de 3 reclamados, 5 PV cada uno</span></h3>
      <ul class="wslots">
        ${milestones.map((m) => html`<li class=${cls('wslot', s.milestones[m] && 'is-claimed', !s.milestones[m] && claimed >= 3 && 'is-off')}>
          <span class="wslot__name">${m}</span>
          <${CubeChoice} ids=${ids} value=${s.milestones[m] ?? ''} label=${`Quién reclamó ${m}`}
            disabled=${() => !s.milestones[m] && claimed >= 3} onPick=${(id) => d({ type: 'milestone', name: m, id })} />
        </li>`)}
      </ul>
    </section>
    <section class="wboard__col">
      <h3 class="board-row__title"><${Icon} name="award" size=${18} />Recompensas <span>${s.awards.length} de 3 financiadas</span></h3>
      <ul class="wslots">
        ${awards.map((name) => {
          const w = funded(name);
          const noSecond = ids.length === 2 || (w && w.first.length > 1);
          return html`<li class=${cls('wslot wslot--award', w && 'is-claimed', errors.some((e) => e.field === `aw-${name}`) && 'is-bad')}>
            <span class="wslot__name">${name}</span>
            <label class="switch switch--s"><input type="checkbox" checked=${!!w} disabled=${!w && s.awards.length >= 3} onChange=${() => toggleFund(name)} />
              <span class="switch__track"></span><span>${w ? 'Financiada' : 'Sin financiar'}</span></label>
            ${w && html`<div class="wslot__grid">
              <span>Financió</span><${CubeChoice} ids=${ids} value=${w.opened_by} label=${`Quién financió ${name}`} onPick=${(id) => setAward(name, { opened_by: id })} />
              <span>1.º</span><${CubeChoice} ids=${ids} value=${w.first} multi label=${`Primer puesto en ${name}`}
                disabled=${(id) => w.second.includes(id)} onPick=${(id) => setAward(name, { first: flip(w.first, id), second: flip(w.first, id).length > 1 ? [] : w.second })} />
              ${!noSecond && html`<span>2.º</span><${CubeChoice} ids=${ids} value=${w.second} multi label=${`Segundo puesto en ${name}`}
                disabled=${(id) => w.first.includes(id)} onPick=${(id) => setAward(name, { second: flip(w.second, id) })} />`}
            </div>`}
          </li>`;
        })}
      </ul>
      <p class="faint wboard__note">Con empate en el 1.º puesto no se otorga 2.º. En partidas de 2 jugadores tampoco.</p>
    </section>
  </div>`;
}

// ---------------------------------------------------------------- Step 4: score pad
function ScorePad({ s, d }) {
  const { rows, turmoil } = derived(s);
  const cats = INPUT_CATS.filter((k) => k !== 'turmoil_points' || turmoil);
  const label = (k) => CATEGORIES.find((c) => c.key === k).long;
  const [tab, setTab] = useState(s.players[0]?.id);
  const leader = Math.max(...rows.map((r) => r.total));
  return html`<div class="wstep">
    <div class="pad" role="table" aria-label="Planilla de puntaje">
      <div class="pad__row pad__head" role="row">
        <span role="columnheader">Categoría</span>
        ${s.players.map((p) => html`<span role="columnheader" class="pad__ph"><${Cube} color=${P(p.id).color} size=${16} />${P(p.id).name}</span>`)}
      </div>
      ${cats.map((k) => html`<div class="pad__row" role="row">
        <span role="rowheader" class="pad__cat"><span class=${`catkey catkey--${k}`}></span>${label(k)}</span>
        ${s.players.map((p) => html`<span role="cell"><${Stepper2} small value=${p.scores[k]} label=${`${label(k)} de ${P(p.id).name}`}
          onChange=${(v) => d({ type: 'score', id: p.id, key: k, value: v })} /></span>`)}
      </div>`)}
      ${['milestone_points', 'award_points'].map((k) => html`<div class="pad__row pad__auto" role="row">
        <span role="rowheader" class="pad__cat"><span class=${`catkey catkey--${k}`}></span>${label(k)}<small>automático</small></span>
        ${rows.map((r) => html`<span role="cell" class="pad__fixed">${r.sc[k]}</span>`)}
      </div>`)}
      <div class="pad__row pad__mc" role="row">
        <span role="rowheader" class="pad__cat"><${Icon} name="mc" size=${16} />M€ finales<small>desempate</small></span>
        ${s.players.map((p) => html`<span role="cell"><${Stepper2} small value=${p.mc} label=${`M€ finales de ${P(p.id).name}`}
          onChange=${(v) => d({ type: 'player', id: p.id, patch: { mc: v } })} /></span>`)}
      </div>
      <div class="pad__row pad__total" role="row">
        <span role="rowheader">Total</span>
        ${rows.map((r) => html`<span role="cell" class=${cls('pad__sum', r.total === leader && 'is-lead')}>${r.total}</span>`)}
      </div>
    </div>
    <div class="padm">
      <div class="padm__tabs" role="tablist" aria-label="Jugador">
        ${rows.map((r) => html`<button type="button" role="tab" aria-selected=${tab === r.id} class=${cls('padm__tab', tab === r.id && 'is-on', r.total === leader && 'is-lead')}
          onClick=${() => setTab(r.id)}><${Cube} color=${P(r.id).color} size=${16} /><span>${P(r.id).name}</span><b>${r.total}</b></button>`)}
      </div>
      ${s.players.filter((p) => p.id === tab).map((p) => html`<ul class="padm__list">
        ${cats.map((k) => html`<li><span class="pad__cat"><span class=${`catkey catkey--${k}`}></span>${label(k)}</span>
          <${Stepper2} value=${p.scores[k]} label=${`${label(k)} de ${P(p.id).name}`} onChange=${(v) => d({ type: 'score', id: p.id, key: k, value: v })} /></li>`)}
        <li><span class="pad__cat"><${Icon} name="mc" size=${16} />M€ finales</span>
          <${Stepper2} value=${p.mc} label=${`M€ finales de ${P(p.id).name}`} onChange=${(v) => d({ type: 'player', id: p.id, patch: { mc: v } })} /></li>
        <li class="padm__auto"><span>Hitos y recompensas (automático)</span><b>${rows.find((r) => r.id === p.id).sc.milestone_points + rows.find((r) => r.id === p.id).sc.award_points}</b></li>
      </ul>`)}
    </div>
  </div>`;
}

// ---------------------------------------------------------------- Step 5: review
function StepReview({ s }) {
  const { order } = derived(s);
  const ties = order.filter((r, i) => order.some((o, j) => j !== i && o.total === r.total));
  return html`<div class="wstep wreview">
    <div class="wreview__meta">
      <span class="mapbadge"><${MapGlyph} glyph=${MAPS[s.map].glyph} size=${24} /><b>${s.map}</b></span>
      <${Chip} icon="calendar">${fmtDate(s.date)}</${Chip}><${Chip} icon="generation">${s.generations} generaciones</${Chip}>
      ${s.draft && html`<${Chip} icon="draft">Draft</${Chip}>`}
      ${s.expansions.map((e) => html`<${Chip} icon=${EXPANSIONS[e].glyph}>${EXPANSIONS[e].label}</${Chip}>`)}
    </div>
    <ol class="wreview__list">
      ${order.map((r) => html`<li class=${cls('wreview__row', r.position === 1 && 'is-win')}>
        <span class="wreview__pos">${r.position}</span>
        <${Cube} color=${P(r.id).color} size=${18} /><b>${P(r.id).name}</b>
        <span class="faint">${corpLabel(s.players.find((p) => p.id === r.id).corp)}</span>
        <span class="wreview__total">${r.total}</span><span class="faint">${r.mc} M€</span>
      </li>`)}
    </ol>
    ${ties.length > 0 && html`<p class="wreview__warn"><${Icon} name="info" size=${16} />Hay empate en puntos: decide quien terminó con más M€.</p>`}
    <p class="faint">Al guardar se recalculan el ELO, los récords y los logros, y se abre la ceremonia de cierre.</p>
  </div>`;
}

// ---------------------------------------------------------------- Preview panel
function Preview({ s }) {
  const { rows } = derived(s);
  return html`<aside class="wpreview" aria-label="Vista previa">
    <${PlanetSlot} region=${s.map || null} board=${!!s.map} terra=${0.3} class="wpreview__slot"
      label=${s.map ? `Región de ${s.map}` : 'Marte'} />
    <div class="plate plate--glass wpreview__card" data-sheen>
      <p class="wpreview__map">${s.map ? html`<${MapGlyph} glyph=${MAPS[s.map].glyph} size=${20} />${s.map}` : 'Elegí un mapa'}</p>
      <ul class="wpreview__table">
        ${rows.sort((a, b) => b.total - a.total).map((r) => html`<li>
          <${Cube} color=${P(r.id).color} size=${15} /><span>${P(r.id).name}</span>
          ${s.players.find((p) => p.id === r.id).corp && html`<${CorpEmblem} name=${s.players.find((p) => p.id === r.id).corp} size="s" />`}
          <b>${r.total}</b></li>`)}
      </ul>
      ${!s.players.length && html`<p class="faint">Los jugadores aparecen acá a medida que los elegís.</p>`}
    </div>
  </aside>`;
}

export function Register() {
  const nav = useNav();
  const [s, d] = useReducer(reducer, null, exampleState);
  const [errors, setErrors] = useState([]);
  const [saved, setSaved] = useState(false);
  const top = useRef(null);
  useEffect(() => {
    setSaved(false);
    const t = setTimeout(() => setSaved(true), 700);
    return () => clearTimeout(t);
  }, [s]);
  const go = (step) => { setErrors([]); d({ type: 'step', step }); top.current?.scrollIntoView({ block: 'start' }); };
  const next = () => {
    const e = validate(s);
    setErrors(e);
    if (!e.length) go(s.step + 1);
  };
  const views = [StepGame, StepTable, StepBoard, ScorePad, StepReview];
  const View = views[s.step];
  return html`
    <header class="screen-head reveal" style="--i:0" ref=${top}>
      <div>
        <h1 class="screen-head__title">Registrar partida</h1>
        <p class="screen-head__sub">${s.example ? 'Ejemplo precargado con la partida del 27 de septiembre.' : 'Partida nueva.'}
          <span class=${cls('draftnote', saved && 'is-saved')}><${Icon} name="check" size=${14} />Borrador guardado <${NewBadge} /></span></p>
      </div>
      <div class="screen-head__aside">
        ${s.example && html`<${Button} variant="ghost" size="s" icon="close" onClick=${() => { d({ type: 'reset' }); setErrors([]); }}>Empezar en blanco</${Button}>`}
      </div>
    </header>
    <${Stepper} step=${s.step} onJump=${go} />
    <div class="wizard">
      <${Plate} class="wizard__main" label=${STEPS[s.step]}>
        <h2 class="wizard__title">${STEPS[s.step]}</h2>
        <${ErrorList} errors=${errors} />
        <${View} s=${s} d=${d} errors=${errors} />
        <div class="wizard__nav">
          ${s.step > 0 ? html`<${Button} icon="back" onClick=${() => go(s.step - 1)}>Atrás</${Button}>` : html`<span></span>`}
          ${s.step < STEPS.length - 1
            ? html`<${Button} variant="primary" onClick=${next}>Siguiente: ${STEPS[s.step + 1]}</${Button}>`
            : html`<${Button} variant="primary" size="l" icon="check" onClick=${() => nav.go('ceremony', { id: 'g-063' })}>Guardar partida</${Button}>`}
        </div>
      </${Plate}>
      <${Preview} s=${s} />
    </div>
  `;
}
