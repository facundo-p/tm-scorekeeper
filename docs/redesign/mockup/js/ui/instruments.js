// Data instruments drawn in the board's own vocabulary: the temperature track,
// the oxygen arc, ocean tiles, the TR track with player cubes.
import { html, cls, useState, useRef, useEffect, useLayoutEffect, useMemo, fmt } from '../lib.js';
import { Icon, HEX_PATH } from './icons.js';
import { Cube } from './atoms.js';
import { CATEGORIES, PARAMS } from '../data/catalog.js';
import { MODEL } from '../data/derive.js';

const lerp = (a, b, t) => a + (b - a) * t;
const TEMP_STOPS = ['#23ade3', '#2f86c8', '#6a5cb0', '#93418a', '#b8396c', '#de3446'];
const OXY_STOPS = ['#6a4560', '#7e7aa6', '#92cae7'];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Interpolate along a list of colour stops (the board's printed gradients).
export function mixStops(stops, t) {
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const a = hexToRgb(stops[i]);
  const b = hexToRgb(stops[i + 1]);
  const f = x - i;
  return `rgb(${a.map((v, k) => Math.round(lerp(v, b[k], f))).join(' ')})`;
}

// --- Global parameters -------------------------------------------------------
export function Thermometer({ value, compact }) {
  const { min, max, step } = PARAMS.temperature;
  const steps = (max - min) / step;
  const filled = Math.round((value - min) / step);
  return html`<div class=${cls('gauge gauge--temp', compact && 'gauge--compact')}>
    <div class="gauge__head">
      <span class="gauge__label"><${Icon} name="temperature" size=${16} />Temperatura</span>
      <span class="gauge__value">${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}<small> °C</small></span>
    </div>
    <div class="thermo" role="img" aria-label=${`Temperatura ${value} grados, ${filled} de ${steps} pasos`}>
      ${Array.from({ length: steps }, (_, i) => html`<i class=${cls('thermo__seg', i < filled && 'is-on', i === filled - 1 && 'is-tip')}
        style=${`--c:${mixStops(TEMP_STOPS, i / (steps - 1))};--i:${i}`}></i>`)}
    </div>
    <div class="thermo__scale" aria-hidden="true"><span>−30</span><span>−20</span><span>−10</span><span>0</span><span>+8</span></div>
  </div>`;
}

export function OxygenArc({ value }) {
  const { max } = PARAMS.oxygen;
  const R = 46;
  const segs = Array.from({ length: max }, (_, i) => {
    const a0 = Math.PI * (1 - i / max) - 0.025;
    const a1 = Math.PI * (1 - (i + 1) / max) + 0.025;
    const p = (a, r) => `${(60 + Math.cos(a) * r).toFixed(2)} ${(56 - Math.sin(a) * r).toFixed(2)}`;
    return `M${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} L${p(a1, R - 11)} A${R - 11} ${R - 11} 0 0 0 ${p(a0, R - 11)}Z`;
  });
  return html`<div class="gauge gauge--oxy">
    <div class="gauge__head">
      <span class="gauge__label"><${Icon} name="oxygen" size=${16} />Oxígeno</span>
      <span class="gauge__value">${value}<small> %</small></span>
    </div>
    <svg class="oxy" viewBox="0 0 120 62" role="img" aria-label=${`Oxígeno ${value} de ${max} por ciento`}>
      ${segs.map((d, i) => html`<path d=${d} class=${cls('oxy__seg', i < value && 'is-on')} style=${`--i:${i};--c:${mixStops(OXY_STOPS, i / (max - 1))}`} />`)}
      <text x="13" y="61" class="oxy__tick">0</text><text x="107" y="61" class="oxy__tick">14</text>
    </svg>
  </div>`;
}

export function OceanSlots({ value }) {
  const pos = [[0, 0], [1, 0], [2, 0], [0.5, 0.86], [1.5, 0.86], [2.5, 0.86], [0, 1.72], [1, 1.72], [2, 1.72]];
  return html`<div class="gauge gauge--ocean">
    <div class="gauge__head">
      <span class="gauge__label"><${Icon} name="ocean" size=${16} />Océanos</span>
      <span class="gauge__value">${value}<small> / 9</small></span>
    </div>
    <svg class="oceans" viewBox="-14 -14 104 80" role="img" aria-label=${`${value} de 9 océanos`}>
      ${pos.map(([x, y], i) => html`<g transform=${`translate(${x * 26} ${y * 26}) scale(1.05)`} class=${cls('ocean-slot', i < value && 'is-on')} style=${`--i:${i}`}>
        <path d=${HEX_PATH} transform="translate(-12 -12)" />
        ${i < value && html`<path class="ocean-slot__wave" d="M-6.5 -1c1.8-1.4 3.7-1.4 5.5 0s3.7 1.4 5.5 0M-6.5 2.8c1.8-1.4 3.7-1.4 5.5 0s3.7 1.4 5.5 0" />`}
      </g>`)}
    </svg>
  </div>`;
}

// --- Score track: cubes on a shared points scale --------------------------------
export function ScoreTrack({ game, min = 40, max = 140, compact }) {
  const cubes = useMemo(() => {
    const placed = [];
    for (const r of game.results.slice().sort((a, b) => a.total - b.total)) {
      const x = ((Math.min(max, Math.max(min, r.total)) - min) / (max - min)) * 100;
      const lane = placed.filter((p) => Math.abs(p.x - x) < 3.2).length;
      placed.push({ r, x, lane });
    }
    return placed;
  }, [game]);
  const label = game.results.map((r) => `${MODEL.playerById[r.player_id].name} ${r.total}`).join(', ');
  return html`<div class=${cls('strack', compact && 'strack--compact')} role="img" aria-label=${`Puntajes: ${label}`}>
    <div class="strack__rail" aria-hidden="true">
      ${[50, 75, 100, 125].map((t) => html`<i class="strack__tick" style=${`--x:${((t - min) / (max - min)) * 100}`}><span>${t}</span></i>`)}
    </div>
    ${cubes.map(({ r, x, lane }) => {
      const p = MODEL.playerById[r.player_id];
      return html`<span class=${cls('strack__cube', r.position === 1 && 'is-win')} style=${`--x:${x.toFixed(2)};--lane:${lane}`}
        data-tip=${`${p.name}: ${r.total} pts`} aria-hidden="true">
        <${Cube} color=${p.color} size=${r.position === 1 ? 18 : 14} />
      </span>`;
    })}
  </div>`;
}

// --- Stacked category bars ---------------------------------------------------------
export function CategoryLegend({ categories = CATEGORIES }) {
  return html`<ul class="catlegend" aria-label="Categorías de puntaje">
    ${categories.map((c) => html`<li><span class=${`catkey catkey--${c.key}`} aria-hidden="true"></span>${c.label}</li>`)}
  </ul>`;
}

export function ScoreBars({ game, maxTotal, showTable }) {
  const cats = CATEGORIES.filter((c) => c.key !== 'turmoil_points' || game.expansions.includes('Turmoil'));
  const top = maxTotal ?? Math.max(...game.results.map((r) => r.total));
  if (showTable) return html`<${ScoreTable} game=${game} cats=${cats} />`;
  return html`<div class="sbars">
    ${game.results.map((r, row) => {
      const p = MODEL.playerById[r.player_id];
      return html`<div class=${cls('sbars__row', r.position === 1 && 'is-win')} style=${`--row:${row}`}>
        <span class="sbars__pos" aria-label=${`Posición ${r.position}`}>${r.position}</span>
        <span class="sbars__who"><${Cube} color=${p.color} size=${15} /><span>${p.name}</span></span>
        <div class="sbars__track" style=${`--w:${((r.total / top) * 100).toFixed(2)}`}>
          ${cats.map((c) => {
            const v = r.scores[c.key] ?? 0;
            if (!v) return null;
            return html`<span class=${`sbars__seg catkey--${c.key}`} style=${`--v:${v}`} data-tip=${`${c.long}: ${v}`} tabindex="0"
              aria-label=${`${c.long} ${v}`}></span>`;
          })}
        </div>
        <span class="sbars__total">${r.total}</span>
      </div>`;
    })}
  </div>`;
}

function ScoreTable({ game, cats }) {
  return html`<div class="dtable-wrap"><table class="dtable">
    <thead><tr><th>Jugador</th>${cats.map((c) => html`<th class="n">${c.label}</th>`)}<th class="n">Total</th><th class="n">M€</th></tr></thead>
    <tbody>${game.results.map((r) => html`<tr>
      <td>${r.position}. ${MODEL.playerById[r.player_id].name}</td>
      ${cats.map((c) => html`<td class="n">${r.scores[c.key] ?? 0}</td>`)}
      <td class="n"><b>${r.total}</b></td><td class="n">${r.mc}</td></tr>`)}</tbody>
  </table></div>`;
}

// --- Composition (score DNA) -------------------------------------------------------
export function CompositionBar({ share, label }) {
  return html`<div class="compbar">
    <span class="compbar__label">${label}</span>
    <div class="compbar__track">
      ${CATEGORIES.map((c) => {
        const v = share[c.key] ?? 0;
        if (v < 0.005) return null;
        return html`<span class=${`compbar__seg catkey--${c.key}`} style=${`--v:${(v * 100).toFixed(2)}`}
          data-tip=${`${c.long}: ${fmt.pct(v)}`} tabindex="0" aria-label=${`${c.long} ${fmt.pct(v)}`}></span>`;
      })}
    </div>
  </div>`;
}

// --- Sparkline and form ---------------------------------------------------------------
export function Sparkline({ values, width = 96, height = 28, color }) {
  if (!values || values.length < 2) return html`<span class="spark spark--empty">—</span>`;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [2 + (i / (values.length - 1)) * (width - 6), 3 + (1 - (v - lo) / span) * (height - 6)]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  const [ex, ey] = pts[pts.length - 1];
  return html`<svg class="spark" width=${width} height=${height} viewBox=${`0 0 ${width} ${height}`} aria-hidden="true">
    <path d=${`${d}L${ex} ${height}L2 ${height}Z`} class="spark__area" />
    <path d=${d} class="spark__line" />
    <circle cx=${ex} cy=${ey} r="3" class=${cls('spark__end', color && `spark__end--${color}`)} />
  </svg>`;
}

export function FormStrip({ form }) {
  return html`<ol class="form" aria-label="Últimas partidas, de la más vieja a la más reciente">
    ${form.map((f) => html`<li class=${cls('form__cell', f.position === 1 && 'is-win', f.position === f.n && 'is-last')}
      data-tip=${`${f.position}.º de ${f.n}`}><span>${f.position}</span></li>`)}
  </ol>`;
}

// --- ELO line chart with crosshair -----------------------------------------------------
export function EloChart({ players, highlight = [], height = 260, from }) {
  const wrap = useRef(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState(null);
  useLayoutEffect(() => {
    setW(Math.max(280, wrap.current.getBoundingClientRect().width || 640));
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);

  const dates = useMemo(() => {
    const all = new Set();
    players.forEach((p) => p.eloSeries.forEach((s) => (!from || s.date >= from) && all.add(s.date)));
    return [...all].sort();
  }, [players, from]);
  const series = useMemo(() => players.map((p) => {
    let last = null;
    const pts = [];
    for (const s of p.eloSeries) if (from && s.date < from) last = s.elo;
    const byDate = Object.fromEntries(p.eloSeries.map((s) => [s.date, s.elo]));
    dates.forEach((d, i) => {
      if (byDate[d] != null) last = byDate[d];
      if (last != null) pts.push([i, last, byDate[d] != null]);
    });
    return { p, pts };
  }), [players, dates]);

  const pad = { l: 40, r: 64, t: 14, b: 26 };
  const vals = series.flatMap((s) => s.pts.map((x) => x[1]));
  const lo = Math.floor((Math.min(...vals, 1000) - 20) / 50) * 50;
  const hi = Math.ceil((Math.max(...vals, 1000) + 20) / 50) * 50;
  const X = (i) => pad.l + (i / Math.max(1, dates.length - 1)) * (w - pad.l - pad.r);
  const Y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (height - pad.t - pad.b);
  const ticks = [];
  for (let v = lo; v <= hi; v += 50) ticks.push(v);
  const hl = new Set(highlight);
  const ordered = [...series.filter((s) => !hl.has(s.p.id)), ...series.filter((s) => hl.has(s.p.id))];
  const labels = layoutLabels(series.filter((s) => hl.has(s.p.id)).map((s) => ({ s, y: Y(s.pts[s.pts.length - 1]?.[1] ?? 1000) })));

  const onMove = (e) => {
    const r = wrap.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * w;
    const i = Math.round(((x - pad.l) / (w - pad.l - pad.r)) * (dates.length - 1));
    setHover(Math.max(0, Math.min(dates.length - 1, i)));
  };
  const hoverRows = hover == null ? [] : series
    .filter((s) => hl.size === 0 || hl.has(s.p.id))
    .map((s) => ({ p: s.p, v: s.pts.find((x) => x[0] === hover)?.[1] ?? s.pts.filter((x) => x[0] <= hover).pop()?.[1] }))
    .filter((r) => r.v != null)
    .sort((a, b) => b.v - a.v);

  if (!w) return html`<div class="elochart" ref=${wrap} style=${`height:${height}px`}></div>`;
  return html`<div class="elochart" ref=${wrap} onPointerMove=${onMove} onPointerLeave=${() => setHover(null)}>
    <svg width=${w} height=${height} viewBox=${`0 0 ${w} ${height}`} role="img"
      aria-label=${`Evolución del ELO de ${players.length} jugadores`}>
      ${ticks.map((v) => html`<g><line x1=${pad.l} x2=${w - pad.r} y1=${Y(v)} y2=${Y(v)} class=${cls('elochart__grid', v === 1000 && 'is-base')} />
        <text x=${pad.l - 8} y=${Y(v) + 4} class="elochart__tick">${v}</text></g>`)}
      ${ordered.map(({ p, pts }) => {
        const d = pts.map(([i, v], k) => `${k ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
        const on = hl.size === 0 || hl.has(p.id);
        return html`<path d=${d} class=${cls('elochart__line', on ? `is-on line--${p.color}` : 'is-off')} />`;
      })}
      ${series.filter((s) => hl.has(s.p.id)).map(({ p, pts }) => {
        const last = pts[pts.length - 1];
        return last && html`<circle cx=${X(last[0])} cy=${Y(last[1])} r="4.5" class=${`elochart__dot line--${p.color}`} />`;
      })}
      ${labels.map(({ s, y, ly }) => html`<g class="elochart__label">
        <line x1=${w - pad.r + 6} x2=${w - pad.r + 14} y1=${y} y2=${ly} class="elochart__leader" />
        <text x=${w - pad.r + 17} y=${ly + 4}>${s.p.name}</text></g>`)}
      ${hover != null && html`<line x1=${X(hover)} x2=${X(hover)} y1=${pad.t} y2=${height - pad.b} class="elochart__cross" />`}
      <text x=${pad.l} y=${height - 6} class="elochart__tick elochart__tick--x">${dates[0] ?? ''}</text>
      <text x=${w - pad.r} y=${height - 6} class="elochart__tick elochart__tick--x is-end">${dates[dates.length - 1] ?? ''}</text>
    </svg>
    ${hover != null && html`<div class=${cls('elochart__tip', X(hover) > w * 0.6 && 'is-left')} style=${`--x:${X(hover)}px`}>
      <b>${dates[hover]}</b>
      ${hoverRows.slice(0, 6).map((r) => html`<span><i class=${`linekey line--${r.p.color}`}></i>${r.v}<em>${r.p.name}</em></span>`)}
    </div>`}
  </div>`;
}

function layoutLabels(items) {
  const sorted = items.slice().sort((a, b) => a.y - b.y);
  let prev = -Infinity;
  return sorted.map((it) => {
    const ly = Math.max(it.y, prev + 15);
    prev = ly;
    return { ...it, ly };
  });
}

// --- Head-to-head heatmap (diverging: ocean = ahead, rust = behind) ----------------------------
export function H2HMatrix({ players }) {
  const ids = players.map((p) => p.id);
  return html`<div class="h2h-wrap"><table class="h2h">
    <caption class="vh">Porcentaje de partidas en que el jugador de la fila terminó por delante del de la columna</caption>
    <thead><tr><th></th>${players.map((p) => html`<th scope="col"><span class="h2h__col"><${Cube} color=${p.color} size=${13} />${p.name}</span></th>`)}</tr></thead>
    <tbody>${players.map((a) => html`<tr>
      <th scope="row"><span class="h2h__row"><${Cube} color=${a.color} size=${13} />${a.name}</span></th>
      ${ids.map((b) => {
        if (a.id === b) return html`<td class="h2h__self" aria-hidden="true"></td>`;
        const c = MODEL.h2h[a.id]?.[b];
        if (!c || c.games < 2) return html`<td class="h2h__na"><span class="vh">Sin datos</span></td>`;
        const rate = c.ahead / c.games;
        const tone = rate >= 0.5 ? 'a' : 'b';
        const strength = Math.min(1, Math.abs(rate - 0.5) * 2.2);
        return html`<td class=${`h2h__cell h2h__cell--${tone}`} style=${`--s:${strength.toFixed(2)}`}
          data-tip=${`${a.name} terminó delante de ${MODEL.playerById[b].name} en ${c.ahead} de ${c.games}`} tabindex="0">
          ${Math.round(rate * 100)}</td>`;
      })}
    </tr>`)}</tbody>
  </table></div>`;
}

export { lerp };

// --- The board's TR track: numbered squares, every fifth one yellow, cubes on top ---
export function TRTrack({ game }) {
  const totals = game.results.map((r) => r.total);
  const lo = Math.max(0, Math.floor((Math.min(...totals) - 6) / 5) * 5);
  const hi = Math.ceil((Math.max(...totals) + 4) / 5) * 5;
  const squares = [];
  for (let v = lo; v <= hi; v++) squares.push(v);
  const at = {};
  game.results.forEach((r) => { (at[r.total] ??= []).push(r); });
  return html`<div class="trtrack" style=${`--n:${squares.length}`} role="img"
    aria-label=${`Pista de puntaje: ${game.results.map((r) => `${MODEL.playerById[r.player_id].name} ${r.total}`).join(', ')}`}>
    ${squares.map((v) => html`<span class=${cls('trtrack__sq', v % 5 === 0 && 'is-five', at[v] && 'is-occupied')}>
      ${v % 5 === 0 && html`<b>${v}</b>`}
      ${at[v] && html`<span class="trtrack__stack">${at[v].map((r, k) => html`<span class=${cls('trtrack__cube', r.position === 1 && 'is-win')} style=${`--k:${k}`}
        data-tip=${`${MODEL.playerById[r.player_id].name}: ${r.total}`}><${Cube} color=${MODEL.playerById[r.player_id].color} size=${r.position === 1 ? 22 : 18} /></span>`)}</span>`}
    </span>`)}
  </div>`;
}

// --- Diverging ELO delta bars ---
export function EloShift({ game }) {
  const max = Math.max(20, ...game.eloChanges.map((c) => Math.abs(c.delta)));
  return html`<ul class="eloshift">
    ${game.results.map((r) => {
      const c = game.eloChanges.find((x) => x.player_id === r.player_id);
      const p = MODEL.playerById[r.player_id];
      const w = (Math.abs(c.delta) / max) * 50;
      return html`<li class="eloshift__row">
        <span class="eloshift__who"><${Cube} color=${p.color} size=${14} />${p.name}</span>
        <span class="eloshift__pair">${c.before}<span aria-hidden="true">→</span><b>${c.after}</b></span>
        <span class="eloshift__bar" aria-hidden="true">
          <i class=${c.delta >= 0 ? 'is-up' : 'is-down'} style=${`--w:${w.toFixed(1)}`}></i>
        </span>
        <span class=${cls('eloshift__delta', c.delta > 0 ? 'delta--up' : c.delta < 0 ? 'delta--down' : 'delta--flat')}>
          <span aria-hidden="true">${c.delta > 0 ? '▲' : c.delta < 0 ? '▼' : '■'}</span>${fmt.signed(c.delta)}</span>
      </li>`;
    })}
  </ul>`;
}
