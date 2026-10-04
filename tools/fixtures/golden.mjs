// Projects the mockup's derived model (docs/redesign/mockup/js/data/derive.js)
// onto the stable, JSON-friendly shape stored in fixtures/golden.json.
const byId = (list) => Object.fromEntries(list);

export function positions(model) {
  return byId(model.games.slice().reverse().map((g) => [g.id, g.results.map((r) => ({
    player_id: r.player_id, position: r.position, tied: r.tied, total: r.total, mc: r.mc,
  }))]));
}

export function elo(model) {
  const perGame = byId(model.games.slice().reverse().map((g) => [g.id, g.eloChanges.map((c) => ({
    player_id: c.player_id, before: c.before, after: c.after, delta: c.delta,
  }))]));
  const final = byId(model.players.filter((p) => p.games > 0).map((p) => [p.id, p.elo]));
  const peak = byId(model.players.filter((p) => p.games > 0).map((p) => [p.id, p.peak]));
  return { perGame, final, peak };
}

export function records(model) {
  return model.records.map((r) => ({
    code: r.code, scope: r.scope, lower_is_better: !!r.lowerIsBetter, value: r.value,
    holders: r.holders, history: r.history.map(({ history, ...h }) => h),
  }));
}

export function achievements(model) {
  return byId(model.players.map((p) => [p.id, byId(Object.entries(p.achievements).map(([code, a]) => [code, {
    tier: a.tier, value: a.value, unlocked: a.unlocked, progress: a.progress,
  }]))]));
}

const PLAYER_KEYS = ['games', 'wins', 'winRate', 'podiumRate', 'avgPoints', 'avgPos', 'best', 'bestGame', 'avgMilestones', 'favorites',
  'avgAwards', 'pointsPerGen', 'composition', 'archetype', 'corps', 'maps', 'streak', 'form', 'nemesis', 'victim',
  'recordsHeld', 'rank', 'rankTotal', 'equity', 'byTable', 'elo', 'peak', 'lastDelta'];

export function players(model) {
  return byId(model.players.map((p) => [p.id, Object.fromEntries(PLAYER_KEYS.map((k) => [k, p[k] ?? null]))]));
}

export function seasons(model) {
  return model.seasons;
}

// Season race for every category and table size (owner's point 4, D-15).
export function seasonRaces(model, seasonRace, categories) {
  const out = {};
  for (const s of model.seasons) {
    out[s.number] = Object.fromEntries(categories.map((c) => [c, seasonRace(s, model.gameById, { category: c, playerCount: model.playerCount ?? null })]));
  }
  return out;
}

export function summary(model) {
  return model.group;
}

// Archive rows (STAT-09): what the list and its score track need, newest first.
export function summaries(model) {
  return model.games.map((g) => ({
    id: g.id, date: g.date, map: g.map, player_count: g.results.length, generations: g.generations,
    winners: g.winners, margin: g.margin, decided_by_mc: g.decidedByMc,
    scores: g.results.map((r) => ({ player_id: r.player_id, position: r.position, total: r.total, corporation: r.corporation })),
  }));
}

const bestUnlocks = (g) => {
  const best = {};
  for (const a of g.achievementsUnlocked) {
    const k = `${a.player_id}|${a.code}`;
    if (!best[k] || best[k].level < a.level) best[k] = { player_id: a.player_id, code: a.code, level: a.level };
  }
  return Object.values(best).sort((a, b) => (a.player_id + a.code < b.player_id + b.code ? -1 : 1));
};

const stolenAwards = (g) => g.awards
  .filter((a) => a.first_place.length === 1 && a.first_place[0] !== a.opened_by)
  .map((a) => ({ award: a.name, player_id: a.first_place[0], opened_by: a.opened_by }));

function recordsOfGame(ctx, nearRecords) {
  return {
    records_broken: ctx.filter((c) => c.broken).map(({ broken: b }) => ({
      code: b.code, value: b.value, player_id: b.player_id, holders: b.holders, previous: b.previous,
    })),
    records_tied: ctx.filter((c) => c.tied).map((c) => ({ code: c.def.code, value: c.tied.value, holders: c.tied.holders })),
    near: nearRecords(ctx).map((c) => ({
      code: c.def.code, gap: c.gap, value: c.best.value, player_id: c.best.player_id, before: c.before.value,
    })),
  };
}

// Game report (STAT-10), always over all games.
export function reports(model, { gameRecordContext, nearRecords }) {
  return byId(model.games.slice().reverse().map((g) => [g.id, {
    winners: g.winners, margin: g.margin, decided_by_mc: g.decidedByMc,
    ...recordsOfGame(gameRecordContext(g, model), nearRecords),
    achievements: bestUnlocks(g),
    stolen_awards: stolenAwards(g),
  }]));
}

export function buildGolden(model, extra = {}) {
  return {
    ...extra,
    positions: positions(model),
    elo: elo(model),
    records: records(model),
    achievements: achievements(model),
    players: players(model),
    head_to_head: model.h2h,
    seasons: seasons(model),
    feed: model.feed,
    summary: summary(model),
    lead_changes: model.leadChanges,
    summaries: summaries(model),
  };
}
