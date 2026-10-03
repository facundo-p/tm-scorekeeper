import { html, cls } from '../lib.js';
import { MODEL } from '../data/derive.js';
import { MAPS } from '../data/catalog.js';
import { useNav } from '../router.js';
import { Icon, MapGlyph } from '../ui/icons.js';
import { Button, Plate, Cube, PlayerTag, NewBadge, useTilt, fmtDate } from '../ui/atoms.js';

const P = (id) => MODEL.playerById[id];
const FIRST = MODEL.group.first;
const LAST = MODEL.group.last;
const t = (d) => (new Date(d) - new Date(FIRST)) / (new Date(LAST) - new Date(FIRST));

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
  return html`<span class="plaque__holders">
    <${PlayerTag} player=${P(h.player_id)} />
    <button type="button" class="plaque__game" onClick=${() => nav.go('game', { id: h.game_id })}>
      <${MapGlyph} glyph=${MAPS[h.map].glyph} size=${16} />${fmtDate(h.date, { short: true })}</button>
  </span>`;
}

function Plaque({ rec, i }) {
  const ref = useTilt(6);
  return html`<li class="plaque-wrap reveal" style=${`--i:${Math.min(i + 2, 8)}`}>
    <div class=${cls('plaque', rec.proposed && 'plaque--proposed')} ref=${ref} data-sheen>
      <span class="plaque__glare" aria-hidden="true"></span>
      <div class="plaque__top">
        <span class="tagdisc tagdisc--blue"><${Icon} name=${rec.icon} size=${15} /></span>
        <span class="plaque__title">${rec.title}</span>
        ${rec.proposed && html`<${NewBadge}>Propuesto</${NewBadge}>`}
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

export function Records() {
  const all = MODEL.records;
  const top = all.find((r) => r.code === 'highest_single_game_score');
  const current = all.filter((r) => !r.proposed && r !== top);
  const proposed = all.filter((r) => r.proposed);
  return html`
    <${TrophyNav} current="records" />
    <header class="screen-head reveal" style="--i:0">
      <div>
        <h1 class="screen-head__title">Salón de récords</h1>
        <p class="screen-head__sub">Las mejores marcas del grupo. Un récord cambia de dueño solo cuando alguien lo supera; el empate no alcanza.</p>
      </div>
    </header>
    <${Monument} rec=${top} />
    <ul class="plaques">${current.map((r, i) => html`<${Plaque} key=${r.code} rec=${r} i=${i} />`)}</ul>
    <section class="proposed reveal" aria-labelledby="prop-title">
      <h2 class="proposed__title" id="prop-title">Récords propuestos</h2>
      <p class="muted proposed__lede">Se calculan con datos que ya se guardan en cada partida. Así se verían con el historial de ejemplo.</p>
      <ul class="plaques">${proposed.map((r, i) => html`<${Plaque} key=${r.code} rec=${r} i=${i} />`)}</ul>
    </section>
  `;
}
