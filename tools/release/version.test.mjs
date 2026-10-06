import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bumpVersion, checkVersions, isGreater, parseVersion, readVersions } from './version.mjs';

// Un repo mínimo con los cuatro archivos en la misma versión.
function fakeRepo(v = '1.0.0') {
  const root = mkdtempSync(join(tmpdir(), 'release-'));
  mkdirSync(join(root, 'frontend'));
  mkdirSync(join(root, 'backend'));
  writeFileSync(join(root, 'VERSION'), `${v}\n`);
  writeFileSync(join(root, 'frontend/package.json'), `${JSON.stringify({ name: 'x', version: v, private: true }, null, 2)}\n`);
  const lock = { name: 'x', version: v, lockfileVersion: 3, packages: { '': { name: 'x', version: v }, 'node_modules/a': { version: '9.9.9' } } };
  writeFileSync(join(root, 'frontend/package-lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
  writeFileSync(join(root, 'backend/version.py'), `"""Versión."""\n\n__version__ = "${v}"\n`);
  return root;
}

test('parseVersion acepta X.Y.Z y rechaza el resto', () => {
  assert.deepEqual(parseVersion('2.10.3'), [2, 10, 3]);
  for (const bad of ['2.0', 'v2.0.0', '2.0.0-rc1', '', undefined]) assert.throws(() => parseVersion(bad), /no es una versión/);
});

test('isGreater compara numéricamente, no como texto', () => {
  assert.ok(isGreater('1.10.0', '1.9.0'));
  assert.ok(isGreater('2.0.0', '1.99.99'));
  assert.ok(!isGreater('1.0.0', '1.0.0'));
  assert.ok(!isGreater('1.0.0', '1.0.1'));
});

test('bump escribe la versión en los cuatro archivos y --check queda en verde', () => {
  const root = fakeRepo('1.0.0');
  assert.deepEqual(bumpVersion(root, '2.0.0'), { from: '1.0.0', to: '2.0.0' });
  assert.deepEqual(new Set(Object.values(readVersions(root))), new Set(['2.0.0']));
  assert.deepEqual(checkVersions(root), []);
});

test('bump no toca nada más que la versión', () => {
  const root = fakeRepo('1.0.0');
  bumpVersion(root, '1.1.0');
  const lock = JSON.parse(readFileSync(join(root, 'frontend/package-lock.json'), 'utf8'));
  assert.equal(lock.packages['node_modules/a'].version, '9.9.9');
  assert.equal(readFileSync(join(root, 'backend/version.py'), 'utf8'), '"""Versión."""\n\n__version__ = "1.1.0"\n');
  assert.match(readFileSync(join(root, 'frontend/package.json'), 'utf8'), /^\{\n {2}"name": "x",\n {2}"version": "1.1.0",/);
});

test('bump rechaza una versión igual, menor o mal escrita sin escribir nada', () => {
  const root = fakeRepo('2.0.0');
  for (const bad of ['2.0.0', '1.9.9', 'dos']) assert.throws(() => bumpVersion(root, bad));
  assert.deepEqual(checkVersions(root), []);
  assert.equal(readVersions(root).VERSION, '2.0.0');
});

test('--check nombra cada archivo desajustado', () => {
  const root = fakeRepo('1.0.0');
  writeFileSync(join(root, 'backend/version.py'), '__version__ = "0.9.0"\n');
  const lock = JSON.parse(readFileSync(join(root, 'frontend/package-lock.json'), 'utf8'));
  lock.packages[''].version = '0.1.0';
  writeFileSync(join(root, 'frontend/package-lock.json'), JSON.stringify(lock));
  const failures = checkVersions(root);
  assert.equal(failures.length, 2);
  assert.match(failures.join('\n'), /backend\/version\.py tiene 0\.9\.0/);
  assert.match(failures.join('\n'), /package-lock\.json tiene 1\.0\.0 \/ 0\.1\.0/);
});

test('--check detecta un version.py sin __version__', () => {
  const root = fakeRepo('1.0.0');
  writeFileSync(join(root, 'backend/version.py'), '# vacío\n');
  assert.match(checkVersions(root).join(), /\(sin versión\)/);
});
