#!/usr/bin/env node
// Uso: node tools/release/bump.mjs X.Y.Z   escribe la versión en VERSION, frontend y backend
//      node tools/release/bump.mjs --check falla si alguno no coincide con VERSION (CI)
// Lo usa el skill /release (.claude/skills/release/SKILL.md).
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bumpVersion, checkVersions } from './version.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const arg = process.argv[2];

if (!arg) {
  console.error('Uso: node tools/release/bump.mjs X.Y.Z | --check');
  process.exit(2);
}

try {
  if (arg === '--check') {
    const failures = checkVersions(root);
    for (const f of failures) console.error(`[versión] ${f}`);
    if (!failures.length) console.log('[versión] todo coincide con VERSION');
    process.exit(failures.length ? 1 : 0);
  }
  const { from, to } = bumpVersion(root, arg);
  console.log(`[versión] ${from} → ${to}`);
} catch (e) {
  console.error(`[versión] ${e.message}`);
  process.exit(1);
}
