// Versión del proyecto: `VERSION` es la fuente única y se copia a frontend y backend.
// Lo usan bump.mjs (el skill /release y CI con --check) y sus tests.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const PY_VERSION = /^__version__ = "([^"]*)"$/m;

// Cada destino sabe leer y escribir la versión en su archivo.
const json = (get, set) => ({
  read: (text) => get(JSON.parse(text)),
  write: (text, v) => { const data = JSON.parse(text); set(data, v); return `${JSON.stringify(data, null, 2)}\n`; },
});

export const TARGETS = {
  'VERSION': { read: (text) => text.trim(), write: (_, v) => `${v}\n` },
  'frontend/package.json': json((d) => d.version, (d, v) => { d.version = v; }),
  'frontend/package-lock.json': json(
    (d) => (d.version === d.packages?.['']?.version ? d.version : `${d.version} / ${d.packages?.['']?.version}`),
    (d, v) => { d.version = v; d.packages[''].version = v; },
  ),
  'backend/version.py': {
    read: (text) => text.match(PY_VERSION)?.[1],
    write: (text, v) => text.replace(PY_VERSION, `__version__ = "${v}"`),
  },
};

export function parseVersion(v) {
  const m = SEMVER.exec(v ?? '');
  if (!m) throw new Error(`«${v}» no es una versión X.Y.Z`);
  return m.slice(1).map(Number);
}

export function isGreater(a, b) {
  const [x, y] = [parseVersion(a), parseVersion(b)];
  const i = x.findIndex((n, k) => n !== y[k]);
  return i !== -1 && x[i] > y[i];
}

export function readVersions(root) {
  return Object.fromEntries(
    Object.entries(TARGETS).map(([file, t]) => [file, t.read(readFileSync(resolve(root, file), 'utf8'))]),
  );
}

// Devuelve la lista de desajustes contra VERSION (vacía si todo coincide).
export function checkVersions(root) {
  const versions = readVersions(root);
  const expected = versions.VERSION;
  return Object.entries(versions)
    .filter(([, v]) => v !== expected)
    .map(([file, v]) => `${file} tiene ${v ?? '(sin versión)'} y VERSION dice ${expected}`);
}

export function bumpVersion(root, next) {
  const current = readVersions(root).VERSION;
  if (!isGreater(next, current)) throw new Error(`${next} tiene que ser mayor que la actual (${current})`);
  for (const [file, t] of Object.entries(TARGETS)) {
    const path = resolve(root, file);
    writeFileSync(path, t.write(readFileSync(path, 'utf8'), next));
  }
  return { from: current, to: next };
}
