import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertDisposableDatabase, databaseName } from './dbguard.mjs';

test('accepts parity and test databases', () => {
  assert.equal(assertDisposableDatabase('postgresql://u:p@localhost:5432/tm_parity'), 'tm_parity');
  assert.equal(assertDisposableDatabase('postgresql://u:p@h/x_test?sslmode=require'), 'x_test');
});

test('refuses any other database, a missing name or an invalid url', () => {
  for (const url of ['postgresql://u:p@h/tm_scorekeeper', 'postgresql://u:p@h/parity_prod', 'postgresql://u:p@h/', 'nope']) {
    assert.throws(() => assertDisposableDatabase(url));
  }
});

test('reads the database name', () => {
  assert.equal(databaseName('postgresql://u:p@h:1/db_name'), 'db_name');
});
