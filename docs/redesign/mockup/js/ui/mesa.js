// Table-size filter shared by every screen that has one (owner's point 5): it
// lives in the URL (?mesa=N), and a notice reminds what the screen is showing.
import { html, cls } from '../lib.js';
import { useNav } from '../router.js';
import { TABLE_SIZES } from '../data/derive.js';
import { Icon } from './icons.js';

export const mesaOf = (query = {}) => (TABLE_SIZES.includes(Number(query.mesa)) ? Number(query.mesa) : null);

// Returns [mesa, setMesa] bound to the current route's query.
export function useMesa(query = {}) {
  const nav = useNav();
  const { name, params } = nav.route;
  return [mesaOf(query), (n) => nav.go(name, params, { ...query, mesa: n || '' })];
}

export function MesaFilter({ value, onChange }) {
  return html`<div class="fgroup mesa-filter" role="group" aria-label="Jugadores por partida">
    <span class="fgroup__label">Mesa</span>
    <div class="fchips">
      <button type="button" class=${cls('fchip', !value && 'is-on')} aria-pressed=${!value} onClick=${() => onChange(null)}>Todas</button>
      ${TABLE_SIZES.map((n) => html`<button type="button" class=${cls('fchip', value === n && 'is-on')} aria-pressed=${value === n}
        aria-label=${`Mesas de ${n} jugadores`} onClick=${() => onChange(value === n ? null : n)}>${n}</button>`)}
    </div>
  </div>`;
}

export function MesaNotice({ value, onClear, children }) {
  if (!value) return null;
  return html`<p class="mesa-notice" role="status">
    <${Icon} name="players" size=${16} /><span>Solo partidas de ${value} jugadores${children ? html` · ${children}` : ''}</span>
    <button type="button" class="mesa-notice__clear" onClick=${onClear}>Quitar</button>
  </p>`;
}
