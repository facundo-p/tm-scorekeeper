// Designed loading and error states, shown from the prototype index.
import { html } from '../lib.js';
import { Icon } from './icons.js';
import { Button } from './atoms.js';

export function LoadingState() {
  return html`<div class="state state--loading" role="status" aria-live="polite">
    <div class="state__scan" aria-hidden="true"><span></span></div>
    <p class="state__title">Sincronizando con el archivo</p>
    <p class="state__body">Descargando partidas y recalculando el ranking.</p>
    <div class="skel" aria-hidden="true">
      <span class="skel__plate skel__plate--hero"></span>
      <span class="skel__plate"></span><span class="skel__plate"></span><span class="skel__plate"></span>
    </div>
  </div>`;
}

export function ErrorState({ onRetry }) {
  return html`<div class="state state--error" role="alert">
    <span class="state__icon"><${Icon} name="info" size=${28} /></span>
    <p class="state__title">Se perdió el enlace con el archivo</p>
    <p class="state__body">El servidor no respondió en 15 segundos. Puede estar despertando: los servicios gratuitos se apagan cuando nadie los usa. Reintentá en unos segundos.</p>
    <${Button} variant="primary" icon="generation" onClick=${onRetry}>Reintentar</${Button}>
  </div>`;
}
