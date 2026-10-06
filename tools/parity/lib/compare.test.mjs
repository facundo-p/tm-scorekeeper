import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { compareFrame, compareStyles, pixelLimit } from './compare.mjs';

function png(w, h, paint = () => [0, 0, 0, 255]) {
  const img = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) img.data.set(paint(x, y), (y * w + x) * 4);
  return PNG.sync.write(img);
}

test('identical frames have 0 % difference', () => {
  const a = png(20, 10);
  const res = compareFrame({ png: a, planet: null }, { png: a, planet: null });
  assert.equal(res.pixels, 0);
  assert.equal(res.planet.pct, 0);
});

test('differences inside the planet rect are excluded from the pixel metric', () => {
  const a = png(20, 10);
  const b = png(20, 10, (x) => (x < 10 ? [255, 255, 255, 255] : [0, 0, 0, 255]));
  const rect = { x: 0, y: 0, w: 10, h: 10 };
  const res = compareFrame({ png: a, planet: rect }, { png: b, planet: rect });
  assert.equal(res.pixels, 0);
  assert.equal(res.planet.pct, 100);
});

test('planet missing on one side is reported', () => {
  const a = png(4, 4);
  const res = compareFrame({ png: a, planet: { x: 0, y: 0, w: 2, h: 2 } }, { png: a, planet: null });
  assert.deepEqual(res.planet.present, { ref: true, cand: false });
});

test('different capture sizes are an error', () => {
  assert.ok(compareFrame({ png: png(4, 4) }, { png: png(5, 4) }).error);
});

test('pixel limits by mode and viewport, with override', () => {
  assert.equal(pixelLimit('desktop', 'candidate'), 0.3);
  assert.equal(pixelLimit('mobile', 'candidate'), 0.5);
  assert.equal(pixelLimit('mobile', 'self'), 0.01);
  assert.equal(pixelLimit('desktop', 'candidate', 1), 1);
});

test('styles: px values within 0.5 px are equal, others are reported', () => {
  const ref = { title: { 'font-size': '16px', color: 'rgb(1, 2, 3)', 'padding-top': '4px' } };
  const cand = { title: { 'font-size': '16.4px', color: 'rgb(1, 2, 4)', 'padding-top': '5px' } };
  assert.deepEqual(compareStyles(ref, cand).map((d) => d.prop), ['color', 'padding-top']);
});
