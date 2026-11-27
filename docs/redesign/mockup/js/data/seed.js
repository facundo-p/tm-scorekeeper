// Deterministic example games shaped exactly like the API's GameDTO
// (backend/schemas/game.py), so the redesign is drawn against real structures.
import { rng, weighted, shuffle, gauss, clamp } from './rand.js';
import { MAPS, CORPS, PLAYERS_SEED, EXPANSION_AWARDS, EXPANSION_MILESTONES } from './catalog.js';

const ATTENDANCE = { 'p-facu': 1, 'p-nico': 0.95, 'p-juli': 0.9, 'p-caro': 0.86, 'p-tomi': 0.7, 'p-meli': 0.64, 'p-santi': 0.55, 'p-lu': 0.62, 'p-gonza': 0.62, 'p-pato': 0.5 };
const MAP_WEIGHT = { Tharsis: 34, Hellas: 18, Elysium: 18, 'Vastitas Borealis': 8, 'Amazonis Planitia': 7, 'Utopia Planitia': 14, 'Terra Cimmeria': 13 };
const TR_SHARE = { 2: 1.16, 3: 1, 4: 0.92, 5: 0.86 };
const BASE_GENS = { 2: 13.5, 3: 11.6, 4: 10.6, 5: 10.1 };

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const style = (p, key) => p.style[key] ?? 1;

function gameDates(rand) {
  const dates = [];
  let d = new Date('2025-03-08T12:00:00Z');
  const end = new Date('2026-09-27T12:00:00Z');
  while (d < end) {
    dates.push(iso(d));
    const recent = d > new Date('2026-04-01T00:00:00Z');
    d = addDays(d, weighted(rand, recent ? [[7, 6], [6, 1], [14, 1]] : [[7, 4], [14, 3], [21, 1], [6, 1], [8, 1]]));
  }
  dates.push(iso(end));
  return dates;
}

function availablePlayers(date) {
  return PLAYERS_SEED.filter((p) => p.since <= date && !(p.inactiveFrom && p.inactiveFrom <= date));
}

function pickTable(rand, date) {
  const pool = availablePlayers(date);
  const count = Math.min(pool.length, weighted(rand, [[2, 8], [3, 34], [4, 42], [5, 16]]));
  const chosen = [];
  const rest = [...pool];
  while (chosen.length < count) {
    const p = weighted(rand, rest.map((x) => [x, ATTENDANCE[x.id]]));
    chosen.push(p);
    rest.splice(rest.indexOf(p), 1);
  }
  return chosen;
}

function pickExpansions(rand) {
  const out = [];
  if (rand() < 0.85) out.push('Prelude');
  if (rand() < 0.4) out.push('Colonies');
  if (rand() < 0.26) out.push('Turmoil');
  if (rand() < 0.3) out.push('Venus next');
  return out;
}

function pickCorps(rand, expansions, n) {
  const ok = CORPS.filter((c) => c.exp === 'base' || expansions.includes(c.exp));
  return shuffle(rand, ok).slice(0, n).map((c) => c.name);
}

function playerScores(rand, p, ctx) {
  const q = clamp(p.skill + gauss(rand) * 0.11, 0.15, 0.97);
  const n = ctx.table.length;
  const tr = Math.round(20 + ctx.generations * (1.05 + q * 0.95) * TR_SHARE[n] * style(p, 'terraform_rating') + gauss(rand) * 2.6);
  const pos = (v) => Math.max(0, Math.round(v));
  return {
    q,
    scores: {
      terraform_rating: tr,
      milestone_points: 0,
      milestones: [],
      award_points: 0,
      card_points: pos(5 + q * 19 * style(p, 'card_points') + ctx.generations * 0.45 + gauss(rand) * 4),
      card_resource_points: pos(0.5 + q * 8 * style(p, 'card_resource_points') + gauss(rand) * 2.2),
      greenery_points: pos(2 + q * 9.5 * style(p, 'greenery_points') + gauss(rand) * 2),
      city_points: pos(2 + q * 8.5 * style(p, 'city_points') + gauss(rand) * 2),
      turmoil_points: ctx.turmoil ? pos(1 + q * 3.6 * style(p, 'turmoil_points') + gauss(rand)) : null,
    },
    mc: pos(4 + rand() * 30),
  };
}

function claimMilestones(rand, ctx, sheet) {
  const list = [...MAPS[ctx.map].milestones, ...ctx.expansions.flatMap((e) => EXPANSION_MILESTONES[e] ?? [])];
  const claimed = weighted(rand, [[3, 70], [2, 20], [1, 8], [0, 2]]);
  shuffle(rand, list).slice(0, claimed).forEach((m) => {
    const who = weighted(rand, ctx.table.map((p) => [p, sheet[p.id].q * style(p, 'milestone_points') ** 2]));
    sheet[who.id].scores.milestones.push(m);
    sheet[who.id].scores.milestone_points += 5;
  });
}

function fundAwards(rand, ctx, sheet) {
  const list = [...MAPS[ctx.map].awards, ...ctx.expansions.flatMap((e) => EXPANSION_AWARDS[e] ?? [])];
  const funded = weighted(rand, [[3, 56], [2, 28], [1, 11], [0, 5]]);
  return shuffle(rand, list).slice(0, funded).map((name) => {
    const opener = weighted(rand, ctx.table.map((p) => [p, sheet[p.id].q * style(p, 'award_points')]));
    const ranked = ctx.table
      .map((p) => ({ p, v: sheet[p.id].q * style(p, 'award_points') + (p === opener ? 0.18 : 0) + gauss(rand) * 0.2 }))
      .sort((a, b) => b.v - a.v);
    const tieFirst = rand() < 0.07;
    const first = tieFirst ? [ranked[0].p.id, ranked[1].p.id] : [ranked[0].p.id];
    const second = tieFirst || ctx.table.length === 2 ? [] : [ranked[1].p.id];
    first.forEach((id) => { sheet[id].scores.award_points += 5; });
    second.forEach((id) => { sheet[id].scores.award_points += 2; });
    return { name, opened_by: opener.id, first_place: first, second_place: second };
  });
}

function buildGame(rand, date, index) {
  const table = pickTable(rand, date);
  const maps = Object.values(MAPS).filter((m) => m.since <= date);
  const map = weighted(rand, maps.map((m) => [m.name, MAP_WEIGHT[m.name]]));
  const expansions = pickExpansions(rand);
  const draft = rand() < 0.7;
  const generations = clamp(Math.round(BASE_GENS[table.length] - (expansions.includes('Prelude') ? 0.7 : 0) + gauss(rand) * 0.9), 8, 16);
  const ctx = { table, map, expansions, generations, turmoil: expansions.includes('Turmoil') };
  const sheet = Object.fromEntries(table.map((p) => [p.id, playerScores(rand, p, ctx)]));
  claimMilestones(rand, ctx, sheet);
  const awards = fundAwards(rand, ctx, sheet);
  const corps = pickCorps(rand, expansions, table.length);
  return {
    id: `g-${String(index + 1).padStart(3, '0')}`,
    date, map, expansions, draft, generations,
    player_results: table.map((p, i) => ({
      player_id: p.id,
      corporation: corps[i],
      scores: sheet[p.id].scores,
      end_stats: { mc_total: sheet[p.id].mc },
    })),
    awards,
  };
}

// The last session is scripted so the example tells a story: Juli wins on Tharsis
// by three points and breaks the all-time greenery record.
function scriptFinale(game) {
  const ids = ['p-juli', 'p-facu', 'p-nico', 'p-caro'];
  const corp = { 'p-juli': 'Ecoline', 'p-facu': 'Point Luna', 'p-nico': 'Tharsis Republic', 'p-caro': 'Helion' };
  const s = {
    'p-juli': [44, 7, 5, 4, 17, 23, 6, 21],
    'p-facu': [41, 10, 5, 6, 25, 9, 7, 17],
    'p-nico': [39, 4, 0, 2, 16, 7, 21, 31],
    'p-caro': [46, 0, 5, 0, 13, 8, 9, 12],
  };
  Object.assign(game, { map: 'Tharsis', expansions: ['Prelude', 'Colonies'], draft: true, generations: 11 });
  game.player_results = ids.map((id) => {
    const [tr, aw, mi, res, cards, green, city, mc] = s[id];
    return {
      player_id: id,
      corporation: corp[id],
      scores: {
        terraform_rating: tr, award_points: aw, milestone_points: mi,
        milestones: { 'p-juli': ['Gardener'], 'p-facu': ['Planner'], 'p-caro': ['Terraformer'], 'p-nico': [] }[id],
        card_resource_points: res, card_points: cards, greenery_points: green, city_points: city, turmoil_points: null,
      },
      end_stats: { mc_total: mc },
    };
  });
  game.awards = [
    { name: 'Landlord', opened_by: 'p-nico', first_place: ['p-juli'], second_place: ['p-nico'] },
    { name: 'Scientist', opened_by: 'p-facu', first_place: ['p-facu'], second_place: ['p-juli'] },
    { name: 'Banker', opened_by: 'p-juli', first_place: ['p-facu'], second_place: ['p-nico'] },
  ];
  return game;
}

export function generateGames() {
  const rand = rng(20250308);
  const dates = gameDates(rand);
  const games = dates.map((d, i) => buildGame(rand, d, i));
  scriptFinale(games[games.length - 1]);
  return games;
}
