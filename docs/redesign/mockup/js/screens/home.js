import { html, useState, cls, fmt } from '../lib.js';
import { MODEL, seasonRace, SEASON_CATEGORIES, MIN_SEASON_GAMES } from '../data/derive.js';
import { CATEGORIES, corpLabel } from '../data/catalog.js';
import { MesaFilter, MesaNotice, useMesa } from '../ui/mesa.js';
import { useNav } from '../router.js';
import { Icon } from '../ui/icons.js';
import { Button, Plate, SectionHead, PlayerTag, CorpEmblem, MapBadge, ExpansionTags, Delta, Cube, NewBadge, CountUp, fmtDate } from '../ui/atoms.js';
import { Thermometer, OxygenArc, OceanSlots, ScoreTrack, Sparkline } from '../ui/instruments.js';
import { PlanetSlot } from '../ui/planet-slot.js';
import { Sheet } from '../ui/sheet.js';

const P = (id) => MODEL.playerById[id];

function Orbit() {
  const g = MODEL.group;
  const items = [
    { k: 'a', label: 'Partidas archivadas', value: g.games },
    { k: 'b', label: 'Generaciones jugadas', value: g.generations },
    { k: 'c', label: 'Puntaje medio del ganador', value: g.avgWinner },
    { k: 'd', label: 'Corporación más elegida', value: corpLabel(g.topCorp.name), sub: `${g.topCorp.games} veces` },
  ];
  return html`<ul class="orbit" aria-label="Datos del archivo">
    ${items.map((it) => html`<li class=${`orbit__item orbit__item--${it.k}`}>
      <span class="orbit__value">${typeof it.value === 'number' ? html`<${CountUp} value=${it.value} delay=${500} />` : it.value}</span>
      <span class="orbit__label">${it.label}${it.sub && html` <em>${it.sub}</em>`}</span>
    </li>`)}
  </ul>`;
}

function SeasonHero({ onRules }) {
  const s = MODEL.season;
  const nav = useNav();
  const left = Math.max(1, Math.ceil((19 - (s.temperature + 30) / 2) / 0.8));
  return html`<section class="hero reveal" style="--i:0" aria-labelledby="hero-title">
    <div class="hero__text">
      <h1 class="hero__title" id="hero-title">Marte, temporada ${s.number}</h1>
      <p class="hero__lede">
        <b>${Math.round(s.pct * 100)} % terraformado.</b> Cada partida registrada sube la temperatura, el oxígeno y los océanos
        de este planeta. Al completar los tres termina la temporada, y el título es para el mejor promedio de puntos.
      </p>
      <div class="hero__console plate plate--glass" data-sheen>
        <${Thermometer} value=${s.temperature} />
        <div class="hero__pair">
          <${OxygenArc} value=${s.oxygenPct} />
          <${OceanSlots} value=${s.oceanCount} />
        </div>
      </div>
      <div class="hero__actions">
        <${Button} variant="primary" size="l" icon="plus" onClick=${() => nav.go('register')}>Registrar partida</${Button}>
        <${Button} variant="ghost" icon="info" onClick=${onRules}>Cómo avanza la temporada</${Button}>
      </div>
      <p class="hero__eta">Faltan unas ${left} partidas para completarla.</p>
    </div>
    <div class="hero__planet">
      <${PlanetSlot} terra=${0.18 + s.pct * 0.62} interactive=${true} class="hero__slot"
        label=${`Marte al ${Math.round(s.pct * 100)} % de terraformación. Arrastrá para girarlo.`} />
      <${Orbit} />
      <span class="hero__hint" aria-hidden="true"><${Icon} name="swap" size=${14} />Arrastrá para girar</span>
    </div>
  </section>`;
}

function LastGame() {
  const g = MODEL.games[0];
  const nav = useNav();
  const w = g.results[0];
  return html`<${Plate} class="lastgame reveal" label="Última partida">
    <${SectionHead} title="Última partida">
      <span>${fmtDate(g.date)}</span>
    </${SectionHead}>
    <div class="lastgame__meta">
      <${MapBadge} map=${g.map} />
      <span class="lastgame__chip"><${Icon} name="generation" size=${16} />${g.generations} generaciones</span>
      <${ExpansionTags} expansions=${g.expansions} draft=${g.draft} />
    </div>
    <div class="lastgame__win">
      <${CorpEmblem} name=${w.corporation} size="l" />
      <div class="lastgame__winner">
        <span class="lastgame__kicker">Ganó</span>
        <${PlayerTag} player=${P(w.player_id)} size="l" />
        <span class="lastgame__corp">${corpLabel(w.corporation)}, por ${g.margin} puntos</span>
      </div>
      <span class="lastgame__score"><${CountUp} value=${w.total} delay=${300} /><small>pts</small></span>
    </div>
    <${ScoreTrack} game=${g} />
    <div class="lastgame__foot">
      <span class="lastgame__news">
        ${g.recordsBroken.length > 0 && html`<${Icon} name="trophy" size=${16} />${g.recordsBroken.length} récords rotos`}
        ${g.achievementsUnlocked.length > 0 && html`<${Icon} name="crown" size=${16} />${g.achievementsUnlocked.length} logros`}
      </span>
      <${Button} variant="ghost" size="s" icon="spark" onClick=${() => nav.go('ceremony', { id: g.id })}>Repetir ceremonia</${Button}>
      <${Button} size="s" onClick=${() => nav.go('game', { id: g.id })}>Ver informe</${Button}>
    </div>
  </${Plate}>`;
}

function Council() {
  const nav = useNav();
  const top = MODEL.players.filter((p) => p.rank).sort((a, b) => a.rank - b.rank).slice(0, 5);
  return html`<${Plate} class="council reveal" label="Ranking">
    <${SectionHead} title="Consejo de Terraformación">
      <span>ELO</span>
    </${SectionHead}>
    <ol class="council__list">
      ${top.map((p) => html`<li class=${`council__row council__row--${p.rank}`}>
        <span class="council__rank">${p.rank}</span>
        <${PlayerTag} player=${p} />
        <${Sparkline} values=${p.eloSeries.slice(-12).map((s) => s.elo)} width=${72} height=${22} color=${p.color} />
        <span class="council__elo">${p.elo}</span>
        <${Delta} value=${p.lastDelta} size="s" />
      </li>`)}
    </ol>
    <${Button} variant="ghost" size="s" iconRight="next" onClick=${() => nav.go('ranking')}>Ranking completo</${Button}>
  </${Plate}>`;
}

const FEED_TAG = { record: ['trophy', 'blue', 'Récord'], achievement: ['crown', 'green', 'Logro'], game: ['games', 'red', 'Partida'], season: ['spark', 'gold', 'Temporada'] };

export function FeedList({ items, compact }) {
  const nav = useNav();
  return html`<ol class=${`feed ${compact ? 'feed--compact' : ''}`}>
    ${items.map((f) => {
      const [icon, tone, kind] = FEED_TAG[f.type];
      const p = P(f.player_id);
      return html`<li class="feed__item">
        <span class=${`tagdisc tagdisc--${tone}`} title=${kind}><${Icon} name=${icon} size=${15} /></span>
        <button type="button" class="feed__body" onClick=${() => f.game_id && nav.go('game', { id: f.game_id })}>
          <span class="feed__text">${p && html`<${Cube} color=${p.color} size=${13} />`}${f.text}</span>
          <span class="feed__date">${fmtDate(f.date, { short: true, year: false })}</span>
        </button>
      </li>`;
    })}
  </ol>`;
}

function Logbook() {
  return html`<${Plate} class="logbook reveal" label="Bitácora">
    <${SectionHead} title="Bitácora del archivo" />
    <${FeedList} items=${MODEL.feed.filter((f) => f.type !== 'game').slice(0, 9)} />
  </${Plate}>`;
}

const CAT_LABEL = { total: 'Total', ...Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label])) };

function RaceRow({ r, max, i }) {
  return html`<li class="race__row" style=${`--w:${((r.avg / max) * 100).toFixed(1)};--i:${i}`}>
    <${PlayerTag} player=${P(r.player_id)} size="s" sub=${`${r.games} ${r.games === 1 ? 'partida' : 'partidas'}`} />
    <span class="race__bar"><i></i></span>
    <span class="race__val">${fmt.dec(r.avg)}</span>
  </li>`;
}

function CategoryPicker({ value, onChange }) {
  return html`<div class="fgroup race__cats" role="group" aria-label="Categoría de la carrera">
    <span class="fgroup__label">Promedio de</span>
    <div class="fchips">${SEASON_CATEGORIES.map((c) => html`<button type="button" class=${cls('fchip', value === c && 'is-on')}
      aria-pressed=${value === c} onClick=${() => onChange(c)}>${CAT_LABEL[c]}</button>`)}</div>
  </div>`;
}

function raceLede(category, games) {
  const what = category === 'total' ? 'puntos' : CAT_LABEL[category].toLowerCase();
  const pool = category === 'turmoil_points' ? `${games} partidas con Turmoil` : `${games} partidas`;
  return `Promedio de ${what} por partida en las ${pool} de esta temporada. Hacen falta ${MIN_SEASON_GAMES} partidas para clasificar.`;
}

// The season race (owner's point 4): average per game, by category and table size.
function SeasonRace({ query }) {
  const s = MODEL.season;
  const [mesa, setMesa] = useMesa(query);
  const nav = useNav();
  const category = SEASON_CATEGORIES.includes(query.cat) ? query.cat : 'total';
  const race = seasonRace(s, MODEL.gameById, { category, playerCount: mesa });
  const max = race.qualified[0]?.avg || race.pending[0]?.avg || 1;
  const setCat = (c) => nav.go('home', {}, { ...query, cat: c === 'total' ? '' : c });
  return html`<${Plate} class="race reveal" label="Carrera de la temporada">
    <${SectionHead} title="Carrera por la temporada ${s.number}"><${NewBadge} /></${SectionHead}>
    <p class="race__lede">${raceLede(category, race.games)}</p>
    <div class="race__tools"><${CategoryPicker} value=${category} onChange=${setCat} /><${MesaFilter} value=${mesa} onChange=${setMesa} /></div>
    <${MesaNotice} value=${mesa} onClear=${() => setMesa(null)} />
    ${race.qualified.length === 0 && race.pending.length === 0
      ? html`<p class="muted">Todavía no hay partidas para esta carrera.</p>`
      : html`<ol class="race__list">${race.qualified.slice(0, 6).map((r, i) => html`<${RaceRow} r=${r} max=${max} i=${i} />`)}</ol>`}
    ${race.pending.length > 0 && html`<div class="race__pending"><h3 class="race__h">Sin clasificar</h3>
      <ul>${race.pending.map((r) => html`<li><${PlayerTag} player=${P(r.player_id)} size="s" /><span>${fmt.dec(r.avg)}</span>
        <small class="faint">le ${r.missing === 1 ? 'falta 1 partida' : `faltan ${r.missing} partidas`}</small></li>`)}</ul></div>`}
  </${Plate}>`;
}

function SeasonRules({ onClose }) {
  const past = MODEL.seasons.filter((s) => s.end);
  return html`<${Sheet} title="Cómo avanza la temporada" onClose=${onClose}>
    <div class="rules">
      <p>El grupo terraforma su propio Marte, partida a partida. Los parámetros son los del tablero:</p>
      <ul class="rules__list">
        <li><${Icon} name="temperature" size=${20} /><span><b>Temperatura:</b> cada partida suma casi un paso de 2 °C (19 pasos, de −30 a +8 °C).</span></li>
        <li><${Icon} name="oxygen" size=${20} /><span><b>Oxígeno:</b> cada 52 puntos de vegetación del grupo suben 1 % (hasta 14 %).</span></li>
        <li><${Icon} name="ocean" size=${20} /><span><b>Océanos:</b> se coloca uno cada dos o tres partidas (9 en total).</span></li>
      </ul>
      <p>Cuando los tres llegan al máximo, Marte queda terraformado y la temporada se cierra. La carrera se ordena por <b>promedio</b> de puntos por partida; hacen falta ${MIN_SEASON_GAMES} partidas para clasificar.</p>
      <p>El campeón es el primer clasificado por promedio total al cierre. Si dos empatan, gana quien jugó más partidas, y después quien hizo el mejor puntaje.</p>
      <h3 class="rules__h">Temporadas anteriores</h3>
      <ol class="rules__past">
        ${past.map((s) => html`<li><span>Temporada ${s.number}</span><span>${fmtDate(s.start, { short: true })} a ${fmtDate(s.end, { short: true })}</span>
          <${PlayerTag} player=${P(s.champion)} size="s" /></li>`)}
      </ol>
      <p class="flavor">«Con suficiente paciencia, hasta un desierto helado aprende a respirar.»</p>
    </div>
  </${Sheet}>`;
}

export function Home({ query = {} }) {
  const [rules, setRules] = useState(false);
  return html`
    <${SeasonHero} onRules=${() => setRules(true)} />
    <div class="home-grid">
      <${LastGame} />
      <${Logbook} />
      <${Council} />
      <${SeasonRace} query=${query} />
    </div>
    ${rules && html`<${SeasonRules} onClose=${() => setRules(false)} />`}
  `;
}
