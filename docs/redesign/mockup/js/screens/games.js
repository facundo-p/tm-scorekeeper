import { html, useState, useMemo, cls } from '../lib.js';
import { MODEL } from '../data/derive.js';
import { SORTS, DEFAULT_SORT, sortGames, nextSort } from '../data/sort.js';
import { MAPS, MAP_ORDER, MONTHS, MONTHS_SHORT, WEEKDAYS, corpLabel } from '../data/catalog.js';
import { useNav } from '../router.js';
import { Icon, MapGlyph } from '../ui/icons.js';
import { Button, Cube, CorpEmblem, ExpansionTags, Empty, NewBadge } from '../ui/atoms.js';
import { ScoreTrack } from '../ui/instruments.js';
import { Sheet } from '../ui/sheet.js';
import { MesaFilter, MesaNotice, useMesa } from '../ui/mesa.js';

const P = (id) => MODEL.playerById[id];
const EMPTY = { map: '', players: [] };

function applyFilters(games, f, mesa) {
  return games.filter((g) => (!f.map || g.map === f.map)
    && (!mesa || g.results.length === mesa)
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

function Filters({ f, set, mesa, setMesa }) {
  return html`<div class="filters">
    <${MapFilter} value=${f.map} onChange=${(map) => set({ ...f, map })} />
    <${PlayerFilter} value=${f.players} onChange=${(players) => set({ ...f, players })} />
    <${MesaFilter} value=${mesa} onChange=${setMesa} />
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

// Grouped by month the row shows the weekday; in other orders, month and year.
function GameRow({ g, flat }) {
  const nav = useNav();
  const d = new Date(`${g.date}T12:00:00`);
  const sub = flat ? `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : WEEKDAYS[d.getDay()];
  const w = g.results[0];
  const winner = P(w.player_id);
  return html`<li>
    <button type="button" class="mrow" data-sheen onClick=${() => nav.go('game', { id: g.id })}
      aria-label=${`Partida del ${g.date} en ${g.map}, ganó ${winner.name} con ${w.total} puntos`}>
      <span class="mrow__date"><b>${d.getDate()}</b><span>${sub}</span></span>
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

function SortBar({ sort, onChange }) {
  return html`<div class="fgroup games-sort" role="group" aria-label="Ordenar partidas">
    <span class="fgroup__label">Ordenar</span>
    <div class="fchips">
      ${SORTS.map((o) => {
        const on = sort.by === o.id;
        const dir = on ? (sort.dir === 'asc' ? 'ascendente' : 'descendente') : '';
        return html`<button type="button" class=${cls('fchip', on && 'is-on')} aria-pressed=${on}
          aria-label=${on ? `Ordenar por ${o.label}, ${dir}` : `Ordenar por ${o.label}`} onClick=${() => onChange(nextSort(sort, o.id))}>
          ${o.label}${on && html`<span class="games-sort__dir" aria-hidden="true">${sort.dir === 'asc' ? '▲' : '▼'}</span>`}</button>`;
      })}
    </div>
  </div>`;
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

export function Games({ query = {} }) {
  const [f, setF] = useState(EMPTY);
  const [mesa, setMesa] = useMesa(query);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [sheet, setSheet] = useState(false);
  const list = useMemo(() => sortGames(applyFilters(MODEL.games, f, mesa), sort, (id) => P(id).name), [f, sort, mesa]);
  const active = (f.map ? 1 : 0) + f.players.length;
  const clearAll = () => { setF(EMPTY); if (mesa) setMesa(null); };
  const groups = sort.by === 'date' ? groupByMonth(list) : null;
  const first = new Date(`${MODEL.group.first}T12:00:00`);
  return html`
    <header class="screen-head reveal" style="--i:0">
      <div>
        <h1 class="screen-head__title">Partidas</h1>
        <p class="screen-head__sub">${MODEL.group.games} misiones archivadas desde ${MONTHS[first.getMonth()]} de ${first.getFullYear()}.</p>
      </div>
      <div class="screen-head__aside games-head__btns">
        <${Button} icon="filter" onClick=${() => setSheet(true)}>Filtros${active ? ` (${active})` : ''}</${Button}>
      </div>
    </header>
    <div class="games-tools reveal" style="--i:1">
      <${ActivityStrip} />
      <div class="games-filters"><${Filters} f=${f} set=${setF} mesa=${mesa} setMesa=${setMesa} />
        <div class="filters games-sort-row"><${SortBar} sort=${sort} onChange=${setSort} /></div></div>
    </div>
    ${query.aviso === 'eliminada' && html`<p class="notice" role="status"><${Icon} name="check" size=${16} />Partida eliminada. Se recalcularon el ELO, los récords y los logros.</p>`}
    <${MesaNotice} value=${mesa} onClear=${() => setMesa(null)}>${list.length} de ${MODEL.games.length} partidas</${MesaNotice}>
    ${active > 0 && html`<div class="activef">
      <span>${list.length} de ${MODEL.games.length} partidas</span>
      <${Button} variant="ghost" size="s" icon="close" onClick=${clearAll}>Limpiar filtros</${Button}>
    </div>`}
    ${list.length === 0
      ? html`<${Empty} icon="search" title="Ninguna partida coincide"
          action=${html`<${Button} onClick=${clearAll}>Limpiar filtros</${Button}>`}>
          Probá con otro mapa o sacá algún jugador del filtro.</${Empty}>`
      : groups ? groups.map((grp, gi) => {
        const [y, m] = grp.key.split('-');
        return html`<section class="month reveal" style=${`--i:${Math.min(gi + 2, 6)}`} aria-label=${`${MONTHS[+m - 1]} ${y}`}>
          <h2 class="month__title"><span>${MONTHS[+m - 1]}</span> ${y}<small>${grp.games.length} ${grp.games.length === 1 ? 'partida' : 'partidas'}</small></h2>
          <ol class="mlist">${grp.games.map((g) => html`<${GameRow} key=${g.id} g=${g} />`)}</ol>
        </section>`;
      })
      : html`<section class="month reveal" style="--i:2" aria-label=${`Partidas ordenadas por ${SORTS.find((o) => o.id === sort.by).label}`}>
          <ol class="mlist">${list.map((g) => html`<${GameRow} key=${g.id} g=${g} flat />`)}</ol>
        </section>`}
    ${sheet && html`<${Sheet} title="Filtrar partidas" onClose=${() => setSheet(false)}>
      <${Filters} f=${f} set=${setF} mesa=${mesa} setMesa=${setMesa} />
      <div class="filters games-sort-row"><${SortBar} sort=${sort} onChange=${setSort} /></div>
      <div class="sheet-actions">
        <${Button} variant="ghost" onClick=${clearAll}>Limpiar</${Button}>
        <${Button} variant="primary" onClick=${() => setSheet(false)}>Ver ${list.length} partidas</${Button}>
      </div>
    </${Sheet}>`}
  `;
}
