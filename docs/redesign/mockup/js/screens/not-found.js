// 404: a hash that doesn't match any screen.
import { html } from '../lib.js';
import { hrefOf } from '../router.js';
import { Icon } from '../ui/icons.js';

export function NotFound() {
  return html`<section class="notfound reveal" aria-labelledby="nf-title">
    <span class="notfound__code" aria-hidden="true">404</span>
    <h1 class="notfound__title" id="nf-title">Esta coordenada no está en el archivo</h1>
    <p class="muted">La página que buscás no existe o cambió de lugar. Las partidas, el ranking y los récords siguen donde siempre.</p>
    <a class="btn btn--primary btn--m notfound__go" href=${hrefOf('home')}><${Icon} name="home" size=${18} /><span class="btn__label">Volver al inicio</span></a>
  </section>`;
}
