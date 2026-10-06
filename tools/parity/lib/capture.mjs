// Captura de un escenario en un lado: frames de scroll, rect del planeta, alto,
// desbordes, árbol de accesibilidad, estilos de prueba y axe.
import { AxeBuilder } from '@axe-core/playwright';
import { MAX_FRAMES, PROBE_PROPS } from '../config.mjs';
import { planetSettled, twoFrames } from './ready.mjs';

const ROOT_JS = `(document.querySelector('[data-scroll-root]') ?? document.querySelector('.scroller') ?? document.scrollingElement)`;

export const scrollMetrics = (page) => page.evaluate(`(() => { const r = ${ROOT_JS};
  return { height: r.scrollHeight, client: r.clientHeight, width: r.scrollWidth, clientWidth: r.clientWidth,
    docOverflow: document.documentElement.scrollWidth > innerWidth + 1 }; })()`);

// Rect (px de viewport) donde se dibuja el planeta, o null. Usa el gancho del mockup/app
// si existe; si no, lo estima desde el slot activo (margen 1,45 r como el motor).
export const planetRect = (page) => page.evaluate(() => {
  const hook = window.__TM_PLANET__?.drawRect?.();
  if (hook !== undefined) return hook;
  const slots = [...document.querySelectorAll('[data-planet-slot], .planet-slot')].filter((s) => s.offsetWidth > 0);
  const el = slots.pop();
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const rad = Math.min(r.width, r.height) / 2;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const m = rad * 1.45;
  return { x: cx - m, y: cy - m, w: 2 * m, h: 2 * m };
});

async function frameAt(page, index, metrics) {
  const y = Math.min(index * metrics.client, Math.max(0, metrics.height - metrics.client));
  await page.evaluate(`(${ROOT_JS}).scrollTop = ${y}`);
  await twoFrames(page);
  await planetSettled(page);
  await twoFrames(page);
  const png = await page.screenshot({ animations: 'disabled', caret: 'hide' });
  return { png, planet: await planetRect(page) };
}

export async function captureFrames(page, wanted) {
  const metrics = await scrollMetrics(page);
  const total = Math.max(1, Math.ceil(metrics.height / Math.max(1, metrics.client)));
  const count = Math.min(wanted === 'all' || !wanted ? total : Number(wanted), MAX_FRAMES);
  const frames = [];
  for (let i = 0; i < count; i++) frames.push(await frameAt(page, i, metrics));
  await page.evaluate(`(${ROOT_JS}).scrollTop = 0`);
  return { frames, metrics, totalFrames: total };
}

export async function ariaTree(page) {
  const parts = {};
  for (const role of ['main', 'navigation', 'dialog']) {
    const all = page.getByRole(role);
    const n = await all.count();
    for (let i = 0; i < n; i++) {
      if (await all.nth(i).isVisible()) parts[`${role}#${i}`] = await all.nth(i).ariaSnapshot();
    }
  }
  return parts;
}

export async function probeStyles(page, probes = []) {
  const out = {};
  for (const probe of probes) {
    const props = probe.props ?? PROBE_PROPS;
    out[probe.id] = await page.locator(probe.selector).first()
      .evaluate((el, ps) => Object.fromEntries(ps.map((p) => [p, getComputedStyle(el).getPropertyValue(p)])), props)
      .catch(() => null);
  }
  return out;
}

export async function axeSerious(page) {
  const res = await new AxeBuilder({ page }).analyze();
  return res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
}
