// Chromium congelado: mismos flags, viewport, reloj, idioma y zona horaria en los dos lados.
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { CHROMIUM_ARGS, FROZEN, VIEWPORTS } from '../config.mjs';

function chromiumPath() {
  if (process.env.PARITY_CHROMIUM) return process.env.PARITY_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  const dirs = existsSync(base) ? readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)) : [];
  const dir = dirs.sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1])).pop();
  return dir ? resolve(base, dir, 'chrome-linux/chrome') : undefined;
}

export function launch() {
  return chromium.launch({ executablePath: chromiumPath(), args: CHROMIUM_ARGS });
}

export async function newPage(browser, viewportName, side, scenario) {
  const { width, height, isMobile, hasTouch } = VIEWPORTS[viewportName];
  const context = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: 1, isMobile, hasTouch,
    locale: FROZEN.locale, timezoneId: FROZEN.timezoneId, reducedMotion: FROZEN.reducedMotion, colorScheme: 'dark',
  });
  await blockExternal(context, side);
  await side.prepare?.(context, scenario);
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date(FROZEN.time));
  const log = watchConsole(page, scenario?.expectStatus ?? []);
  page.parityLog = log;
  return { context, page, log };
}

// Todo lo que no sea el servidor local queda bloqueado (las rutas específicas de cada lado ganan).
async function blockExternal(context, side) {
  await context.route((url) => !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url.href), (route) => {
    side.blocked?.push(route.request().url());
    return route.abort();
  });
}

// Un recurso que responde con un estado esperado por el escenario (por ejemplo, el 401 de un login
// equivocado) no es un error: Chromium lo anota en la consola igual.
export const expectedResource = (text, statuses) =>
  statuses.some((code) => text.includes(`Failed to load resource: the server responded with a status of ${code} `));

function watchConsole(page, expectStatus) {
  const log = { errors: [], inflight: 0, lastNetwork: Date.now() };
  const done = () => { log.inflight = Math.max(0, log.inflight - 1); log.lastNetwork = Date.now(); };
  page.on('request', () => { log.inflight += 1; log.lastNetwork = Date.now(); });
  page.on('requestfinished', done);
  page.on('requestfailed', done);
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !expectedResource(msg.text(), expectStatus)) log.errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => log.errors.push(`page: ${err.message}`));
  return log;
}
