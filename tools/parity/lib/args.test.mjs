import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from './args.mjs';
import { isGated } from './scenarios.mjs';

test('defaults to candidate mode', () => {
  assert.deepEqual(parseArgs([]), { mode: 'candidate', phase: 0, concurrency: 2 });
});

test('parses lists and flags', () => {
  const o = parseArgs(['--self', '--phase', '17', '--screens', 'inicio, perfil', '--ref', 'mockup@abc']);
  assert.equal(o.mode, 'self');
  assert.equal(o.phase, 17);
  assert.deepEqual(o.screens, ['inicio', 'perfil']);
  assert.equal(o.ref, 'mockup@abc');
});

test('--gated is a bare flag', () => {
  assert.deepEqual(parseArgs(['--gated', '--phase', '26']), { mode: 'candidate', phase: 26, concurrency: 2, gated: true });
});

test('rejects unknown options', () => {
  assert.throws(() => parseArgs(['--nope', '1']));
});

test('a scenario is gated from its phase on, and always in self mode', () => {
  assert.equal(isGated({ gateFromPhase: 28 }, { mode: 'candidate', phase: 27 }), false);
  assert.equal(isGated({ gateFromPhase: 28 }, { mode: 'candidate', phase: 30 }), true);
  assert.equal(isGated({}, { mode: 'self', phase: 16 }), true);
});
