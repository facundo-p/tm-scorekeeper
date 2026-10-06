// Una captura está lista cuando: fuentes cargadas, planeta listo (o respaldo),
// red en reposo, 2 frames y ningún aria-busy.
import { READY_TIMEOUT_MS } from '../config.mjs';

export const twoFrames = (page) => page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));

async function planetReady(page, mode) {
  if (mode === 'none') return;
  await page.waitForFunction(() => ['ready', 'fallback'].includes(document.documentElement.dataset.planet), null,
    { timeout: READY_TIMEOUT_MS });
  await planetSettled(page);
}

// Con reduced-motion el planeta es una imagen fija: esperar a que muestre su destino actual.
export async function planetSettled(page) {
  await page.waitForFunction(() => !window.__TM_PLANET__?.settled || window.__TM_PLANET__.settled(), null,
    { timeout: READY_TIMEOUT_MS });
}

// Red en reposo: ningún request en vuelo durante 500 ms (contador propio, más estable
// que el evento networkidle cuando la CPU está cargada por SwiftShader).
async function networkIdle(page, quietMs = 500) {
  const log = page.parityLog;
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (!(log.inflight === 0 && Date.now() - log.lastNetwork >= quietMs)) {
    if (Date.now() > deadline) throw new Error(`red sin reposo: ${log.inflight} requests en vuelo`);
    await new Promise((ok) => setTimeout(ok, 100));
  }
}

// Finite animations (1 ms under reduced motion) must have run: one still pending
// keeps its `from` keyframe (a sheet at opacity 0, for instance).
async function animationsDone(page) {
  await page.evaluate(() => Promise.race([
    Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))),
    new Promise((ok) => setTimeout(ok, 5000)),
  ]));
}

export async function waitReady(page, { planet = 'required' } = {}) {
  await page.evaluate(() => document.fonts.ready);
  await planetReady(page, planet);
  await networkIdle(page);
  await twoFrames(page);
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: READY_TIMEOUT_MS });
  await animationsDone(page);
  await twoFrames(page);
}
