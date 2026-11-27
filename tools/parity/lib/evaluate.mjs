// Convierte las capturas de los dos lados en métricas y fallas para un escenario × viewport.
import { THRESHOLDS } from '../config.mjs';
import { compareFrame, compareStyles, pixelLimit } from './compare.mjs';
import { normalizeAriaUrls } from './hrefs.mjs';

const limitOf = (scenario, metric, fallback) => scenario.thresholds?.[metric]?.value ?? fallback;

function frameFailures(i, cmp, limits) {
  const out = [];
  if (cmp.error) return [`frame ${i}: ${cmp.error}`];
  if (cmp.pixels > limits.pixels) out.push(`frame ${i}: ${cmp.pixels.toFixed(3)} % de píxeles distintos (máx. ${limits.pixels} %)`);
  if (!limits.checkPlanet) return out;
  if (cmp.planet.pct > limits.planet) out.push(`frame ${i}: planeta ${cmp.planet.pct.toFixed(2)} % (máx. ${limits.planet} %)`);
  if (cmp.planet.present.ref !== cmp.planet.present.cand) out.push(`frame ${i}: el planeta no está en los dos lados`);
  return out;
}

// `planetFromPhase`: antes de esa fase el planeta (y su rect) no se exige; lo de afuera sí.
export const planetChecked = (scenario, phase) => !scenario.planetFromPhase || phase == null || phase >= scenario.planetFromPhase;

// El mockup enlaza con #hash y la app con rutas: se comparan ya normalizados (hrefs.mjs).
export const normalizeAria = (aria) => Object.fromEntries(Object.entries(aria).map(([k, v]) => [k, normalizeAriaUrls(v)]));
const sameAria = (ref, cand) => JSON.stringify(normalizeAria(ref)) === JSON.stringify(normalizeAria(cand));

function structureFailures(ref, cand, scenario) {
  const out = [];
  const dh = Math.abs(ref.metrics.height - cand.metrics.height);
  if (dh > limitOf(scenario, 'height', THRESHOLDS.heightPx)) out.push(`alto distinto: ${ref.metrics.height} vs ${cand.metrics.height} px`);
  if (ref.totalFrames !== cand.totalFrames) out.push(`cantidad de frames distinta: ${ref.totalFrames} vs ${cand.totalFrames}`);
  if (!sameAria(ref.aria, cand.aria)) out.push('árbol de accesibilidad distinto');
  return out;
}

function hygieneFailures(cand, mode) {
  const out = cand.errors.map((e) => `error: ${e}`);
  if (cand.metrics.width > cand.metrics.clientWidth + 1 || cand.metrics.docOverflow) out.push('desborde horizontal');
  if (mode === 'candidate' && cand.axe.length) out.push(`axe serios/críticos: ${cand.axe.map((v) => v.id).join(', ')}`);
  return out;
}

export function evaluate(scenario, viewport, ref, cand, mode, phase) {
  const limits = { pixels: pixelLimit(viewport, mode, scenario.thresholds?.pixels?.value), planet: limitOf(scenario, 'planet', THRESHOLDS.planet),
    checkPlanet: planetChecked(scenario, phase) };
  const frames = ref.frames.map((f, i) => (cand.frames[i] ? compareFrame(f, cand.frames[i], scenario.masks) : { error: 'falta el frame' }));
  const styles = compareStyles(ref.styles, cand.styles);
  const failures = [
    ...frames.flatMap((cmp, i) => frameFailures(i, cmp, limits)),
    ...structureFailures(ref, cand, scenario),
    ...styles.map((s) => `estilo ${s.probe}.${s.prop}: ${s.ref} vs ${s.cand}`),
    ...hygieneFailures(cand, mode),
  ];
  return { frames, styles, failures, limits };
}
