import { html, useState, useMemo, cls, fmt } from '../lib.js';
import { MODEL, modelFor } from '../data/derive.js';
import { useNav, hrefOf } from '../router.js';
import { today, monthsBefore } from '../clock.js';
import { Icon } from '../ui/icons.js';
import { Button, Plate, SectionHead, Cube, Delta, NewBadge, Empty } from '../ui/atoms.js';
import { EloChart, Sparkline, FormStrip, H2HMatrix } from '../ui/instruments.js';
import { Sheet } from '../ui/sheet.js';
import { MesaFilter, MesaNotice, useMesa } from '../ui/mesa.js';
import { ByTablePanel, InfoTip, RelPos, TIPS, VsExpected } from '../ui/fairness.js';

const P = (id) => MODEL.playerById[id];
const RANGES = [
  { id: 'all', label: 'Todo', from: null },
  { id: 'season', label: `Temporada ${MODEL.season.number}`, from: MODEL.season.start },
  { id: 'year', label: today().slice(0, 4), from: `${today().slice(0, 4)}-01-01` },
  { id: 'q', label: 'Últimos 3 meses', from: monthsBefore(today(), 3) },
];
const COLORS = ['rojo', 'verde', 'azul', 'amarillo', 'negro', 'naranja', 'violeta', 'rosa', 'blanco'];

// With a table-size filter every figure (ELO included) is replayed on that subset.
function ranked(model) {
  return model.players.filter((p) => p.rank).sort((a, b) => a.rank - b.rank);
}

const eloLabel = (mesa) => (mesa ? `ELO de mesa ${mesa}` : 'ELO');

function EloPanel({ model, mesa }) {
  const all = ranked(model);
  const [sel, setSel] = useState(all.slice(0, 4).map((p) => p.id));
  const [range, setRange] = useState('all');
  const from = RANGES.find((r) => r.id === range).from;
  const toggle = (id) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  return html`<${Plate} class="reveal elo-panel" label="Evolución del ELO">
    <${SectionHead} title=${mesa ? `Evolución del ELO de mesa ${mesa}` : 'Evolución del ELO'} />
    <div class="elo-panel__filters">
      <div class="fchips" role="group" aria-label="Rango de fechas">
        ${RANGES.map((r) => html`<button type="button" class=${cls('fchip', range === r.id && 'is-on')} aria-pressed=${range === r.id}
          onClick=${() => setRange(r.id)}>${r.label}</button>`)}
      </div>
      <div class="fchips" role="group" aria-label="Jugadores resaltados">
        ${all.map((p) => html`<button type="button" class=${cls('fchip fchip--cube', sel.includes(p.id) && 'is-on')} aria-pressed=${sel.includes(p.id)}
          onClick=${() => toggle(p.id)}><${Cube} color=${p.color} size=${14} />${p.name}</button>`)}
      </div>
    </div>
    ${sel.length === 0
      ? html`<${Empty} icon="chart" title="Elegí al menos un jugador" action=${html`<${Button} onClick=${() => setSel(all.slice(0, 4).map((p) => p.id))}>Ver los 4 primeros</${Button}>`}>
          El gráfico resalta a los jugadores elegidos y deja al resto en gris.</${Empty}>`
      : html`<${EloChart} players=${all} highlight=${sel} from=${from} height=${300} />`}
  </${Plate}>`;
}

function Leaderboard({ model, mesa }) {
  const nav = useNav();
  const rows = ranked(model);
  return html`<${Plate} class="reveal board" label="Clasificación">
    <${SectionHead} title="Clasificación"><span>${rows.length} jugadores activos</span></${SectionHead}>
    <div class="lb" role="table" aria-label=${`Clasificación por ${eloLabel(mesa)}`}>
      <div class="lb__head" role="row">
        <span role="columnheader">#</span><span role="columnheader">Jugador</span><span role="columnheader" class="n">${eloLabel(mesa)}</span>
        <span role="columnheader" class="lb__x">Pico</span><span role="columnheader" class="lb__x n">Partidas</span>
        <span role="columnheader" class="lb__x n">Victorias</span>
        <span role="columnheader" class="lb__x n">Vs. esperado<${InfoTip} text=${TIPS.expected} /></span>
        <span role="columnheader" class="lb__x n">Pos. relativa<${InfoTip} text=${TIPS.relPos} /></span>
        <span role="columnheader" class="lb__x">Forma</span><span role="columnheader" class="lb__x">Últimos 12</span>
      </div>
      ${rows.map((p, i) => html`<a href=${hrefOf('profile', { id: p.id }, mesa ? { mesa } : {})} role="row"
        class=${cls('lb__row', p.rank <= 3 && `is-top is-top-${p.rank}`)} style=${`--i:${i}`}>
        <span role="cell" class="lb__rank">${p.rank}</span>
        <span role="cell" class="lb__who"><${Cube} color=${p.color} size=${p.rank <= 3 ? 20 : 16} />
          <span><b>${p.name}</b><small>${p.archetype?.name}</small></span></span>
        <span role="cell" class="lb__elo"><b>${p.elo}</b><${Delta} value=${p.lastDelta} size="s" /></span>
        <span role="cell" class="lb__x lb__peak">${p.peak}</span>
        <span role="cell" class="lb__x n">${p.games}</span>
        <span role="cell" class="lb__x n">${fmt.pct(p.winRate)}</span>
        <span role="cell" class="lb__x n"><${VsExpected} e=${p.equity} /></span>
        <span role="cell" class="lb__x n"><${RelPos} e=${p.equity} /></span>
        <span role="cell" class="lb__x"><${FormStrip} form=${p.form} /></span>
        <span role="cell" class="lb__x"><${Sparkline} values=${p.eloSeries.slice(-12).map((s) => s.elo)} width=${88} height=${24} /></span>
      </a>`)}
    </div>
  </${Plate}>`;
}

// Breakdown by table size for one player, picked from the ranking.
function ByTable({ model, mesa }) {
  const rows = ranked(model);
  const [who, setWho] = useState(rows[0]?.id);
  const p = model.playerById[who] ?? rows[0];
  if (!p) return null;
  return html`<${ByTablePanel} p=${p} mesa=${mesa}>
    <label class="bytable__pick"><span class="vh">Jugador</span>
      <select class="input input--s" value=${p.id} onChange=${(e) => setWho(e.target.value)}>
        ${rows.map((r) => html`<option value=${r.id}>${r.name}</option>`)}</select></label>
  </${ByTablePanel}>`;
}

function Rivalries({ model }) {
  const pairs = useMemo(() => {
    const out = [];
    const ids = ranked(model).map((p) => p.id);
    ids.forEach((a, i) => ids.slice(i + 1).forEach((b) => {
      const c = model.h2h[a]?.[b];
      if (c) out.push({ a, b, ...c });
    }));
    return out.sort((x, y) => y.games - x.games).slice(0, 4);
  }, [model]);
  return html`<ul class="rivals">
    ${pairs.map((r) => html`<li class="rivals__item">
      <span class="rivals__side"><${Cube} color=${P(r.a).color} size=${18} /><b>${P(r.a).name}</b></span>
      <span class="rivals__score"><b>${r.ahead}</b><i>${r.games} partidas juntos</i><b>${r.behind}</b></span>
      <span class="rivals__side rivals__side--b"><b>${P(r.b).name}</b><${Cube} color=${P(r.b).color} size=${18} /></span>
      <span class="rivals__bar" style=${`--a:${((r.ahead / r.games) * 100).toFixed(1)}`} aria-hidden="true"></span>
    </li>`)}
  </ul>`;
}

function HeadToHead({ model }) {
  return html`<${Plate} class="reveal h2h-panel" label="Cara a cara">
    <${SectionHead} title="Cara a cara"><${NewBadge} /></${SectionHead}>
    <p class="muted h2h-panel__lede">Qué porcentaje de las partidas compartidas terminó cada jugador (fila) por delante del otro (columna).</p>
    <div class="h2h-panel__body">
      <${H2HMatrix} players=${ranked(model)} h2h=${model.h2h} />
      <div class="h2h-panel__side">
        <h3 class="h2h-panel__h">Rivalidades con más partidas</h3>
        <${Rivalries} model=${model} />
        <p class="h2h-legend"><span class="h2h-legend__a"></span>Va adelante<span class="h2h-legend__b"></span>Va atrás</p>
      </div>
    </div>
  </${Plate}>`;
}

function Roster({ onAdd }) {
  const [edit, setEdit] = useState(null);
  const inactive = MODEL.players.filter((p) => !p.active);
  return html`<${Plate} class="reveal roster" label="Jugadores">
    <${SectionHead} title="Jugadores">
      <${Button} size="s" icon="plus" onClick=${onAdd}>Agregar jugador</${Button}>
    </${SectionHead}>
    <ul class="roster__list">
      ${MODEL.players.map((p) => html`<li class=${cls('roster__item', !p.active && 'is-off')}>
        <${Cube} color=${p.color} size=${18} />
        <span class="roster__name">${p.name}</span>
        <span class="roster__since">desde ${p.since.slice(0, 7)}</span>
        ${!p.active && html`<span class="chip">Inactivo</span>`}
        <${Button} variant="ghost" size="s" icon="edit" label=${`Editar a ${p.name}`} onClick=${() => setEdit(p)} />
      </li>`)}
    </ul>
    <p class="faint roster__note">${inactive.length} inactivo: no aparece en el ranking ni al registrar partidas, pero conserva su historial.</p>
    ${edit && html`<${PlayerSheet} player=${edit} onClose=${() => setEdit(null)} />`}
  </${Plate}>`;
}

export function PlayerSheet({ player, onClose }) {
  const [name, setName] = useState(player?.name ?? '');
  const [color, setColor] = useState(player?.color ?? 'rojo');
  const taken = new Set(MODEL.players.filter((p) => p.active && p.id !== player?.id).map((p) => p.color));
  return html`<${Sheet} title=${player ? `Editar a ${player.name}` : 'Nuevo jugador'} onClose=${onClose}>
    <form class="pform" onSubmit=${(e) => { e.preventDefault(); onClose(); }}>
      <label class="field"><span class="field__label">Nombre</span>
        <input class="input" id="player-name" value=${name} onInput=${(e) => setName(e.target.value)} autocomplete="off" required /></label>
      <fieldset class="field">
        <legend class="field__label">Color de cubo <${NewBadge} /></legend>
        <div class="cubepick">
          ${COLORS.map((c) => html`<label class=${cls('cubepick__opt', color === c && 'is-on', taken.has(c) && 'is-taken')}>
            <input type="radio" name="cube" value=${c} checked=${color === c} onChange=${() => setColor(c)} />
            <${Cube} color=${c} size=${28} /><span>${c}${taken.has(c) ? ' (en uso)' : ''}</span></label>`)}
        </div>
      </fieldset>
      ${!player && html`<p class="faint">Empieza con 1000 de ELO. Aparece en el ranking después de su primera partida.</p>`}
      <div class="sheet-actions">
        ${player && html`<${Button} variant="danger" onClick=${onClose}>${player.active ? 'Desactivar' : 'Reactivar'}</${Button}>`}
        <${Button} variant="ghost" onClick=${onClose}>Cancelar</${Button}>
        <${Button} variant="primary" type="submit">${player ? 'Guardar cambios' : 'Agregar jugador'}</${Button}>
      </div>
    </form>
  </${Sheet}>`;
}

export function Ranking({ query = {} }) {
  const [adding, setAdding] = useState(false);
  const [mesa, setMesa] = useMesa(query);
  const model = modelFor({ playerCount: mesa });
  return html`
    <header class="screen-head reveal" style="--i:0">
      <div>
        <h1 class="screen-head__title">Ranking</h1>
        <p class="screen-head__sub">ELO por pares con K = 32: cada partida enfrenta a todos contra todos. Todos arrancan en 1000.</p>
      </div>
      <div class="screen-head__aside"><${MesaFilter} value=${mesa} onChange=${setMesa} /></div>
    </header>
    <${MesaNotice} value=${mesa} onClear=${() => setMesa(null)}>el ELO se recalcula desde 1000 solo con esas partidas</${MesaNotice}>
    <div class="ranking-grid">
      <${Leaderboard} model=${model} mesa=${mesa} />
      <${EloPanel} model=${model} mesa=${mesa} key=${mesa ?? 'all'} />
      <${ByTable} model=${model} mesa=${mesa} />
      <${HeadToHead} model=${model} />
      <${Roster} onAdd=${() => setAdding(true)} />
    </div>
    ${adding && html`<${PlayerSheet} onClose=${() => setAdding(false)} />`}
  `;
}
