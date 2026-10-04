// End-of-game ceremony: one orchestrated sequence. Categories are tallied one by one,
// rows re-sort as totals change, then the winner, ELO, records and achievements land.
import { html, useState, useEffect, useRef, useMemo, cls, fmt, reducedMotion } from '../lib.js';
import { MODEL, gameRecordContext } from '../data/derive.js';
import { MAPS, CATEGORIES, ACHIEVEMENTS, corpLabel } from '../data/catalog.js';
import { useNav } from '../router.js';
import { Icon, MapGlyph } from '../ui/icons.js';
import { Button, Cube, CorpEmblem, Medal, CountUp, fmtDate } from '../ui/atoms.js';
import { PlanetSlot } from '../ui/planet-slot.js';
import { burst } from '../fx/confetti.js';

const P = (id) => MODEL.playerById[id];
const COLOR_HEX = { rojo: '#e2483d', verde: '#3fae49', azul: '#3b7be0', amarillo: '#f0c330', negro: '#9a9aa8', naranja: '#ee7a2a', violeta: '#8f5fe0', rosa: '#e05aa6', blanco: '#e8e4dc', gris: '#8b8582' };
const ROW_H = 62;

function useSequence(total, step = 950, start = 700) {
  const [phase, setPhase] = useState(reducedMotion() ? total : 0);
  useEffect(() => {
    if (phase >= total) return undefined;
    const t = setTimeout(() => setPhase((p) => p + 1), phase === 0 ? start : step);
    return () => clearTimeout(t);
  }, [phase]);
  return [phase, () => setPhase(total)];
}

function Tally({ g, cats, shown }) {
  const rows = g.results.map((r) => {
    const parts = cats.slice(0, shown).map((c) => ({ c, v: r.scores[c.key] ?? 0 }));
    return { r, parts, total: parts.reduce((s, x) => s + x.v, 0) };
  });
  const order = rows.slice().sort((a, b) => b.total - a.total || (shown >= cats.length ? b.r.mc - a.r.mc : 0));
  const top = Math.max(1, ...g.results.map((r) => r.total));
  const cur = cats[shown - 1];
  return html`<div class="tally" style=${`--rows:${rows.length}`}>
    ${rows.map((row) => {
      const rank = order.indexOf(row);
      const p = P(row.r.player_id);
      const done = shown >= cats.length;
      const add = cur ? row.r.scores[cur.key] ?? 0 : 0;
      return html`<div class=${cls('tally__row', done && rank === 0 && 'is-win')} style=${`--y:${rank * ROW_H}px`}>
        <span class="tally__rank">${rank + 1}</span>
        <span class="tally__who"><${Cube} color=${p.color} size=${20} /><b>${p.name}</b>
          <${CorpEmblem} name=${row.r.corporation} size="s" /></span>
        <span class="tally__bar">${row.parts.map(({ c, v }) => v > 0 && html`<i class=${`catkey--${c.key}`} style=${`--w:${(v / top) * 100}`}></i>`)}</span>
        <span class="tally__total"><${CountUp} value=${row.total} duration=${600} from=${Math.max(0, row.total - add)} /></span>
        ${cur && add > 0 && !done && html`<span class="tally__plus" key=${shown}>+${add}</span>`}
      </div>`;
    })}
  </div>`;
}

function WinnerBanner({ g }) {
  const w = g.results[0];
  const p = P(w.player_id);
  const second = g.results.find((r) => r.position > 1);
  return html`<div class="cer-win">
    <span class="cer-win__kicker">Ganó la partida</span>
    <div class="cer-win__row">
      <${CorpEmblem} name=${w.corporation} size="l" />
      <h2 class="cer-win__name"><${Cube} color=${p.color} size=${30} />${p.name}</h2>
    </div>
    <p class="cer-win__sub">${corpLabel(w.corporation)}, ${w.total} puntos${second ? `, ${g.decidedByMc ? 'por desempate de M€' : `${g.margin} sobre ${P(second.player_id).name}`}` : ''}</p>
  </div>`;
}

function EloBlock({ g }) {
  return html`<section class="cer-block" aria-label="Cambios de ELO">
    <h3 class="cer-block__title"><${Icon} name="ranking" size=${18} />ELO</h3>
    <ul class="cer-elo">
      ${g.results.map((r) => {
        const c = g.eloChanges.find((x) => x.player_id === r.player_id);
        return html`<li><${Cube} color=${P(r.player_id).color} size=${15} /><span>${P(r.player_id).name}</span>
          <b><${CountUp} value=${c.after} from=${c.before} duration=${1100} /></b>
          <span class=${c.delta >= 0 ? 'delta delta--up' : 'delta delta--down'}><span aria-hidden="true" class="delta__glyph">${c.delta >= 0 ? '▲' : '▼'}</span>${fmt.signed(c.delta)}</span></li>`;
      })}
    </ul>
  </section>`;
}

function RecordsBlock({ g }) {
  const broken = gameRecordContext(g, MODEL).filter((c) => c.broken);
  return html`<section class="cer-block" aria-label="Récords">
    <h3 class="cer-block__title"><${Icon} name="trophyNav" size=${18} />Récords</h3>
    ${broken.length === 0 ? html`<p class="faint">Ningún récord nuevo esta vez.</p>` : html`<ul class="cer-recs">
      ${broken.map((c, i) => html`<li class="cer-rec" style=${`--i:${i}`}>
        <span class="cer-rec__band">Nuevo récord</span>
        <b>${c.def.title}</b>
        <span class="cer-rec__val"><${Cube} color=${P(c.broken.player_id).color} size=${16} />${c.broken.value}<small>antes ${c.broken.previous.value} (${P(c.broken.previous.player_id).name})</small></span>
      </li>`)}
    </ul>`}
  </section>`;
}

function AchBlock({ g }) {
  const best = {};
  g.achievementsUnlocked.forEach((a) => {
    const k = `${a.player_id}-${a.code}`;
    if (!best[k] || best[k].level < a.level) best[k] = a;
  });
  const list = Object.values(best);
  return html`<section class="cer-block" aria-label="Logros">
    <h3 class="cer-block__title"><${Icon} name="crown" size=${18} />Logros</h3>
    ${list.length === 0 ? html`<p class="faint">Nadie desbloqueó logros en esta partida.</p>` : html`<ul class="cer-ach">
      ${list.map((a, i) => {
        const def = ACHIEVEMENTS.find((d) => d.code === a.code);
        return html`<li style=${`--i:${i}`}><${Medal} glyph=${def.glyph} tier=${a.level} size="m" single=${def.tiers.length === 1} />
          <span><b>${def.tiers.find((t) => t.level === a.level).title}</b><small>${P(a.player_id).name}${def.tiers.length > 1 ? `, nivel ${a.level}` : ''}</small></span></li>`;
      })}
    </ul>`}
  </section>`;
}

export function Ceremony({ params }) {
  const nav = useNav();
  const g = MODEL.gameById[params.id] ?? MODEL.games[0];
  const cats = useMemo(() => CATEGORIES.filter((c) => c.key !== 'turmoil_points' || g.expansions.includes('Turmoil')), [g]);
  const N = cats.length;
  const [phase, skip] = useSequence(N + 5);
  const shown = Math.min(N, phase);
  const cv = useRef(null);
  const tallyDone = phase > N;
  // The burst fires once and lives out its pieces; it is only cut (and cleared) on unmount (D-77).
  const stopConfetti = useRef(null);
  useEffect(() => () => stopConfetti.current?.(), []);
  useEffect(() => {
    if (phase !== N + 1 || stopConfetti.current) return;
    const colors = [...g.results.map((r) => COLOR_HEX[P(r.player_id).color]), '#f4c43a', '#f4c43a'];
    const c = cv.current.getBoundingClientRect();
    const w = cv.current.parentElement.querySelector('.cer-win__name')?.getBoundingClientRect();
    const x = w ? (w.left + w.width / 2 - c.left) / c.width : 0.5;
    const y = w ? (w.top + w.height / 2 - c.top) / c.height : 0.3;
    stopConfetti.current = burst(cv.current, { colors, x, y });
  }, [phase]);
  const cur = cats[shown - 1];
  const status = !tallyDone ? (cur ? `Sumando ${cur.long}` : 'Fin de la partida') : 'Resultados finales';
  return html`<div class="cer">
    <div class="cer__planet"><${PlanetSlot} terra=${0.35} tilt=${0.15} bright=${0.75} /></div>
    <canvas class="cer__confetti" ref=${cv} aria-hidden="true"></canvas>
    <header class="cer__head">
      <span class="cer__map"><${MapGlyph} glyph=${MAPS[g.map].glyph} size=${26} />${g.map}<small>${fmtDate(g.date)}, ${g.generations} generaciones</small></span>
      ${phase < N + 5 && html`<${Button} variant="ghost" size="s" onClick=${skip}>Saltar animación</${Button}>`}
    </header>
    <div class="cer__main">
      <p class="cer__status" aria-live="polite">${status}</p>
      <div class="cer__cat" key=${shown}>
        ${tallyDone && html`<h1 class="vh">Puntaje final</h1>`}
        ${!tallyDone && cur && html`<span class=${`cer__catchip catkey--${cur.key}`}><${Icon} name=${cur.icon} size=${22} />${cur.long}</span>`}
        ${!tallyDone && !cur && html`<h1 class="cer__title">Puntaje final</h1>`}
      </div>
      ${tallyDone && html`<${WinnerBanner} g=${g} />`}
      <${Tally} g=${g} cats=${cats} shown=${shown} />
      <div class="cer__after">
        ${phase >= N + 2 && html`<${EloBlock} g=${g} />`}
        ${phase >= N + 3 && html`<${RecordsBlock} g=${g} />`}
        ${phase >= N + 4 && html`<${AchBlock} g=${g} />`}
      </div>
      ${phase >= N + 5 && html`<div class="cer__actions">
        <${Button} variant="primary" size="l" onClick=${() => nav.go('game', { id: g.id })}>Ver informe completo</${Button}>
        <${Button} variant="ghost" icon="home" onClick=${() => nav.go('home')}>Volver al inicio</${Button}>
      </div>`}
    </div>
  </div>`;
}
