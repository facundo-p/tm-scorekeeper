import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundHalfEven, roundHalfEven1 } from '../../../docs/redesign/mockup/js/data/round.js';

test('half-even like Python round()', () => {
  assert.deepEqual([0.5, 1.5, 2.5, -0.5, -1.5, -2.5, 2.4, 2.6].map(roundHalfEven), [0, 2, 2, 0, -2, -2, 2, 3]);
});

test('one decimal', () => {
  assert.equal(roundHalfEven1(9.25), 9.2);
  assert.equal(roundHalfEven1(106 / 11), 9.6);
});
