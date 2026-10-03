// Fairness readings (owner's points 6 and 7): wins against what the table size
// predicts, relative position, and the breakdown by table size.
import { html, cls, fmt } from '../lib.js';
import { Plate, SectionHead } from './atoms.js';

export const TIPS = {
  expected: 'Victorias vs. esperado: victorias menos las que tocarían por azar (1/n en cada mesa de n jugadores). El porcentaje es victorias ÷ esperado.',
  relPos: 'Posición relativa: 100 % es salir siempre primero y 0 % siempre último, sin importar el tamaño de la mesa.',
};

const SIGN = { 1: '+', '-1': '−', 0: '±' };
const signed = (x) => `${SIGN[Math.sign(x)]}${fmt.dec(Math.abs(x))}`;

export function InfoTip({ text }) {
  return html`<button type="button" class="infotip" data-tip=${text} aria-label=${text}>?</button>`;
}

export function VsExpected({ e }) {
  if (e.winsRatio == null) return html`<span class="faint">—</span>`;
  return html`<span class=${cls('vsexp', e.winsVsExpected >= 0.05 ? 'delta--up' : e.winsVsExpected <= -0.05 ? 'delta--down' : 'delta--flat')}>
    <b>${signed(e.winsVsExpected)}</b><small>${fmt.pct(e.winsRatio)}</small></span>`;
}

export const RelPos = ({ e }) => (e.relPos == null ? html`<span class="faint">—</span>` : html`<b>${fmt.pct(e.relPos)}</b>`);

export function ByTablePanel({ p, mesa, children }) {
  const rows = p.byTable.filter((r) => !mesa || r.n === mesa);
  return html`<${Plate} class="reveal bytable" label="Por tamaño de mesa">
    <${SectionHead} title="Por tamaño de mesa">${children}</${SectionHead}>
    <div class="bytable__wrap" tabindex="0" role="region" aria-label=${`Tabla por tamaño de mesa de ${p.name}`}><table class="bytable__t">
      <caption class="vh">Rendimiento de ${p.name} por cantidad de jugadores</caption>
      <thead><tr><th scope="col">Mesa</th><th scope="col" class="n">Partidas</th><th scope="col" class="n">Victorias</th>
        <th scope="col" class="n">Vs. esperado <${InfoTip} text=${TIPS.expected} /></th><th scope="col" class="n">Promedio</th>
        <th scope="col" class="n">Posición relativa <${InfoTip} text=${TIPS.relPos} /></th></tr></thead>
      <tbody>${rows.map((r) => html`<tr class=${cls(!r.games && 'is-empty')}>
        <th scope="row">${r.n} jugadores</th><td class="n">${r.games}</td><td class="n">${r.wins}</td>
        <td class="n"><${VsExpected} e=${r} /></td><td class="n">${r.avgPoints ?? '—'}</td><td class="n"><${RelPos} e=${r} /></td>
      </tr>`)}</tbody>
    </table></div>
  </${Plate}>`;
}
