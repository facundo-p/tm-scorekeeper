import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadScenarios } from './scenarios.mjs';

test('every scenario file loads with unique ids and defaults', () => {
  const all = loadScenarios();
  assert.ok(all.length > 0);
  assert.equal(new Set(all.map((s) => s.id)).size, all.length);
  for (const s of all) assert.ok(s.viewports.length && s.ref && s.cand);
});

test('filters by screen and id', () => {
  assert.ok(loadScenarios({ screens: ['perfil'] }).every((s) => s.screen === 'perfil'));
  assert.deepEqual(loadScenarios({ ids: ['home'] }).map((s) => s.id), ['home']);
});

test('planetFromPhase only waives the planet before that phase', async () => {
  const { planetChecked } = await import('./evaluate.mjs');
  assert.equal(planetChecked({ planetFromPhase: 27 }, 26), false);
  assert.equal(planetChecked({ planetFromPhase: 27 }, 27), true);
  assert.equal(planetChecked({}, 26), true);
});
