import { html, useState, useMemo, cls } from '../lib.js';
import { MODEL } from '../data/derive.js';
import { MAPS, MAP_ORDER, MONTHS, WEEKDAYS, corpLabel } from '../data/catalog.js';
import { useNav } from '../router.js';
import { Icon, MapGlyph } from '../ui/icons.js';
import { Button, Cube, CorpEmblem, ExpansionTags, Empty, NewBadge } from '../ui/atoms.js';
import { ScoreTrack } from '../ui/instruments.js';
import { Sheet } from '../ui/sheet.js';

const P = (id) => MODEL.playerById[id];
const EMPTY = { map: '', players: [], size: 0 };

function applyFilters(games, f) {
  return games.filter((g) => (!f.map || g.map === f.map)
    && (!f.size || g.results.length === f.size)
    && f.players.every((id) => g.results.some((r) => r.player_id === id)));
}

function MapFilter({ value, onChange }) {
  const used = MAP_ORDER.filter((m) => MODEL.games.some((g) => g.map === m));
  return html`<div class="fgroup" role="group" aria-label="Mapa">
    <span class="fgroup__label">Mapa</span>
    <div class="fchips">
      <button type="button" class=${cls('fchip', !value && 'is-on')} aria-pressed=${!value} onClick=${() => onChange('')}>Todos</button>
      ${used.map((m) => html`<button type="button" class=${cls('fchip', value === m && 'is-on')} aria-pressed=${value === m}
        onClick=${() => onChange(value === m ? '' : m)}><${MapGlyph} glyph=${MAPS[m].glyph} size=${18} />${m}</button>`)}
    </div>
  </div>`;
}

function PlayerFilter({ value, onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return html`<div class="fgroup" role="group" aria-label="Jugadores en la mesa">
    <span class="fgroup__label">Con</span>
    <div class="fchips">
      ${MODEL.players.filter((p) => p.games).map((p) => html`<button type="button" class=${cls('fchip fchip--cube', value.includes(p.id) && 'is-on')}
        aria-pressed=${value.includes(p.id)} onClick=${() => toggle(p.id)}><${Cube} color=${p.color} size=${14} />${p.name}</button>`)}
    </div>
  </div>`;
}

function SizeFilter({ value, onChange }) {
  return html`<div class="fgroup" role="group" aria-label="Jugadores por partida">
    <span class="fgroup__label">Mesa</span>
    <div class="fchips">
      ${[0, 2, 3, 4, 5].map((n) => html`<button type="button" class=${cls('fchip', value === n && 'is-on')} aria-pressed=${value === n}
        onClick=${() => onChange(n)}>${n ? `${n} jugadores` : 'Cualquiera'}</button>`)}
    </div>
  </div>`;
}

function Filters({ f, set }) {
  return html`<div class="filters">
    <${MapFilter} value=${f.map} onChange=${(map) => set({ ...f, map })} />
    <${PlayerFilter} value=${f.players} onChange=${(players) => set({ ...f, players })} />
    <${SizeFilter} value=${f.size} onChange=${(size) => set({ ...f, size })} />
  </div>`;
}

// Weeks of the last year as a hex strip, brighter where more games were played.
function ActivityStrip() {
  const weeks = useMemo(() => {
    const end = new Date(`${MODEL.group.last}T12:00:00Z`);
    const out = [];
    for (let i = 51; i >= 0; i--) {
      const from = new Date(end.getTime() - (i * 7 + 6) * 86400000).toISOString().slice(0, 10);
      const to = new Date(end.getTime() - i * 7 * 86400000).toISOString().slice(0, 10);
      const n = MODEL.games.filter((g) => g.date >= from && g.date <= to).length;
      out.push({ from, n });
    }
    return out;
  }, []);
  const total = weeks.reduce((s, w) => s + w.n, 0);
  return html`<div class="activity" role="img" aria-label=${`${total} partidas en las últimas 52 semanas`}>
    <span class="activity__label">Últimas 52 semanas <${NewBadge} /></span>
    <div class="activity__strip">
      ${weeks.map((w, i) => html`<i class=${cls('activity__wk', w.n && `is-${Math.min(2, w.n)}`)} style=${`--i:${i}`}
        data-tip=${`Semana del ${w.from}: ${w.n} ${w.n === 1 ? 'partida' : 'partidas'}`}></i>`)}
    </div>
  </div>`;
}

function GameRow({ g }) {
  const nav = useNav();
  const d = new Date(`${g.date}T12:00:00`);
  const w = g.results[0];
  const winner = P(w.player_id);
  return html`<li>
    <button type="button" class="mrow" data-sheen onClick=${() => nav.go('game', { id: g.id })}
      aria-label=${`Partida del ${g.date} en ${g.map}, ganó ${winner.name} con ${w.total} puntos`}>
      <span class="mrow__date"><b>${d.getDate()}</b><span>${WEEKDAYS[d.getDay()]}</span></span>
      <span class="mrow__map">
        <span class="mrow__mapname"><${MapGlyph} glyph=${MAPS[g.map].glyph} size=${22} />${g.map}</span>
        <span class="mrow__meta">
          <span><${Icon} name="generation" size=${14} />${g.generations}</span>
          <span><${Icon} name="players" size=${14} />${g.results.length}</span>
          <${ExpansionTags} expansions=${g.expansions} />
        </span>
      </span>
      <span class="mrow__track"><${ScoreTrack} game=${g} compact /></span>
      <span class="mrow__win">
        <${CorpEmblem} name=${w.corporation} size="s" />
        <span class="mrow__winner"><span><${Cube} color=${winner.color} size=${13} />${winner.name}</span>
          <small>${corpLabel(w.corporation)}</small></span>
        <span class="mrow__pts">${w.total}<small>${g.decidedByMc ? 'M€' : `+${g.margin}`}</small>
          <span class="mrow__who"><${Cube} color=${winner.color} size=${11} />${winner.name}</span></span>
      </span>
      <span class="mrow__go" aria-hidden="true"><${Icon} name="next" size=${18} /></span>
    </button>
  </li>`;
}

function groupByMonth(games) {
  const groups = [];
  for (const g of games) {
    const key = g.date.slice(0, 7);
    let grp = groups[groups.length - 1];
    if (!grp || grp.key !== key) { grp = { key, games: [] }; groups.push(grp); }
    grp.games.push(g);
  }
  return groups;
}

export function Games() {
  const [f, setF] = useState(EMPTY);
  const [sheet, setSheet] = useState(false);
  const list = useMemo(() => applyFilters(MODEL.games, f), [f]);
  const active = (f.map ? 1 : 0) + f.players.length + (f.size ? 1 : 0);
  const groups = groupByMonth(list);
  return html`
    <header class="screen-head reveal" style="--i:0">
      <div>
        <h1 class="screen-head__title">Partidas</h1>
        <p class="screen-head__sub">${MODEL.group.games} misiones archivadas desde marzo de 2025.</p>
      </div>
      <div class="screen-head__aside games-head__btns">
        <${Button} icon="filter" onClick=${() => setSheet(true)}>Filtros${active ? ` (${active})` : ''}</${Button}>
      </div>
    </header>
    <div class="games-tools reveal" style="--i:1">
      <${ActivityStrip} />
      <div class="games-filters"><${Filters} f=${f} set=${setF} /></div>
    </div>
    ${active > 0 && html`<div class="activef">
      <span>${list.length} de ${MODEL.games.length} partidas</span>
      <${Button} variant="ghost" size="s" icon="close" onClick=${() => setF(EMPTY)}>Limpiar filtros</${Button}>
    </div>`}
    ${list.length === 0
      ? html`<${Empty} icon="search" title="Ninguna partida coincide"
          action=${html`<${Button} onClick=${() => setF(EMPTY)}>Limpiar filtros</${Button}>`}>
          Probá con otro mapa o sacá algún jugador del filtro.</${Empty}>`
      : groups.map((grp, gi) => {
        const [y, m] = grp.key.split('-');
        return html`<section class="month reveal" style=${`--i:${Math.min(gi + 2, 6)}`} aria-label=${`${MONTHS[+m - 1]} ${y}`}>
          <h2 class="month__title"><span>${MONTHS[+m - 1]}</span> ${y}<small>${grp.games.length} ${grp.games.length === 1 ? 'partida' : 'partidas'}</small></h2>
          <ol class="mlist">${grp.games.map((g) => html`<${GameRow} key=${g.id} g=${g} />`)}</ol>
        </section>`;
      })}
    ${sheet && html`<${Sheet} title="Filtrar partidas" onClose=${() => setSheet(false)}>
      <${Filters} f=${f} set=${setF} />
      <div class="sheet-actions">
        <${Button} variant="ghost" onClick=${() => setF(EMPTY)}>Limpiar</${Button}>
        <${Button} variant="primary" onClick=${() => setSheet(false)}>Ver ${list.length} partidas</${Button}>
      </div>
    </${Sheet}>`}
  `;
}
