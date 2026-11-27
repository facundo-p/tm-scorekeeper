#!/usr/bin/env node
// Regenerates docs/redesign/screens/*.jpg from the mockup with the frozen
// comparison setup (same clock, fonts and reduced motion as tools/parity).
import { resolve } from 'node:path';
import { ROOT } from './config.mjs';
import { launch, newPage } from './lib/browser.mjs';
import { waitReady } from './lib/ready.mjs';
import { startReference } from './serve/reference.mjs';

const OUT = resolve(ROOT, 'docs/redesign/screens');
// [file suffix, hash, search, viewports]
const SHOTS = [
  ['01-acceso', '#acceso', '', ['escritorio', 'movil']],
  ['02-inicio', '#inicio', '', ['escritorio', 'movil']],
  ['03-partidas', '#partidas', '', ['escritorio', 'movil']],
  ['04-informe', '#partida-g-063', '', ['escritorio', 'movil']],
  ['05-registrar-partida', '#registrar', '', ['escritorio']],
  ['06-registrar-hitos', '#registrar', '?step=2', ['escritorio']],
  ['07-registrar-puntaje', '#registrar', '?step=3', ['escritorio', 'movil']],
  ['08-ceremonia', '#ceremonia-g-063', '', ['escritorio', 'movil']],
  ['09-ranking', '#ranking', '', ['escritorio', 'movil']],
  ['10-perfil', '#jugador-p-facu', '', ['escritorio', 'movil']],
  ['11-records', '#records', '', ['escritorio', 'movil']],
  ['12-logros', '#logros', '', ['escritorio', 'movil']],
];
const VIEWPORT = { escritorio: 'desktop', movil: 'mobile' };

async function shot(browser, ref, [name, hash, search], device) {
  const { context, page } = await newPage(browser, VIEWPORT[device], ref, {});
  try {
    await page.goto(ref.url({ ref: { hash, search } }));
    await page.addStyleTag({ content: ref.styles });
    await waitReady(page, {});
    await page.screenshot({ path: resolve(OUT, `${device}-${name}.jpg`), type: 'jpeg', quality: 82, animations: 'disabled', caret: 'hide' });
  } finally {
    await context.close();
  }
}

const ref = await startReference();
const browser = await launch();
for (const s of SHOTS) for (const device of s[3]) await shot(browser, ref, s, device);
await browser.close();
await ref.close();
console.log(`capturas en ${OUT}`);
