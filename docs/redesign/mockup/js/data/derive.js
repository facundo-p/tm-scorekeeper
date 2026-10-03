// Everything the screens show, derived from the example games with the same rules
// the backend uses (positions with M€ tie-break, pairwise ELO K=32, records, tiers).
import { generateGames } from './seed.js';
import { PLAYERS_SEED, CATEGORIES, RECORDS, ACHIEVEMENTS, MAPS } from './catalog.js';
import { roundHalfEven, roundHalfEven1 } from './round.js';
import { byDate } from './sort.js';

const K = 32;
const sum = (list, f = (x) => x) => list.reduce((s, x) => s + f(x), 0);
const avg = (list, f) => (list.length ? sum(list, f) / list.length : 0);
const totalOf = (s) => sum(CATEGORIES, (c) => s[c.key] ?? 0);

function rankResults(game) {
  const rows = game.player_results.map((r) => ({
    player_id: r.player_id,
    corporation: r.corporation,
    scores: r.scores,
    total: totalOf(r.scores),
    mc: r.end_stats.mc_total,
  }));
  rows.sort((a, b) => b.total - a.total || b.mc - a.mc);
  rows.forEach((row, i) => {
    const prev = rows[i - 1];
    const tied = prev && prev.total === row.total && prev.mc === row.mc;
    row.position = tied ? prev.position : i + 1;
    const next = rows[i + 1];
    row.tied = !!tied || !!(next && next.total === row.total && next.mc === row.mc);
  });
  return rows;
}

function applyElo(game, ratings) {
  const before = Object.fromEntries(game.results.map((r) => [r.player_id, ratings[r.player_id] ?? 1000]));
  game.eloChanges = game.results.map((a) => {
    let acc = 0;
    for (const b of game.results) {
      if (a === b) continue;
      const s = a.position < b.position ? 1 : a.position === b.position ? 0.5 : 0;
      const e = 1 / (1 + 10 ** ((before[b.player_id] - before[a.player_id]) / 400));
      acc += s - e;
    }
    const delta = roundHalfEven(K * acc);
    return { player_id: a.player_id, before: before[a.player_id], after: before[a.player_id] + delta, delta };
  });
  game.eloChanges.forEach((c) => { ratings[c.player_id] = c.after; });
  game.eloBefore = before;
}

function leaderOf(ratings, activeIds) {
  return Object.entries(ratings).filter(([id]) => activeIds.has(id)).sort((a, b) => b[1] - a[1])[0]?.[0];
}

// --- Records -------------------------------------------------------------
const GAME_METRICS = {
  highest_single_game_score: (g) => g.results.map((r) => [r.player_id, r.total]),
  highest_terraform_rating: (g) => g.results.map((r) => [r.player_id, r.scores.terraform_rating]),
  highest_card_points: (g) => g.results.map((r) => [r.player_id, r.scores.card_points]),
  highest_card_resource_points: (g) => g.results.map((r) => [r.player_id, r.scores.card_resource_points]),
  highest_greenery_points: (g) => g.results.map((r) => [r.player_id, r.scores.greenery_points]),
  highest_city_points: (g) => g.results.map((r) => [r.player_id, r.scores.city_points]),
  highest_turmoil_points: (g) => g.results.filter((r) => (r.scores.turmoil_points ?? 0) > 0).map((r) => [r.player_id, r.scores.turmoil_points]),
  biggest_margin: (g) => (g.winners.length === 1 ? [[g.winners[0], g.margin]] : []),
  closest_win: (g) => (g.winners.length === 1 ? [[g.winners[0], g.margin]] : []),
  points_per_generation: (g) => g.results.map((r) => [r.player_id, roundHalfEven1(r.total / g.generations)]),
  fastest_win: (g) => g.winners.map((id) => [id, g.generations]),
  richest_finish: (g) => g.results.map((r) => [r.player_id, r.mc]),
};

// Best value of a game for one record, and every player who reached it.
// Higher-is-better records ignore 0 (a Turmoil-less game holds nothing, D-05);
// for lower-is-better ones 0 is meaningful (a win decided by M€).
export function gameBest(def, g) {
  const cands = GAME_METRICS[def.code](g).filter(([, v]) => def.lowerIsBetter || v > 0);
  if (!cands.length) return null;
  const pick = def.lowerIsBetter ? Math.min : Math.max;
  const value = pick(...cands.map(([, v]) => v));
  const players = [...new Set(cands.filter(([, v]) => v === value).map(([pid]) => pid))];
  return { value, players };
}

const beats = (def, a, b) => (def.lowerIsBetter ? a < b : a > b);
const holderEntries = (players, g) => players.map((player_id) => ({ player_id, game_id: g.id, date: g.date, map: g.map }));

// D-05: a record changes hands only when beaten; matching it makes a co-holder;
// the first game sets records without "breaking" them; at most one break per
// record and game.
export function stepRecord(def, cur, best, g) {
  const step = { value: best.value, player_id: best.players[0], holders: best.players, game_id: g.id, date: g.date };
  if (!cur) return { next: { value: best.value, holders: holderEntries(best.players, g), history: [{ ...step, kind: 'set' }] } };
  if (beats(def, best.value, cur.value)) {
    const previous = { value: cur.value, player_id: cur.holders[0].player_id, holders: cur.holders.map((h) => h.player_id) };
    const broken = { code: def.code, value: best.value, player_id: best.players[0], holders: best.players, previous };
    return { broken, next: { value: best.value, holders: holderEntries(best.players, g), history: [...cur.history, { ...step, kind: 'broken' }] } };
  }
  const added = best.value === cur.value ? best.players.filter((pid) => !cur.holders.some((h) => h.player_id === pid)) : [];
  if (!added.length) return { next: cur };
  const tied = { ...step, player_id: added[0], holders: added, kind: 'tied' };
  return { next: { ...cur, holders: [...cur.holders, ...holderEntries(added, g)], history: [...cur.history, tied] } };
}

function trackGameRecords(games) {
  const state = {};
  for (const g of games) {
    g.recordsBroken = [];
    for (const def of RECORDS.filter((d) => GAME_METRICS[d.code])) {
      const best = gameBest(def, g);
      if (!best) continue;
      const { next, broken } = stepRecord(def, state[def.code], best, g);
      state[def.code] = next;
      if (broken) g.recordsBroken.push(broken);
    }
  }
  return state;
}

// --- Player aggregates ------------------------------------------------------
function streaks(rows) {
  let best = 0;
  let current = 0;
  for (const r of rows) {
    current = r.position === 1 ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return { best, current };
}

function groupBy(list, key) {
  const out = {};
  for (const x of list) (out[key(x)] ??= []).push(x);
  return out;
}

function splitStats(rows, key) {
  return Object.entries(groupBy(rows, key))
    .map(([name, list]) => ({
      name,
      games: list.length,
      wins: list.filter((r) => r.position === 1).length,
      avg: roundHalfEven(avg(list, (r) => r.total)),
      avgPos: avg(list, (r) => r.position),
    }))
    .sort((a, b) => b.games - a.games || b.wins - a.wins);
}

// Most claimed milestone / most won award (#35, #66): every name tied at the top.
function mostCommon(names) {
  const counts = {};
  for (const n of names) counts[n] = (counts[n] ?? 0) + 1;
  const top = Math.max(0, ...Object.values(counts));
  return top ? { names: Object.keys(counts).filter((n) => counts[n] === top).sort(), count: top } : null;
}

function favorites(rows, pid) {
  return {
    milestone: mostCommon(rows.flatMap((r) => r.scores.milestones)),
    award: mostCommon(rows.flatMap((r) => r.game.awards.filter((a) => a.first_place.includes(pid)).map((a) => a.name))),
  };
}

function composition(rows) {
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c.key, avg(rows, (r) => r.scores[c.key] ?? 0)]));
  const all = sum(Object.values(totals)) || 1;
  return { avg: totals, share: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / all])) };
}

const ARCHETYPES = {
  terraform_rating: ['Terraformador puro', 'Vive del TR: sube parámetros antes que nadie.'],
  award_points: ['Cazarrecompensas', 'Financia y gana recompensas como nadie.'],
  milestone_points: ['Cazador de hitos', 'Llega primero a los hitos del mapa.'],
  card_resource_points: ['Bioingeniero', 'Microbios, animales y flotadores sobre sus cartas.'],
  card_points: ['Coleccionista de proyectos', 'Su motor está en la mano de cartas.'],
  greenery_points: ['Jardinero de Marte', 'Llena el mapa de vegetación.'],
  city_points: ['Urbanista', 'Ciudades rodeadas de verde, puntos asegurados.'],
  turmoil_points: ['Operador político', 'Delegados, partidos y favores en Turmoil.'],
};

function archetype(comp, groupShare) {
  let best = null;
  for (const c of CATEGORIES) {
    const ratio = (comp.share[c.key] ?? 0) / (groupShare[c.key] || 1);
    if (comp.share[c.key] > 0.02 && (!best || ratio > best.ratio)) best = { key: c.key, ratio };
  }
  const [name, desc] = ARCHETYPES[best.key];
  return { key: best.key, name, desc, share: comp.share[best.key], group: groupShare[best.key], ratio: best.ratio };
}

function playerRows(games, pid) {
  return games.flatMap((g) => {
    const r = g.results.find((x) => x.player_id === pid);
    return r ? [{ ...r, game: g, map: g.map, date: g.date, generations: g.generations, n: g.results.length }] : [];
  });
}

// --- Achievements ---------------------------------------------------------------
function achievementMetrics(rows, games) {
  const won = (r) => r.position === 1;
  const metrics = { score: 0, games: 0, wins: 0, streak: 0, curStreak: 0, greenery: 0, maps: new Set(), stolen: 0, cards: 0,
    allMilestonesWin: 0, noMilestoneWin: 0, allAwardsWin: 0, noAwardWin: 0, corps: new Set(), photoFinish: 0, blitz: 0,
    giantKills: 0, fullTableWin: 0, cities: 0 };
  const timeline = [];
  for (const r of rows) {
    const g = r.game;
    const firsts = g.awards.filter((a) => a.first_place.includes(r.player_id));
    metrics.score = Math.max(metrics.score, r.total);
    metrics.games += 1;
    metrics.curStreak = won(r) ? metrics.curStreak + 1 : 0;
    metrics.streak = Math.max(metrics.streak, metrics.curStreak);
    metrics.greenery += r.scores.greenery_points;
    metrics.maps.add(g.map);
    metrics.corps.add(r.corporation);
    metrics.cards = Math.max(metrics.cards, r.scores.card_points);
    metrics.cities = Math.max(metrics.cities, r.scores.city_points);
    metrics.stolen = Math.max(metrics.stolen, g.awards.filter((a) => a.first_place.length === 1 && a.first_place[0] === r.player_id && a.opened_by !== r.player_id).length);
    if (won(r)) {
      metrics.wins += 1;
      if (r.scores.milestones.length === 3) metrics.allMilestonesWin = 1;
      if (r.scores.milestones.length === 0) metrics.noMilestoneWin = 1;
      if (g.awards.length === 3 && firsts.length === 3) metrics.allAwardsWin = 1;
      if (firsts.length === 0) metrics.noAwardWin = 1;
      if (g.winners.length === 1 && g.margin <= 2) metrics.photoFinish = 1;
      if (g.generations <= 9) metrics.blitz = 1;
      if (g.results.length === 5) metrics.fullTableWin = 1;
      // D-08: won with a pre-game ELO strictly below the table's highest pre-game ELO.
      if (g.eloBefore[r.player_id] < Math.max(...Object.values(g.eloBefore))) metrics.giantKills += 1;
    }
    timeline.push({ game: g, snapshot: { ...metrics, maps: metrics.maps.size, corps: metrics.corps.size } });
  }
  return timeline;
}

function evaluateAchievements(rows) {
  const timeline = achievementMetrics(rows);
  const final = timeline[timeline.length - 1]?.snapshot ?? {};
  const out = {};
  for (const def of ACHIEVEMENTS) {
    const value = final[def.metric] ?? 0;
    let tier = 0;
    const unlocked = [];
    for (const t of def.tiers) {
      const hit = timeline.find((step) => (step.snapshot[def.metric] ?? 0) >= t.threshold);
      if (hit) {
        tier = t.level;
        unlocked.push({ level: t.level, date: hit.game.date, game_id: hit.game.id });
      }
    }
    const next = def.tiers.find((t) => t.level === tier + 1);
    const progressValue = def.code === 'win_streak' ? final.curStreak ?? 0 : value;
    out[def.code] = {
      tier,
      value,
      unlocked,
      unlockedAt: unlocked[unlocked.length - 1]?.date ?? null,
      progress: next && def.kind !== 'flag' ? { current: Math.min(progressValue, next.threshold), target: next.threshold } : null,
    };
  }
  return out;
}

// --- Seasons: the group's own Mars ----------------------------------------------
const SEASON = { tempPerGame: 0.8, oxygenPerGreenery: 1 / 52, oceansPerGame: 0.375 };

function seasons(games) {
  const list = [];
  let cur = null;
  for (const g of games) {
    if (!cur) cur = { number: list.length + 1, start: g.date, games: [], temp: 0, oxygen: 0, oceans: 0, contrib: {} };
    cur.games.push(g.id);
    cur.temp = Math.min(19, cur.temp + SEASON.tempPerGame);
    cur.oxygen = Math.min(14, cur.oxygen + sum(g.results, (r) => r.scores.greenery_points) * SEASON.oxygenPerGreenery);
    cur.oceans = Math.min(9, cur.oceans + SEASON.oceansPerGame);
    for (const r of g.results) cur.contrib[r.player_id] = (cur.contrib[r.player_id] ?? 0) + (r.scores.terraform_rating - 20);
    if (cur.temp >= 19 && cur.oxygen >= 14 && cur.oceans >= 9) {
      cur.end = g.date;
      list.push(cur);
      cur = null;
    }
  }
  if (cur) list.push(cur);
  return list.map((s) => {
    const pct = (Math.floor(s.temp) / 19 + Math.floor(s.oxygen) / 14 + Math.floor(s.oceans) / 9) / 3;
    const ranking = Object.entries(s.contrib).sort((a, b) => b[1] - a[1]).map(([player_id, tr]) => ({ player_id, tr }));
    return {
      ...s,
      temperature: -30 + Math.floor(s.temp) * 2,
      oxygenPct: Math.floor(s.oxygen),
      oceanCount: Math.floor(s.oceans),
      pct,
      ranking,
      champion: s.end ? ranking[0].player_id : null,
    };
  });
}

// --- Feed -------------------------------------------------------------------------
const names = (ids, name) => ids.map(name).join(' y ');

function buildFeed(games, players, achievementsByPlayer, seasonList) {
  const name = (id) => players.find((p) => p.id === id)?.name ?? id;
  const items = [];
  for (const g of games) {
    const w = g.results[0];
    items.push({ date: g.date, type: 'game', game_id: g.id, player_id: w.player_id,
      text: g.decidedByMc
        ? `${name(w.player_id)} ganó en ${g.map} por desempate de M€`
        : `${name(w.player_id)} ganó en ${g.map} por ${g.margin} ${g.margin === 1 ? 'punto' : 'puntos'}` });
    for (const b of g.recordsBroken) {
      const def = RECORDS.find((d) => d.code === b.code);
      items.push({ date: g.date, type: 'record', game_id: g.id, player_id: b.player_id, code: b.code,
        text: `${names(b.holders, name)} rompió «${def.title}»: ${b.value} (antes ${b.previous.value}, ${names(b.previous.holders, name)})` });
    }
  }
  for (const [pid, achs] of Object.entries(achievementsByPlayer)) {
    for (const def of ACHIEVEMENTS) {
      const unlocked = achs[def.code].unlocked;
      for (const u of unlocked) {
        const tier = def.tiers.find((t) => t.level === u.level);
        if (u.level < 2 && def.tiers.length > 1) continue;
        if (unlocked.some((o) => o.game_id === u.game_id && o.level > u.level)) continue;
        items.push({ date: u.date, type: 'achievement', game_id: u.game_id, player_id: pid, code: def.code, level: u.level,
          text: `${name(pid)} desbloqueó ${tier.title}${def.tiers.length > 1 ? ` (nivel ${u.level})` : ''}` });
      }
    }
  }
  for (const s of seasonList.filter((x) => x.end)) {
    items.push({ date: s.end, type: 'season', player_id: s.champion,
      text: `Temporada ${s.number} completa: Marte terraformado. Campeón: ${name(s.champion)}` });
  }
  const order = { season: 0, record: 1, achievement: 2, game: 3 };
  return items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : order[a.type] - order[b.type]));
}

// --- Model ---------------------------------------------------------------------------
// `playerCount` restricts every derivation to games with exactly that many
// players (the "mesa" filter): ELO is replayed from 1000 over that subset only.
// `map` and `expansion` restrict it to games on that map / with that expansion (#37).
export function buildModel({ playerCount = null, map = null, expansion = null } = {}) {
  const games = generateGames()
    .filter((g) => (!playerCount || g.player_results.length === playerCount)
      && (!map || g.map === map) && (!expansion || g.expansions.includes(expansion)))
    .sort(byDate);
  const ratings = {};
  const eloSeries = {};
  const activeIds = new Set(PLAYERS_SEED.filter((p) => !p.inactiveFrom).map((p) => p.id));
  const leadChanges = [];
  let leader = null;
  for (const g of games) {
    g.results = rankResults(g);
    g.winners = g.results.filter((r) => r.position === 1).map((r) => r.player_id);
    g.margin = g.results.length > 1 ? g.results[0].total - (g.results.find((r) => r.position > 1)?.total ?? g.results[0].total) : 0;
    g.decidedByMc = g.results.length > 1 && g.results[0].total === g.results[1].total;
    applyElo(g, ratings);
    for (const c of g.eloChanges) (eloSeries[c.player_id] ??= []).push({ date: g.date, game_id: g.id, elo: c.after, delta: c.delta });
    const now = leaderOf(ratings, activeIds);
    if (now !== leader) { leadChanges.push({ date: g.date, game_id: g.id, player_id: now }); leader = now; }
  }
  const recordState = trackGameRecords(games);

  const groupComp = composition(games.flatMap((g) => g.results));
  const players = PLAYERS_SEED.map((p) => {
    const rows = playerRows(games, p.id);
    const series = eloSeries[p.id] ?? [];
    const comp = composition(rows);
    return {
      id: p.id, name: p.name, color: p.color, since: p.since, active: !p.inactiveFrom,
      elo: ratings[p.id] ?? 1000,
      peak: series.length ? Math.max(...series.map((s) => s.elo)) : null,
      lastDelta: series.length ? series[series.length - 1].delta : null,
      eloSeries: series,
      games: rows.length,
      wins: rows.filter((r) => r.position === 1).length,
      winRate: rows.length ? rows.filter((r) => r.position === 1).length / rows.length : 0,
      podiumRate: rows.length ? rows.filter((r) => r.position <= 2).length / rows.length : 0,
      avgPoints: roundHalfEven(avg(rows, (r) => r.total)),
      avgPos: avg(rows, (r) => r.position),
      best: rows.length ? Math.max(...rows.map((r) => r.total)) : 0,
      bestGame: rows.slice().sort((a, b) => b.total - a.total)[0]?.game.id ?? null,
      avgMilestones: avg(rows, (r) => r.scores.milestones.length),
      avgAwards: avg(rows, (r) => r.game.awards.filter((a) => a.first_place.includes(p.id)).length),
      pointsPerGen: avg(rows, (r) => r.total / r.generations),
      favorites: favorites(rows, p.id),
      composition: comp,
      archetype: rows.length ? archetype(comp, groupComp.share) : null,
      corps: splitStats(rows, (r) => r.corporation),
      maps: splitStats(rows, (r) => r.map),
      streak: streaks(rows),
      form: rows.slice(-8).map((r) => ({ position: r.position, n: r.n, game_id: r.game.id })),
      history: rows.map((r) => ({ game_id: r.game.id, date: r.date, map: r.map, position: r.position, n: r.n, total: r.total,
        corporation: r.corporation, delta: r.game.eloChanges.find((c) => c.player_id === p.id)?.delta ?? 0 })).reverse(),
      achievements: evaluateAchievements(rows),
    };
  });
  const ranked = players.filter((p) => p.active && p.games > 0).sort((a, b) => b.elo - a.elo);
  ranked.forEach((p, i) => { p.rank = i + 1; });
  const rankTotal = ranked.length;
  players.forEach((p) => { p.rankTotal = rankTotal; });

  const h2h = headToHead(games);
  players.forEach((p) => Object.assign(p, rivals(p.id, h2h)));

  const records = buildRecords(recordState, players, games);
  records.forEach((r) => {
    for (const h of r.holders) {
      const pl = players.find((p) => p.id === h.player_id);
      if (pl) (pl.recordsHeld ??= []).push(r.code);
    }
  });
  players.forEach((p) => { p.recordsHeld ??= []; });

  const achievementsByPlayer = Object.fromEntries(players.map((p) => [p.id, p.achievements]));
  const achievements = ACHIEVEMENTS.map((def) => ({
    ...def,
    holders: players
      .filter((p) => p.achievements[def.code].tier > 0)
      .map((p) => ({ player_id: p.id, tier: p.achievements[def.code].tier, unlockedAt: p.achievements[def.code].unlockedAt }))
      .sort((a, b) => b.tier - a.tier || (a.unlockedAt < b.unlockedAt ? -1 : 1)),
  }));
  games.forEach((g) => {
    g.achievementsUnlocked = [];
    for (const p of players) {
      for (const def of ACHIEVEMENTS) {
        for (const u of p.achievements[def.code].unlocked) {
          if (u.game_id === g.id) g.achievementsUnlocked.push({ player_id: p.id, code: def.code, level: u.level, upgrade: u.level > 1 });
        }
      }
    }
  });

  const seasonList = seasons(games);
  const feed = buildFeed(games, players, achievementsByPlayer, seasonList);
  const byCorp = splitStats(games.flatMap((g) => g.results), (r) => r.corporation);
  const byMap = splitStats(games.map((g) => ({ ...g.results[0], map: g.map })), (r) => r.map);

  return {
    players,
    playerById: Object.fromEntries(players.map((p) => [p.id, p])),
    games: games.slice().reverse(),
    gameById: Object.fromEntries(games.map((g) => [g.id, g])),
    records,
    achievements,
    h2h,
    seasons: seasonList,
    season: seasonList[seasonList.length - 1],
    feed,
    leadChanges,
    group: {
      games: games.length,
      generations: sum(games, (g) => g.generations),
      avgWinner: roundHalfEven(avg(games, (g) => g.results[0].total)),
      avgGenerations: avg(games, (g) => g.generations),
      first: games[0]?.date ?? null,
      last: games[games.length - 1]?.date ?? null,
      topCorp: byCorp[0],
      corpsUsed: byCorp.length,
      topMap: byMap[0],
      maps: byMap,
      composition: groupComp,
    },
  };
}

function headToHead(games) {
  const h = {};
  for (const g of games) {
    for (const a of g.results) {
      for (const b of g.results) {
        if (a === b) continue;
        const cell = ((h[a.player_id] ??= {})[b.player_id] ??= { games: 0, ahead: 0, behind: 0, even: 0 });
        cell.games += 1;
        if (a.position < b.position) cell.ahead += 1;
        else if (a.position > b.position) cell.behind += 1;
        else cell.even += 1;
      }
    }
  }
  return h;
}

function rivals(pid, h2h) {
  const rows = Object.entries(h2h[pid] ?? {}).filter(([, c]) => c.games >= 4);
  const rate = ([, c]) => c.ahead / c.games;
  const nemesis = rows.slice().sort((a, b) => rate(a) - rate(b) || b[1].games - a[1].games)[0];
  const victim = rows.slice().sort((a, b) => rate(b) - rate(a) || b[1].games - a[1].games)[0];
  return {
    nemesis: nemesis ? { player_id: nemesis[0], ...nemesis[1] } : null,
    victim: victim ? { player_id: victim[0], ...victim[1] } : null,
  };
}

const CAREER_VALUE = {
  most_games_played: (p) => p.games,
  most_games_won: (p) => p.wins,
  highest_elo: (p) => p.peak ?? 0,
  longest_streak: (p) => p.streak.best,
};

// Career standings after every game, to date the record's changes of hands (D-18).
function careerSnapshots(games) {
  const acc = {};
  return games.map((g) => {
    for (const r of g.results) {
      const a = (acc[r.player_id] ??= { games: 0, wins: 0, peak: null, cur: 0, best: 0 });
      a.games += 1;
      if (r.position === 1) { a.wins += 1; a.cur += 1; } else a.cur = 0;
      a.best = Math.max(a.best, a.cur);
      const elo = g.eloChanges.find((c) => c.player_id === r.player_id).after;
      a.peak = a.peak === null ? elo : Math.max(a.peak, elo);
    }
    const players = Object.entries(acc).map(([id, a]) => ({ id, ...a, streak: { best: a.best } }));
    return { g, players };
  });
}

function leadersOf(def, players) {
  const value = Math.max(0, ...players.map(CAREER_VALUE[def.code]));
  const ids = value > 0 ? players.filter((p) => CAREER_VALUE[def.code](p) === value).map((p) => p.id) : [];
  return { value, ids };
}

// History keeps only changes of the holder set: someone overtakes or matches the top.
function careerHistory(def, snapshots) {
  const history = [];
  for (const { g, players } of snapshots) {
    const { value, ids } = leadersOf(def, players);
    const last = history[history.length - 1];
    if (!ids.length || (last && last.holders.join(',') === ids.join(','))) continue;
    const tied = last && value === last.value && last.holders.every((id) => ids.includes(id));
    const added = tied ? ids.filter((id) => !last.holders.includes(id)) : ids;
    history.push({ value, player_id: added[0], holders: ids, game_id: g.id, date: g.date, kind: !last ? 'set' : tied ? 'tied' : 'broken' });
  }
  return history;
}

function careerRecord(def, players, snapshots) {
  const { value, ids } = leadersOf(def, players);
  return { value, holders: ids.map((player_id) => ({ player_id })), history: careerHistory(def, snapshots) };
}

function buildRecords(state, players, games) {
  const snapshots = careerSnapshots(games);
  return RECORDS.map((def) => {
    if (def.scope === 'career') return { ...def, ...careerRecord(def, players, snapshots) };
    const s = state[def.code];
    if (!s) return { ...def, value: null, holders: [], history: [] };
    return { ...def, value: s.value, holders: s.holders, history: s.history };
  });
}

// Derived models are memoised per filter: filtering never writes, it only reads a
// different subset of the same games (SEMANTICS §9).
const models = new Map();
export function modelFor({ playerCount = null, map = null, expansion = null } = {}) {
  const key = JSON.stringify([playerCount, map, expansion]);
  if (!models.has(key)) models.set(key, buildModel({ playerCount, map, expansion }));
  return models.get(key);
}

export const MODEL = modelFor();

// Canonical game order (D-19), on a history entry vs a game.
const playedBefore = (h, g) => byDate({ date: h.date, id: h.game_id }, g) < 0;

// Per-game record context: what the game did to each per-game record, and the
// record that stood before it.
// `model` must be the one `g` comes from: `before` and `gap` read its record history.
export function gameRecordContext(g, model) {
  return RECORDS.filter((d) => GAME_METRICS[d.code]).map((def) => {
    const best = gameBest(def, g);
    if (!best) return null;
    const rec = model.records.find((r) => r.code === def.code);
    const broken = g.recordsBroken.find((b) => b.code === def.code);
    const tied = rec.history.find((h) => h.game_id === g.id && h.kind === 'tied');
    const before = rec.history.filter((h) => playedBefore(h, g)).pop();
    const gap = before ? Math.abs(before.value - best.value) : null;
    return { def, broken, tied, best: { player_id: best.players[0], players: best.players, value: best.value }, before, gap };
  }).filter(Boolean);
}

// "Cerca del récord": not broken, at 3 or less from the standing record (a tie
// counts, gap 0), closest first, at most 3 per game.
export const NEAR_GAP = 3;
export function nearRecords(ctx) {
  return ctx.filter((c) => !c.broken && c.before && c.gap <= NEAR_GAP).sort((a, b) => a.gap - b.gap).slice(0, 3);
}

export const mapInfo = (name) => MAPS[name];
