import { html, useState, cls, fmt } from '../lib.js';
import { MODEL, modelFor } from '../data/derive.js';
import { MAPS, MAP_ORDER, CATEGORIES, ACHIEVEMENTS, RECORDS, corpLabel } from '../data/catalog.js';
import { milestoneLabel, awardLabel } from '../data/labels.js';
import { useNav } from '../router.js';
import { Icon, MapGlyph } from '../ui/icons.js';
import { Button, Plate, SectionHead, Cube, PlayerTag, CorpEmblem, Delta, Tabs, Medal, TierPips, NewBadge, Readout, useTilt, Empty, CountUp, fmtDate } from '../ui/atoms.js';
import { EloChart, CompositionBar, FormStrip, CategoryLegend } from '../ui/instruments.js';
import { MesaFilter, MesaNotice, useMesa } from '../ui/mesa.js';
import { ByTablePanel, InfoTip, RelPos, TIPS, VsExpected } from '../ui/fairness.js';

const P = (id) => MODEL.playerById[id];

function Cube3D({ color }) {
  const ref = useTilt(22);
  return html`<div class=${`cube3d cube3d--${color}`} ref=${ref} aria-hidden="true">
    <div class="cube3d__spin"><div class="cube3d__body">
      <i class="cube3d__f cube3d__f--front"></i><i class="cube3d__f cube3d__f--back"></i>
      <i class="cube3d__f cube3d__f--right"></i><i class="cube3d__f cube3d__f--left"></i>
      <i class="cube3d__f cube3d__f--top"></i><i class="cube3d__f cube3d__f--bottom"></i>
    </div></div>
    <span class="cube3d__shadow"></span>
  </div>`;
}

// Most claimed milestone and most won award (#35, #66) with the per-game averages (#38).
function Favorites({ p }) {
  const pick = (fav, label) => (fav ? html`<b>${fav.names.map(label).join(', ')}</b><small>${fav.count} ${fav.count === 1 ? 'vez' : 'veces'}</small>` : null);
  return html`<dl class="phero__picks">
    <div><dt class="faint">Hito más reclamado</dt>
      <dd>${pick(p.favorites.milestone, milestoneLabel) ?? html`<span class="faint">Todavía no reclamó ningún hito.</span>`}
        <small>${fmt.dec(p.avgMilestones)} por partida</small></dd></div>
    <div><dt class="faint">Recompensa más ganada</dt>
      <dd>${pick(p.favorites.award, awardLabel) ?? html`<span class="faint">Todavía no ganó ninguna recompensa.</span>`}
        <small>${fmt.dec(p.avgAwards)} por partida</small></dd></div>
  </dl>`;
}

function ProfileHero({ p, mesa }) {
  const nav = useNav();
  const fav = p.corps[0];
  return html`<section class="phero reveal" style="--i:0" aria-labelledby="phero-name">
    <div class="phero__token"><${Cube3D} color=${p.color} /></div>
    <div class="phero__id">
      <${Button} variant="ghost" size="s" icon="back" onClick=${() => nav.go('ranking')}>Ranking</${Button}>
      <span class="phero__tab">Expediente</span>
      <h1 class="phero__name" id="phero-name">${p.name}</h1>
      ${p.archetype && html`<p class="phero__arch"><b>${p.archetype.name}.</b> ${p.archetype.desc} <${NewBadge}>Arquetipo</${NewBadge}></p>`}
      <p class="phero__since faint">Juega desde ${fmtDate(p.since)}${!p.active ? ' (inactivo)' : ''}</p>
    </div>
    <div class="phero__stats plate plate--glass" data-sheen>
      <div class="phero__elo">
        <span class="phero__elo-label">${mesa ? `ELO de mesa ${mesa}` : 'ELO'}</span>
        <span class="phero__elo-value"><${CountUp} value=${p.elo} from=${1000} duration=${1200} /></span>
        <span class="phero__elo-meta">${p.rank ? html`<b>#${p.rank}</b> de ${p.rankTotal}` : 'Sin ranking'}<${Delta} value=${p.lastDelta} size="s" /></span>
      </div>
      <div class="phero__grid">
        <${Readout} label="Pico" value=${p.peak ?? '—'} />
        <${Readout} label="Partidas" value=${p.games} />
        <${Readout} label="Victorias" value=${p.wins} sub=${fmt.pct(p.winRate)} />
        <${Readout} label="Promedio" value=${p.avgPoints} sub="puntos" />
        <${Readout} label="Mejor" value=${p.best} sub="puntos" accent />
        <${Readout} label="Posición media" value=${fmt.dec(p.avgPos)} />
      </div>
      ${fav && html`<div class="phero__fav"><span class="faint">Corporación favorita</span>
        <${CorpEmblem} name=${fav.name} withName /><span class="faint">${fav.games} partidas, ${fav.wins} victorias</span></div>`}
      <${Favorites} p=${p} />
    </div>
  </section>`;
}

function ScoreDNA({ p, model }) {
  const g = model.group.composition;
  return html`<${Plate} class="reveal dna" label="ADN de puntaje">
    <${SectionHead} title="ADN de puntaje"><${NewBadge} /></${SectionHead}>
    <p class="muted dna__lede">De dónde salen sus puntos, comparado con el promedio del grupo.</p>
    <div class="dna__bars">
      <${CompositionBar} share=${p.composition.share} label=${p.name} />
      <${CompositionBar} share=${g.share} label="Grupo" />
    </div>
    <${CategoryLegend} />
    <ul class="dna__list">
      ${CATEGORIES.map((c) => {
        const mine = p.composition.avg[c.key];
        const grp = g.avg[c.key];
        const diff = mine - grp;
        return html`<li><span class=${`catkey catkey--${c.key}`} aria-hidden="true"></span><span>${c.long}</span>
          <b>${fmt.dec(mine)}</b><span class=${cls('dna__diff', diff >= 0.5 ? 'delta--up' : diff <= -0.5 ? 'delta--down' : 'delta--flat')}>${diff >= 0 ? '+' : '−'}${fmt.dec(Math.abs(diff))}</span></li>`;
      })}
    </ul>
  </${Plate}>`;
}

function MapsPanel({ p }) {
  const byName = Object.fromEntries(p.maps.map((m) => [m.name, m]));
  return html`<${Plate} class="reveal maps-panel" label="Por mapa">
    <${SectionHead} title="Por mapa"><${NewBadge} /></${SectionHead}>
    <ul class="mapgrid">
      ${MAP_ORDER.map((name) => {
        const m = byName[name];
        return html`<li class=${cls('mapgrid__item', !m && 'is-none')}>
          <${MapGlyph} glyph=${MAPS[name].glyph} size=${34} />
          <span class="mapgrid__name">${name}</span>
          ${m ? html`<span class="mapgrid__rate">${fmt.pct(m.wins / m.games)}</span>
            <span class="mapgrid__sub">${m.wins} de ${m.games} ganadas</span>
            <span class="mapgrid__bar" style=${`--w:${((m.wins / m.games) * 100).toFixed(0)}`}></span>`
            : html`<span class="mapgrid__sub">Sin partidas</span>`}
        </li>`;
      })}
    </ul>
  </${Plate}>`;
}

function CorpsPanel({ p }) {
  const top = p.corps.slice(0, 6);
  const max = Math.max(...top.map((c) => c.games));
  return html`<${Plate} class="reveal corps-panel" label="Corporaciones">
    <${SectionHead} title="Corporaciones"><span>${p.corps.length} distintas</span></${SectionHead}>
    <ul class="corplist">
      ${top.map((c) => html`<li class="corplist__row">
        <${CorpEmblem} name=${c.name} withName />
        <span class="corplist__bar" style=${`--g:${((c.games / max) * 100).toFixed(0)};--w:${((c.wins / max) * 100).toFixed(0)}`}
          role="img" aria-label=${`${c.games} partidas, ${c.wins} victorias`}><i></i><b></b></span>
        <span class="corplist__n">${c.wins}/${c.games}</span>
      </li>`)}
    </ul>
    <p class="corplist__key faint"><i class="k-g"></i>Partidas <i class="k-w"></i>Victorias</p>
  </${Plate}>`;
}

function RivalsPanel({ p }) {
  const nav = useNav();
  const card = (r, kind, text) => r && html`<button type="button" class=${`rival rival--${kind}`} onClick=${() => nav.go('profile', { id: r.player_id })}>
    <span class="rival__kind">${kind === 'nemesis' ? 'Némesis' : 'Víctima favorita'}</span>
    <span class="rival__who"><${Cube} color=${P(r.player_id).color} size=${22} /><b>${P(r.player_id).name}</b></span>
    <span class="rival__rec">${text(r)}</span>
  </button>`;
  return html`<${Plate} class="reveal rivals-panel" label="Rivales">
    <${SectionHead} title="Rivales"><${NewBadge} /></${SectionHead}>
    <div class="rival-pair">
      ${card(p.nemesis, 'nemesis', (r) => `Le ganó a ${p.name} en ${r.behind} de ${r.games} partidas`)}
      ${card(p.victim, 'victim', (r) => `${p.name} le ganó en ${r.ahead} de ${r.games} partidas`)}
    </div>
    <div class="streaks">
      <div><span class="faint">Forma reciente</span><${FormStrip} form=${p.form} /></div>
      <${Readout} label="Mejor racha" value=${p.streak.best} sub="victorias seguidas" />
      <${Readout} label="Racha actual" value=${p.streak.current} sub=${p.streak.current ? 'en curso' : 'sin racha'} />
      <${Readout} label="Hitos por partida" value=${fmt.dec(p.avgMilestones)} />
      <${Readout} label="Recompensas ganadas" value=${fmt.dec(p.avgAwards)} sub="por partida" />
    </div>
  </${Plate}>`;
}

function Fairness({ p }) {
  return html`<${Plate} class="reveal fairness" label="Equidad">
    <${SectionHead} title="Equidad"><${NewBadge} /></${SectionHead}>
    <div class="fairness__grid">
      <div><span class="faint">Victorias vs. esperado <${InfoTip} text=${TIPS.expected} /></span><${VsExpected} e=${p.equity} /></div>
      <div><span class="faint">Posición relativa <${InfoTip} text=${TIPS.relPos} /></span><${RelPos} e=${p.equity} /></div>
      <div><span class="faint">Victorias esperadas</span><b>${fmt.dec(p.equity.expected)}</b></div>
    </div>
  </${Plate}>`;
}

function Summary({ p, model, mesa }) {
  return html`<div class="profile-grid">
    <${Plate} class="reveal pelo" label="Evolución del ELO">
      <${SectionHead} title="Evolución del ELO"><span>${p.eloSeries.length} partidas</span></${SectionHead}>
      <${EloChart} players=${[p]} highlight=${[p.id]} height=${240} />
    </${Plate}>
    <${ScoreDNA} p=${p} model=${model} />
    <${Fairness} p=${p} />
    <${ByTablePanel} p=${p} mesa=${mesa} />
    <${RivalsPanel} p=${p} />
    <${MapsPanel} p=${p} />
    <${CorpsPanel} p=${p} />
  </div>`;
}

function History({ p }) {
  const nav = useNav();
  return html`<${Plate} class="reveal" label="Historial">
    <ol class="hist">
      ${p.history.map((h) => html`<li><button type="button" class="hist__row" onClick=${() => nav.go('game', { id: h.game_id })}>
        <span class=${cls('hist__pos', h.position === 1 && 'is-win')}>${h.position}<small>/${h.n}</small></span>
        <span class="hist__map"><${MapGlyph} glyph=${MAPS[h.map].glyph} size=${20} />${h.map}</span>
        <span class="hist__date">${fmtDate(h.date, { short: true })}</span>
        <span class="hist__corp"><${CorpEmblem} name=${h.corporation} size="s" withName /></span>
        <span class="hist__pts">${h.total}</span>
        <span class="hist__delta"><${Delta} value=${h.delta} size="s" /></span>
      </button></li>`)}
    </ol>
  </${Plate}>`;
}

function RecordsHeld({ p, model }) {
  const nav = useNav();
  const held = model.records.filter((r) => p.recordsHeld.includes(r.code));
  if (!held.length) return html`<${Empty} icon="trophy" title="Sin récords por ahora"
    action=${html`<${Button} onClick=${() => nav.go('records')}>Ver todos los récords</${Button}>`}>
    ${p.name} todavía no tiene ningún récord del grupo.</${Empty}>`;
  return html`<ul class="heldlist">
    ${held.map((r) => html`<li class="reveal"><${Plate} class="held" cut="s">
      <span class="tagdisc tagdisc--blue"><${Icon} name=${r.icon} size=${15} /></span>
      <div class="held__text"><b>${r.title}</b><span class="muted">${r.description}</span></div>
      <span class="held__val">${r.value}<small>${r.unit}</small></span>
    </${Plate}></li>`)}
  </ul>`;
}

function AchievementsTab({ p }) {
  const list = ACHIEVEMENTS.map((def) => ({ def, a: p.achievements[def.code] }))
    .sort((x, y) => (y.a.tier > 0) - (x.a.tier > 0) || y.a.tier - x.a.tier);
  return html`<ul class="pach">
    ${list.map(({ def, a }) => {
      const tier = def.tiers.find((t) => t.level === a.tier);
      const next = def.tiers.find((t) => t.level === a.tier + 1);
      return html`<li class=${cls('pach__item', !a.tier && 'is-locked')}>
        <${Medal} glyph=${def.glyph} tier=${a.tier} size="m" single=${def.tiers.length === 1} />
        <div class="pach__text">
          <b>${tier?.title ?? def.tiers[0].title}</b>
          <span class="muted">${def.description}</span>
          ${def.tiers.length > 1 && html`<${TierPips} tier=${a.tier} max=${def.tiers.length} />`}
          ${a.progress && html`<span class="pach__prog"><span class="pach__bar"><i style=${`--p:${((a.progress.current / a.progress.target) * 100).toFixed(0)}`}></i></span>
            <span class="faint">${a.progress.current}/${a.progress.target}${next ? ` para ${next.title}` : ''}</span></span>`}
        </div>
      </li>`;
    })}
  </ul>`;
}

const TABS = ['resumen', 'partidas', 'records', 'logros'];

export function Profile({ params, query = {} }) {
  const nav = useNav();
  const [mesa, setMesa] = useMesa(query);
  const model = modelFor({ playerCount: mesa });
  const p = model.playerById[params.id] ?? model.players[0];
  const tab = TABS.includes(query.tab) ? query.tab : 'resumen';
  const setTab = (t) => nav.go('profile', { id: p.id }, { ...query, tab: t === 'resumen' ? '' : t });
  const unlocked = ACHIEVEMENTS.filter((d) => p.achievements[d.code].tier > 0).length;
  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: 'chart' },
    { id: 'partidas', label: 'Partidas', icon: 'games', count: p.games },
    { id: 'records', label: 'Récords', icon: 'trophyNav', count: p.recordsHeld.length },
    { id: 'logros', label: 'Logros', icon: 'crown', count: unlocked },
  ];
  return html`
    <${ProfileHero} p=${p} mesa=${mesa} />
    <div class="ptabs"><${Tabs} items=${tabs} value=${tab} onChange=${setTab} label="Secciones del perfil" /></div>
    <div class="profile-tools"><${MesaFilter} value=${mesa} onChange=${setMesa} /></div>
    <${MesaNotice} value=${mesa} onClear=${() => setMesa(null)}>${mesa && tab === 'logros' ? 'vista calculada: los logros oficiales no cambian' : `${p.games} ${p.games === 1 ? 'partida' : 'partidas'} de ${p.name}`}</${MesaNotice}>
    ${p.games === 0
      ? html`<${Empty} icon="players" title=${`${p.name} no jugó partidas de ${mesa} jugadores`}
          action=${html`<${Button} onClick=${() => setMesa(null)}>Ver todas las mesas</${Button}>`}>Probá con otro tamaño de mesa.</${Empty}>`
      : html`${tab === 'resumen' && html`<${Summary} p=${p} model=${model} mesa=${mesa} />`}
        ${tab === 'partidas' && html`<${History} p=${p} />`}
        ${tab === 'records' && html`<${RecordsHeld} p=${p} model=${model} />`}
        ${tab === 'logros' && html`<${AchievementsTab} p=${p} />`}`}
  `;
}
