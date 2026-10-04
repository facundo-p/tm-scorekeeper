import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBudgets, initialKeys } from './budget.mjs';

const manifest = {
  'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_vendor.js'], dynamicImports: ['src/fx/planet/stage.ts', 'src/screens/Home.tsx'] },
  '_vendor.js': { file: 'assets/vendor.js' },
  'src/fx/planet/stage.ts': { file: 'assets/stage.js', isDynamicEntry: true, imports: ['index.html'] },
  'src/screens/Home.tsx': { file: 'assets/Home.js', isDynamicEntry: true, imports: ['index.html', '_vendor.js'] },
};
const sizes = { 'assets/index.js': 60_000, 'assets/vendor.js': 30_000, 'assets/stage.js': 9_000, 'assets/Home.js': 7_000 };
const gzip = (f) => sizes[f];

test('el JS inicial es la entrada y sus imports estáticos, sin los import()', () => {
  assert.deepEqual(initialKeys(manifest).sort(), ['_vendor.js', 'index.html']);
  const { initialKb, failures } = checkBudgets(manifest, gzip);
  assert.equal(initialKb, 90);
  assert.deepEqual(failures, []);
});

test('pasar el máximo falla con el tamaño', () => {
  const { failures } = checkBudgets(manifest, gzip, { maxKb: 80 });
  assert.match(failures[0], /90\.00 kB gzip > 80 kB/);
});

test('el planeta tiene que estar en un chunk aparte, fuera del JS inicial', () => {
  const inlined = { ...manifest, 'index.html': { ...manifest['index.html'], imports: ['_vendor.js', 'src/fx/planet/stage.ts'] } };
  assert.match(checkBudgets(inlined, gzip).failures.join(), /quedó en el JS inicial/);
  const { 'src/fx/planet/stage.ts': _, ...missing } = manifest;
  assert.match(checkBudgets(missing, gzip).failures.join(), /no tiene chunk propio/);
});

test('el manifiesto tiene que tener una sola entrada', () => {
  assert.throws(() => initialKeys({ a: { file: 'a.js' } }), /una entrada/);
});
