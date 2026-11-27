// Métricas por frame y por escenario, contra los umbrales (SPEC v2.0 §7).
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { PIXELMATCH, THRESHOLDS } from '../config.mjs';

const MASK = [255, 0, 255, 255];

function paintRect(img, rect) {
  if (!rect) return;
  const x0 = Math.max(0, Math.floor(rect.x));
  const y0 = Math.max(0, Math.floor(rect.y));
  const x1 = Math.min(img.width, Math.ceil(rect.x + rect.w));
  const y1 = Math.min(img.height, Math.ceil(rect.y + rect.h));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) img.data.set(MASK, (y * img.width + x) * 4);
  }
}

function crop(img, rect) {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const w = Math.max(0, Math.min(img.width, Math.ceil(rect.x + rect.w)) - x);
  const h = Math.max(0, Math.min(img.height, Math.ceil(rect.y + rect.h)) - y);
  const out = new PNG({ width: w, height: h });
  if (w && h) PNG.bitblt(img, out, x, y, w, h, 0, 0);
  return out;
}

function diffPct(a, b) {
  const diff = new PNG({ width: a.width, height: a.height });
  const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, PIXELMATCH);
  return { pct: (100 * n) / Math.max(1, a.width * a.height), diff };
}

// Planeta: % de diferencia dentro de la unión de los dos rects.
function planetDiff(refImg, candImg, refRect, candRect) {
  if (!refRect && !candRect) return { pct: 0, present: { ref: false, cand: false } };
  const a = crop(refImg, union(refRect, candRect));
  const b = crop(candImg, union(refRect, candRect));
  const pct = a.width && a.height ? diffPct(a, b).pct : 0;
  return { pct, present: { ref: !!refRect, cand: !!candRect } };
}

function union(a, b) {
  if (!a || !b) return a ?? b;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

export function compareFrame(refFrame, candFrame, masks = []) {
  const ref = PNG.sync.read(refFrame.png);
  const cand = PNG.sync.read(candFrame.png);
  if (ref.width !== cand.width || ref.height !== cand.height) return { error: 'tamaño de captura distinto' };
  const planet = planetDiff(ref, cand, refFrame.planet, candFrame.planet);
  for (const rect of [refFrame.planet, candFrame.planet, ...masks]) { paintRect(ref, rect); paintRect(cand, rect); }
  const { pct, diff } = diffPct(ref, cand);
  return { pixels: pct, planet, diffPng: PNG.sync.write(diff) };
}

export function pixelLimit(viewport, mode, override) {
  if (override !== undefined) return override;
  return mode === 'self' ? THRESHOLDS.selfPixels : THRESHOLDS.pixels[viewport];
}

export function compareStyles(ref, cand) {
  const out = [];
  for (const [id, props] of Object.entries(ref)) {
    for (const [prop, value] of Object.entries(props ?? {})) {
      if (!sameStyle(value, cand[id]?.[prop])) out.push({ probe: id, prop, ref: value, cand: cand[id]?.[prop] ?? null });
    }
  }
  return out;
}

function sameStyle(a, b) {
  if (a === b) return true;
  const na = parseFloat(a);
  const nb = parseFloat(b);
  return /px$/.test(a ?? '') && /px$/.test(b ?? '') && Math.abs(na - nb) <= THRESHOLDS.stylePx;
}
