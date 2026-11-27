#!/usr/bin/env node
// Uso: node tools/budgets/check-bundle.mjs [frontend/dist]
// Lee el manifiesto del build y falla si el JS inicial pasa de 100 kB gzip o si el motor del
// planeta no está en un chunk aparte (D-83). Lo corren CI (test-frontend) y gates.sh.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { checkBudgets, INITIAL_JS_MAX_KB } from './budget.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = resolve(root, process.argv[2] ?? 'frontend/dist');
const manifest = JSON.parse(readFileSync(resolve(dist, '.vite/manifest.json'), 'utf8'));
const gzipSize = (file) => gzipSync(readFileSync(resolve(dist, file))).length;

const { initialKb, files, failures } = checkBudgets(manifest, gzipSize);
console.log(`[presupuesto] JS inicial: ${initialKb.toFixed(2)} kB gzip (máximo ${INITIAL_JS_MAX_KB}) en ${files.join(', ')}`);
for (const f of failures) console.error(`[presupuesto] ${f}`);
process.exit(failures.length ? 1 : 0);
