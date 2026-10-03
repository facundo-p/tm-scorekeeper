#!/usr/bin/env node
// Exports the mockup's example data as backend fixtures (F16, PAR-02):
//   fixtures/seed.json    players + games in GameDTO shape, with their ids
//   fixtures/golden.json  everything the mockup derives, unfiltered and per table size 2..5
// `--check` regenerates in memory and fails if the committed files differ (CI).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DATA = resolve(ROOT, 'docs/redesign/mockup/js/data');
const OUT = resolve(ROOT, 'fixtures');
const TABLE_SIZES = [2, 3, 4, 5];

const { generateGames } = await import(`${DATA}/seed.js`);
const { PLAYERS_SEED } = await import(`${DATA}/catalog.js`);
const { buildModel, modelFor, seasonRace, SEASON_CATEGORIES } = await import(`${DATA}/derive.js`);
const { buildGolden, seasonRaces } = await import('./golden.mjs');

function seed() {
  const games = generateGames().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
  return {
    players: PLAYERS_SEED.map((p) => ({ id: p.id, name: p.name, color: p.color, is_active: !p.inactiveFrom })),
    games,
  };
}

// Season races are over the whole group's seasons, restricted to the table size.
function racesFor(n) {
  const full = modelFor();
  return { season_races: seasonRaces({ ...full, playerCount: n }, seasonRace, SEASON_CATEGORIES) };
}

function golden() {
  const out = { all: buildGolden(buildModel(), racesFor(null)), mesa: {} };
  for (const n of TABLE_SIZES) out.mesa[n] = buildGolden(buildModel({ playerCount: n }), racesFor(n));
  return out;
}

const serialize = (data) => `${JSON.stringify(data, null, 1)}\n`;

const files = { 'seed.json': serialize(seed()), 'golden.json': serialize(golden()) };

if (process.argv.includes('--check')) {
  const stale = [];
  for (const [name, content] of Object.entries(files)) {
    const current = await readFile(resolve(OUT, name), 'utf8').catch(() => null);
    if (current !== content) stale.push(name);
  }
  if (stale.length) {
    console.error(`fixtures desactualizados: ${stale.join(', ')}. Corré: node tools/fixtures/export.mjs`);
    process.exit(1);
  }
  console.log('fixtures al día');
} else {
  await mkdir(OUT, { recursive: true });
  for (const [name, content] of Object.entries(files)) await writeFile(resolve(OUT, name), content);
  console.log(`fixtures escritos en ${OUT}`);
}
