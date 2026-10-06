import { html, render } from './lib.js';
import { App } from './app.js';

render(html`<${App} />`, document.getElementById('app'));
