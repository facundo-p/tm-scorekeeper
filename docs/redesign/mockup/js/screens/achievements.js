import { html, useState, cls } from '../lib.js';
import { MODEL } from '../data/derive.js';
import { TIER_MATERIALS } from '../data/catalog.js';
import { Icon } from '../ui/icons.js';
import { Cube, PlayerTag, Medal, TierPips, fmtDate } from '../ui/atoms.js';
import { Sheet } from '../ui/sheet.js';
import { TrophyNav } from './records.js';

const P = (id) => MODEL.playerById[id];
const active = () => MODEL.players.filter((p) => p.active && p.games);

function MaterialStrip() {
  return html`<ol class="materials" aria-label="Materiales por nivel">
    ${TIER_MATERIALS.map((m) => html`<li><${Medal} glyph="trophy" tier=${m.level} size="s" /><span><b>Nivel ${m.level}</b>${m.name}</span></li>`)}
  </ol>`;
}

function PlayerPicker({ value, onChange }) {
  return html`<div class="fgroup ach-picker" role="group" aria-label="Ver progreso de">
    <span class="fgroup__label">Ver progreso de</span>
    <div class="fchips">
      <button type="button" class=${cls('fchip', !value && 'is-on')} aria-pressed=${!value} onClick=${() => onChange(null)}>Todo el grupo</button>
      ${active().map((p) => html`<button type="button" class=${cls('fchip fchip--cube', value === p.id && 'is-on')} aria-pressed=${value === p.id}
        onClick=${() => onChange(p.id)}><${Cube} color=${p.color} size=${14} />${p.name}</button>`)}
    </div>
  </div>`;
}

function Tile({ a, who, onOpen, i }) {
  const mine = who ? P(who).achievements[a.code] : null;
  const tier = who ? mine.tier : Math.max(0, ...a.holders.map((h) => h.tier));
  const title = (a.tiers.find((t) => t.level === tier) ?? a.tiers[0]).title;
  const holders = a.holders;
  return html`<li class="reveal" style=${`--i:${Math.min(i + 3, 10)}`}>
    <button type="button" class=${cls('mtile', !tier && 'is-locked')} onClick=${() => onOpen(a)}>
      <${Medal} glyph=${a.glyph} tier=${tier} size="m" single=${a.tiers.length === 1} />
      <span class="mtile__title">${title}</span>
      <span class="mtile__desc">${a.description}</span>
      ${a.tiers.length > 1 ? html`<${TierPips} tier=${tier} max=${a.tiers.length} />` : html`<span class="mtile__single">Logro único</span>`}
      ${who && mine.progress && html`<span class="mtile__prog"><span class="pach__bar"><i style=${`--p:${((mine.progress.current / mine.progress.target) * 100).toFixed(0)}`}></i></span>
        <small>${mine.progress.current}/${mine.progress.target}</small></span>`}
      ${!who && html`<span class="mtile__holders">
        ${holders.slice(0, 5).map((h) => html`<${Cube} color=${P(h.player_id).color} size=${13} />`)}
        <small>${holders.length ? `${holders.length} ${holders.length === 1 ? 'jugador' : 'jugadores'}` : 'Nadie todavía'}</small></span>`}
    </button>
  </li>`;
}

function Detail({ a, who, onClose }) {
  const top = Math.max(0, ...a.holders.map((h) => h.tier));
  const mine = who ? P(who).achievements[a.code] : null;
  return html`<${Sheet} title=${a.tiers.length > 1 ? a.tiers[a.tiers.length - 1].title : a.tiers[0].title} onClose=${onClose} wide>
    <div class="adetail">
      <div class="adetail__hero">
        <${Medal} glyph=${a.glyph} tier=${who ? mine.tier : top} size="l" single=${a.tiers.length === 1} />
        <div>
          <p class="adetail__desc">${a.description}</p>
          <p class="flavor">«${a.flavor}»</p>
        </div>
      </div>
      <ol class="ladder">
        ${a.tiers.map((t) => {
          const at = a.holders.filter((h) => h.tier === t.level);
          const reached = who ? mine.tier >= t.level : a.holders.some((h) => h.tier >= t.level);
          const mat = TIER_MATERIALS[t.level - 1];
          return html`<li class=${cls('ladder__row', reached && 'is-reached')}>
            <span class=${`ladder__mat mat--${mat.token}`}>${t.level}</span>
            <div class="ladder__text"><b>${t.title}</b><span class="faint">${a.kind === 'flag' ? 'Lograrlo una vez' : `Umbral: ${t.threshold}`} (${mat.name})</span></div>
            <div class="ladder__who">
              ${at.length ? at.map((h) => html`<${PlayerTag} player=${P(h.player_id)} size="s" sub=${fmtDate(h.unlockedAt, { short: true })} />`)
                : html`<span class="faint">${reached ? '' : 'Nadie en este nivel'}</span>`}
            </div>
          </li>`;
        })}
      </ol>
      ${who && mine.progress && html`<p class="adetail__prog"><${Cube} color=${P(who).color} size=${14} />
        ${P(who).name} va ${mine.progress.current} de ${mine.progress.target} para el siguiente nivel.</p>`}
    </div>
  </${Sheet}>`;
}

export function Achievements() {
  const [who, setWho] = useState(null);
  const [open, setOpen] = useState(null);
  const current = MODEL.achievements;
  const unlocked = who ? current.filter((a) => P(who).achievements[a.code].tier > 0).length : null;
  return html`
    <${TrophyNav} current="achievements" />
    <header class="screen-head reveal" style="--i:0">
      <div>
        <h1 class="screen-head__title">Logros</h1>
        <p class="screen-head__sub">Cada nivel cambia el material de la medalla y queda fechado con la partida que lo alcanzó. Si se corrige o se borra una partida, los niveles se recalculan.</p>
      </div>
    </header>
    <div class="reveal ach-tools" style="--i:1">
      <${MaterialStrip} />
      <${PlayerPicker} value=${who} onChange=${setWho} />
      ${who && html`<p class="ach-count"><${Cube} color=${P(who).color} size=${14} /><b>${P(who).name}</b> tiene ${unlocked} de ${current.length} logros.</p>`}
    </div>
    <ul class="mgrid">${current.map((a, i) => html`<${Tile} key=${a.code} a=${a} who=${who} onOpen=${setOpen} i=${i} />`)}</ul>
    ${open && html`<${Detail} a=${open} who=${who} onClose=${() => setOpen(null)} />`}
  `;
}
