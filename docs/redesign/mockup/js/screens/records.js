import { html, cls } from '../lib.js';
import { MODEL, modelFor } from '../data/derive.js';
import { MAPS, MAP_ORDER, EXPANSIONS } from '../data/catalog.js';
import { useNav } from '../router.js';
import { Icon, MapGlyph } from '../ui/icons.js';
import { Button, Plate, Cube, PlayerTag, NewBadge, Empty, useTilt, fmtDate } from '../ui/atoms.js';
import { MesaFilter, MesaNotice, useMesa } from '../ui/mesa.js';

const P = (id) => MODEL.playerById[id];
// Position of a date on the whole archive's timeline (same scale for every filter).
const t = (d) => (new Date(d) - new Date(MODEL.group.first)) / (new Date(MODEL.group.last) - new Date(MODEL.group.first));

export function TrophyNav({ current }) {
  const nav = useNav();
  return html`<div class="trophynav reveal" style="--i:0" role="tablist" aria-label="Trofeos">
    ${[['records', 'Récords', 'trophyNav'], ['achievements', 'Logros', 'crown']].map(([id, label, icon]) => html`
      <button type="button" role="tab" aria-selected=${current === id} class=${cls('trophynav__tab', current === id && 'is-on')}
        onClick=${() => nav.go(id)}><${Icon} name=${icon} size=${18} />${label}</button>`)}
  </div>`;
}

// Step chart of how a record grew over time, with the holder's cube at each step.
function RecordHistory({ rec, height = 64 }) {
  const h = rec.history;
  if (!h || h.length < 2) return null;
  const W = 300;
  const vals = h.map((e) => e.value);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const Y = (v) => 8 + (1 - (v - lo) / (hi - lo || 1)) * (height - 18);
  const X = (d) => 6 + t(d) * (W - 12);
  let d = '';
  h.forEach((e, i) => {
    const x = X(e.date);
    const y = Y(e.value);
    d += i === 0 ? `M${x} ${y}` : `H${x}V${y}`;
  });
  d += `H${W - 6}`;
  return html`<div class="rhist">
    <svg viewBox=${`0 0 ${W} ${height}`} preserveAspectRatio="none" class="rhist__svg" role="img"
      aria-label=${`Historia: ${h.map((e) => `${e.value} (${P(e.player_id).name})`).join(', ')}`}>
      <path d=${d} class="rhist__line" vector-effect="non-scaling-stroke" />
    </svg>
    ${h.map((e) => html`<span class="rhist__pt" style=${`--x:${(X(e.date) / W) * 100};--y:${(Y(e.value) / height) * 100}`}
      data-tip=${`${e.value}: ${P(e.player_id).name}, ${fmtDate(e.date, { short: true })}`}><${Cube} color=${P(e.player_id).color} size=${11} /></span>`)}
  </div>`;
}

function Holders({ rec }) {
  const nav = useNav();
  const h = rec.holders[0];
  if (!h) return html`<span class="faint">Sin datos todavía</span>`;
  if (rec.scope === 'career') {
    return html`<span class="plaque__holders">${rec.holders.map((x) => html`<${PlayerTag} player=${P(x.player_id)} />`)}</span>`;
  }
  // Co-holders (D-05): each one with the game where they reached the value.
  return html`<span class="plaque__holders">
    ${rec.holders.map((x) => html`<span class="plaque__holder"><${PlayerTag} player=${P(x.player_id)} />
      <button type="button" class="plaque__game" onClick=${() => nav.go('game', { id: x.game_id })}>
        <${MapGlyph} glyph=${MAPS[x.map].glyph} size=${16} />${fmtDate(x.date, { short: true })}</button></span>`)}
  </span>`;
}

function Plaque({ rec, i }) {
  const ref = useTilt(6);
  return html`<li class="plaque-wrap reveal" style=${`--i:${Math.min(i + 2, 8)}`}>
    <div class="plaque" ref=${ref} data-sheen>
      <span class="plaque__glare" aria-hidden="true"></span>
      <div class="plaque__top">
        <span class="tagdisc tagdisc--blue"><${Icon} name=${rec.icon} size=${15} /></span>
        <span class="plaque__title">${rec.title}</span>
      </div>
      <p class="plaque__desc">${rec.description}</p>
      <div class="plaque__value">${rec.value ?? '—'}<small>${rec.code === 'closest_win' && rec.value === 0 ? 'pts, definida por M€' : rec.unit}</small></div>
      <${Holders} rec=${rec} />
      <${RecordHistory} rec=${rec} />
    </div>
  </li>`;
}

function Monument({ rec }) {
  const nav = useNav();
  const h = rec.holders[0];
  const p = P(h.player_id);
  const ref = useTilt(4);
  return html`<section class="monument reveal" style="--i:1" aria-labelledby="mon-title">
    <div class="monument__plate" ref=${ref} data-sheen>
      <span class="plaque__glare" aria-hidden="true"></span>
      <div class="monument__head">
        <span class="tagdisc tagdisc--blue"><${Icon} name=${rec.icon} size=${16} /></span>
        <h2 id="mon-title" class="monument__title">${rec.title}</h2>
      </div>
      <p class="monument__desc">${rec.description}</p>
      <div class="monument__body">
        <div class="monument__value">${rec.value}<small>puntos</small></div>
        <div class="monument__holder">
          <${PlayerTag} player=${p} size="l" />
          <span class="muted">${fmtDate(h.date)} en ${h.map}</span>
          <${Button} size="s" onClick=${() => nav.go('game', { id: h.game_id })}>Ver la partida</${Button}>
        </div>
      </div>
      <h3 class="monument__h">Cómo llegó hasta acá <${NewBadge} /></h3>
      <${RecordHistory} rec=${rec} height=${110} />
      <ol class="monument__steps">
        ${rec.history.map((e) => html`<li><${Cube} color=${P(e.player_id).color} size=${12} /><b>${e.value}</b><span>${P(e.player_id).name}</span><small>${fmtDate(e.date, { short: true })}</small></li>`)}
      </ol>
    </div>
  </section>`;
}

function Filter({ label, value, options, onChange }) {
  return html`<div class="fgroup" role="group" aria-label=${label}>
    <span class="fgroup__label">${label}</span>
    <div class="fchips">
      <button type="button" class=${cls('fchip', !value && 'is-on')} aria-pressed=${!value} onClick=${() => onChange('')}>Todos</button>
      ${options.map((o) => html`<button type="button" class=${cls('fchip', value === o.id && 'is-on')} aria-pressed=${value === o.id}
        onClick=${() => onChange(value === o.id ? '' : o.id)}>${o.icon}${o.label}</button>`)}
    </div>
  </div>`;
}

const MAP_OPTIONS = MAP_ORDER.map((m) => ({ id: m, label: m, icon: html`<${MapGlyph} glyph=${MAPS[m].glyph} size=${18} />` }));
const EXP_OPTIONS = Object.values(EXPANSIONS).map((e) => ({ id: e.id, label: e.label, icon: html`<${Icon} name=${e.glyph} size=${15} />` }));

// Records over a subset of games (#37): by map and by expansion, from the URL.
function RecordFilters({ query, mesa, setMesa }) {
  const nav = useNav();
  const set = (patch) => nav.go('records', {}, { ...query, ...patch });
  return html`<div class="filters records-filters reveal" style="--i:1">
    <${MesaFilter} value=${mesa} onChange=${setMesa} />
    <${Filter} label="Mapa" value=${query.mapa ?? ''} options=${MAP_OPTIONS} onChange=${(mapa) => set({ mapa })} />
    <${Filter} label="Expansión" value=${query.exp ?? ''} options=${EXP_OPTIONS} onChange=${(exp) => set({ exp })} />
  </div>`;
}

export function Records({ query = {} }) {
  const [mesa, setMesa] = useMesa(query);
  const model = modelFor({ playerCount: mesa, map: query.mapa || null, expansion: query.exp || null });
  const all = model.records;
  const top = all.find((r) => r.code === 'highest_single_game_score');
  const rest = all.filter((r) => r !== top);
  const filtered = !!(query.mapa || query.exp) && !mesa;
  return html`
    <${TrophyNav} current="records" />
    <header class="screen-head reveal" style="--i:0">
      <div>
        <h1 class="screen-head__title">Salón de récords</h1>
        <p class="screen-head__sub">Las mejores marcas del grupo. Un récord cambia de dueño solo cuando alguien lo supera; quien lo iguala lo comparte.</p>
      </div>
    </header>
    <${RecordFilters} query=${query} mesa=${mesa} setMesa=${setMesa} />
    <${MesaNotice} value=${mesa} onClear=${() => setMesa(null)}>${model.group.games} ${model.group.games === 1 ? 'partida' : 'partidas'}</${MesaNotice}>
    ${filtered && html`<p class="activef"><span>${model.group.games} ${model.group.games === 1 ? 'partida' : 'partidas'} con este filtro</span></p>`}
    ${model.group.games === 0
      ? html`<${Empty} icon="trophy" title="Sin partidas con este filtro">Probá con otro mapa o expansión.</${Empty}>`
      : html`${top.value != null && html`<${Monument} rec=${top} />`}
        <ul class="plaques">${rest.map((r, i) => html`<${Plaque} key=${r.code} rec=${r} i=${i} />`)}</ul>`}
  `;
}
