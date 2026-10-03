// Escenarios declarados en tools/parity/scenarios/*.yaml (lista de objetos por archivo).
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import YAML from 'yaml';
import { PARITY_DIR } from '../config.mjs';

const DIR = resolve(PARITY_DIR, 'scenarios');
const REQUIRED = ['id', 'screen', 'ref', 'cand'];

function validate(s, file) {
  for (const key of REQUIRED) if (s[key] === undefined) throw new Error(`${file}: escenario sin '${key}'`);
  for (const [metric, t] of Object.entries(s.thresholds ?? {})) {
    if (!t?.reason) throw new Error(`${file}:${s.id}: el umbral '${metric}' necesita un 'reason'`);
  }
  return { viewports: ['desktop', 'mobile'], frames: 'all', planet: 'required', actions: [], masks: [], probes: [], ...s };
}

export function loadScenarios({ screens, ids } = {}) {
  const all = readdirSync(DIR).filter((f) => f.endsWith('.yaml')).sort()
    .flatMap((f) => (YAML.parse(readFileSync(resolve(DIR, f), 'utf8')) ?? []).map((s) => validate(s, f)));
  const seen = new Set();
  for (const s of all) { if (seen.has(s.id)) throw new Error(`escenario duplicado: ${s.id}`); seen.add(s.id); }
  return all.filter((s) => (!screens || screens.includes(s.screen)) && (!ids || ids.includes(s.id)));
}

export const isGated = (scenario, { mode, phase }) => mode === 'self' || (scenario.gateFromPhase ?? Infinity) <= phase;
