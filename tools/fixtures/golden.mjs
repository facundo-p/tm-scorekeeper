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
  };
}
