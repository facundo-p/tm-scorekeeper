// Everything the screens show, derived from the example games with the same rules
// the backend uses (positions with M€ tie-break, pairwise ELO K=32, records, tiers).
import { generateGames } from './seed.js';
import { PLAYERS_SEED, CATEGORIES, RECORDS, ACHIEVEMENTS, MAPS } from './catalog.js';

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
    row.tied = !!tied || (rows[i + 1] && rows[i + 1].total === row.total && rows[i + 1].mc === row.mc);
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
    const delta = Math.round(K * acc);
    return { player_id: a.player_id, before: before[a.player_id], after: before[a.player_id] + delta, delta };
  });
  game.eloChanges.forEach((c) => { ratings[c.player_id] = c.after; });
  game.eloLeaderBefore = Object.entries(before).sort((x, y) => y[1] - x[1])[0][0];
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
  points_per_generation: (g) => g.results.map((r) => [r.player_id, Math.round((r.total / g.generations) * 10) / 10]),
  fastest_win: (g) => g.winners.map((id) => [id, g.generations]),
  richest_finish: (g) => g.results.map((r) => [r.player_id, r.mc]),
};

function trackGameRecords(games) {
  const state = {};
  for (const g of games) {
    g.recordsBroken = [];
    for (const def of RECORDS.filter((d) => GAME_METRICS[d.code])) {
      for (const [pid, value] of GAME_METRICS[def.code](g)) {
        const cur = state[def.code];
        const better = !cur || (def.lowerIsBetter ? value < cur.value : value > cur.value);
        if (!better) continue;
        const entry = { value, player_id: pid, game_id: g.id, date: g.date };
        if (cur) g.recordsBroken.push({ code: def.code, player_id: pid, value, previous: cur });
        state[def.code] = { ...entry, history: [...(cur?.history ?? []), entry] };
      }
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
      avg: Math.round(avg(list, (r) => r.total)),
      avgPos: avg(list, (r) => r.position),
    }))
    .sort((a, b) => b.games - a.games || b.wins - a.wins);
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
      if (g.eloLeaderBefore !== r.player_id && g.results.some((x) => x.player_id === g.eloLeaderBefore)) metrics.giantKills += 1;
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
      if (def.proposed) continue;
      items.push({ date: g.date, type: 'record', game_id: g.id, player_id: b.player_id, code: b.code,
        text: `${name(b.player_id)} rompió «${def.title}»: ${b.value} (antes ${b.previous.value}, ${name(b.previous.player_id)})` });
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
export function buildModel() {
  const games = generateGames().sort((a, b) => (a.date < b.date ? -1 : 1));
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
      avgPoints: Math.round(avg(rows, (r) => r.total)),
      avgPos: avg(rows, (r) => r.position),
      best: rows.length ? Math.max(...rows.map((r) => r.total)) : 0,
      bestGame: rows.slice().sort((a, b) => b.total - a.total)[0]?.game.id ?? null,
      avgMilestones: avg(rows, (r) => r.scores.milestones.length),
      avgAwards: avg(rows, (r) => r.game.awards.filter((a) => a.first_place.includes(p.id)).length),
      pointsPerGen: avg(rows, (r) => r.total / r.generations),
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
      avgWinner: Math.round(avg(games, (g) => g.results[0].total)),
      avgGenerations: avg(games, (g) => g.generations),
      first: games[0].date,
      last: games[games.length - 1].date,
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

function careerRecord(def, players) {
  const value = (p) => ({
    most_games_played: p.games,
    most_games_won: p.wins,
    highest_elo: p.peak ?? 0,
    longest_streak: p.streak.best,
  })[def.code];
  const best = Math.max(...players.map(value));
  const holders = players.filter((p) => value(p) === best && best > 0).map((p) => ({ player_id: p.id }));
  return { value: best, holders, history: [] };
}

function buildRecords(state, players, games) {
  return RECORDS.map((def) => {
    if (def.scope === 'career') return { ...def, ...careerRecord(def, players) };
    const s = state[def.code];
    if (!s) return { ...def, value: null, holders: [], history: [] };
    const g = games.find((x) => x.id === s.game_id);
    return { ...def, value: s.value, holders: [{ player_id: s.player_id, game_id: s.game_id, date: s.date, map: g.map }], history: s.history };
  });
}

export const MODEL = buildModel();

// Per-game record context: broken records, and near misses against the record
// that stood before that game.
export function gameRecordContext(g) {
  return RECORDS.filter((d) => GAME_METRICS[d.code] && !d.proposed).map((def) => {
    const rec = MODEL.records.find((r) => r.code === def.code);
    const cands = GAME_METRICS[def.code](g);
    if (!cands.length) return null;
    const best = cands.reduce((a, b) => (def.lowerIsBetter ? (b[1] < a[1] ? b : a) : (b[1] > a[1] ? b : a)));
    const broken = g.recordsBroken.find((b) => b.code === def.code);
    const before = rec.history.filter((h) => h.date < g.date || (h.date === g.date && h.game_id !== g.id)).pop();
    const gap = before ? Math.abs(before.value - best[1]) : null;
    return { def, broken, best: { player_id: best[0], value: best[1] }, before, gap };
  }).filter(Boolean);
}
export const mapInfo = (name) => MAPS[name];
