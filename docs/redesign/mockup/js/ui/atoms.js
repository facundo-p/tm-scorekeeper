// Shared building blocks. Dynamic values reach CSS only through custom properties
// (--hue, --pct...), never as inline visual styling.
import { html, cls, useEffect, useRef, useState, fmt, reducedMotion } from '../lib.js';
import { Icon, MapGlyph } from './icons.js';
import { CORP_BY_NAME, MAPS, EXPANSIONS, corpLabel, TIER_MATERIALS } from '../data/catalog.js';
import { useNav } from '../router.js';

export function Cube({ color = 'gris', size = 16, label }) {
  return html`<svg class=${`cube cube--${color}`} width=${size} height=${size} viewBox="0 0 20 20"
    role=${label ? 'img' : null} aria-label=${label ?? null} aria-hidden=${label ? null : 'true'}>
    <path class="cube__top" d="M10 2.2l7 3.9-7 3.9-7-3.9z"/>
    <path class="cube__left" d="M3 6.1l7 3.9v8L3 14.1z"/>
    <path class="cube__right" d="M17 6.1l-7 3.9v8l7-3.9z"/>
  </svg>`;
}

export function PlayerTag({ player, size = 'm', sub, link = true }) {
  const nav = useNav();
  if (!player) return null;
  const body = html`<${Cube} color=${player.color} size=${size === 'l' ? 22 : size === 's' ? 13 : 16} />
    <span class="ptag__name">${player.name}</span>
    ${sub != null && html`<span class="ptag__sub">${sub}</span>`}`;
  if (!link) return html`<span class=${`ptag ptag--${size}`}>${body}</span>`;
  return html`<button type="button" class=${`ptag ptag--${size} ptag--link`} onClick=${() => nav.go('profile', { id: player.id })}>${body}</button>`;
}

export function CorpEmblem({ name, size = 'm', withName = false }) {
  const c = CORP_BY_NAME[name];
  if (!c) return null;
  return html`<span class=${`corp corp--${size}`} style=${`--hue:${c.hue}`} title=${name}>
    <span class="corp__mark" aria-hidden="true">${c.short}</span>
    ${withName && html`<span class="corp__name">${corpLabel(name)}</span>`}
    ${!withName && html`<span class="vh">${name}</span>`}
  </span>`;
}

export function MapBadge({ map, size = 22, withName = true }) {
  const m = MAPS[map];
  return html`<span class="mapbadge">
    <${MapGlyph} glyph=${m?.glyph} size=${size} label=${withName ? null : map} />
    ${withName && html`<span class="mapbadge__name">${map}</span>`}
  </span>`;
}

export function ExpansionTags({ expansions, draft }) {
  return html`<span class="exptags">
    ${expansions.map((e) => html`<span class="exptag" title=${EXPANSIONS[e].label}>
      <${Icon} name=${EXPANSIONS[e].glyph} size=${15} /><span class="vh">${EXPANSIONS[e].label}</span>
      <span class="exptag__letter" aria-hidden="true">${EXPANSIONS[e].short}</span></span>`)}
    ${draft && html`<span class="exptag exptag--draft" title="Draft"><${Icon} name="draft" size=${15} /><span class="vh">Draft</span></span>`}
  </span>`;
}

export function Button({ variant = 'secondary', size = 'm', icon, iconRight, children, onClick, type = 'button', disabled, label, full, pressed }) {
  return html`<button type=${type} class=${cls('btn', `btn--${variant}`, `btn--${size}`, full && 'btn--full', !children && 'btn--icon')}
    onClick=${onClick} disabled=${disabled} aria-label=${label ?? null} aria-pressed=${pressed ?? null}>
    ${icon && html`<${Icon} name=${icon} size=${size === 's' ? 16 : 18} />`}
    ${children && html`<span class="btn__label">${children}</span>`}
    ${iconRight && html`<${Icon} name=${iconRight} size=${16} />`}
  </button>`;
}

export function Plate({ as = 'section', class: className, children, tone, label, id, cut }) {
  const Tag = as;
  return html`<${Tag} class=${cls('plate', tone && `plate--${tone}`, cut && `plate--cut-${cut}`, className)} data-sheen aria-label=${label ?? null} id=${id ?? null}>${children}</${Tag}>`;
}

export function SectionHead({ title, children, level = 2, id }) {
  const H = `h${level}`;
  return html`<header class="shead">
    <${H} class="shead__title" id=${id ?? null}>${title}</${H}>
    ${children && html`<div class="shead__aside">${children}</div>`}
  </header>`;
}

export function Delta({ value, size = 'm' }) {
  if (value == null) return html`<span class="delta delta--none">—</span>`;
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const glyph = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '■';
  return html`<span class=${`delta delta--${dir} delta--${size}`}>
    <span aria-hidden="true" class="delta__glyph">${glyph}</span>${fmt.signed(value)}</span>`;
}

export function Tabs({ items, value, onChange, label }) {
  const refs = useRef([]);
  const onKey = (e, i) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + items.length) % items.length;
    onChange(items[next].id);
    refs.current[next]?.focus();
  };
  return html`<div class="tabs" role="tablist" aria-label=${label}>
    ${items.map((t, i) => html`<button type="button" role="tab" class=${cls('tabs__tab', t.id === value && 'is-on')}
      aria-selected=${t.id === value} tabindex=${t.id === value ? 0 : -1} ref=${(el) => { refs.current[i] = el; }}
      onClick=${() => onChange(t.id)} onKeyDown=${(e) => onKey(e, i)}>
      ${t.icon && html`<${Icon} name=${t.icon} size=${16} />`}<span>${t.label}</span>
      ${t.count != null && html`<span class="tabs__count">${t.count}</span>`}
    </button>`)}
  </div>`;
}

export function Chip({ children, icon, tone, title }) {
  return html`<span class=${cls('chip', tone && `chip--${tone}`)} title=${title ?? null}>
    ${icon && html`<${Icon} name=${icon} size=${14} />`}${children}</span>`;
}

export function NewBadge({ children = 'Nuevo' }) {
  return html`<span class="newbadge" title="Nuevo en v2.0">${children}</span>`;
}

export function useCountUp(target, { duration = 900, delay = 0, from = 0 } = {}) {
  const [v, setV] = useState(reducedMotion() ? target : from);
  useEffect(() => {
    if (reducedMotion()) { setV(target); return undefined; }
    let raf = 0;
    let t0 = 0;
    const tick = (now) => {
      if (!t0) t0 = now + delay;
      const p = Math.min(1, Math.max(0, (now - t0) / duration));
      const e = 1 - (1 - p) ** 3;
      setV(from + (target - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

export function CountUp({ value, duration, delay, decimals = 0, from }) {
  const v = useCountUp(value, { duration, delay, from });
  return html`<span class="countup">${decimals ? fmt.dec(v, decimals) : fmt.int(v)}</span>`;
}

// Pointer tilt with a specular glare that follows the cursor (medals, plaques).
export function useTilt(max = 10) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || matchMedia('(hover: none)').matches) return undefined;
    let raf = 0;
    const move = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
        el.classList.add('is-tilting');
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, []);
  return ref;
}

export function TierPips({ tier, max }) {
  return html`<span class="pips" role="img" aria-label=${`Nivel ${tier} de ${max}`}>
    ${Array.from({ length: max }, (_, i) => html`<i class=${cls('pip', i < tier && `pip--on pip--t${i + 1}`)}></i>`)}
  </span>`;
}

export function Medal({ glyph, tier = 0, size = 'm', locked, label, single }) {
  const mat = TIER_MATERIALS[single && tier ? 2 : Math.max(0, tier - 1)];
  const ref = useTilt(14);
  return html`<span ref=${ref} class=${cls('medal', `medal--${size}`, locked || !tier ? 'medal--locked' : `medal--${mat.token}`)}
    role=${label ? 'img' : null} aria-label=${label ?? null}>
    <svg class="medal__hex" viewBox="0 0 100 100" aria-hidden="true">
      <path class="medal__rim" d="M50 3l40.7 23.5v47L50 97 9.3 73.5v-47z"/>
      <path class="medal__face" d="M50 11l33.8 19.5v39L50 89 16.2 69.5v-39z"/>
      <path class="medal__bevel" d="M50 11l33.8 19.5v39L50 89"/>
    </svg>
    <span class="medal__glyph"><${Icon} name=${glyph} size=${size === 'l' ? 40 : size === 's' ? 18 : 28} /></span>
    <span class="medal__glare" aria-hidden="true"></span>
  </span>`;
}

export function Empty({ icon = 'search', title, children, action }) {
  return html`<div class="empty">
    <span class="empty__icon"><${Icon} name=${icon} size=${26} /></span>
    <p class="empty__title">${title}</p>
    ${children && html`<p class="empty__body">${children}</p>`}
    ${action}
  </div>`;
}

export function Readout({ label, value, sub, icon, accent }) {
  return html`<div class=${cls('readout', accent && 'readout--accent')}>
    <span class="readout__label">${icon && html`<${Icon} name=${icon} size=${15} />`}${label}</span>
    <span class="readout__value">${value}</span>
    ${sub && html`<span class="readout__sub">${sub}</span>`}
  </div>`;
}

export function fmtDate(iso, opts = {}) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: opts.short ? 'short' : 'long', year: opts.year === false ? undefined : 'numeric' });
}
