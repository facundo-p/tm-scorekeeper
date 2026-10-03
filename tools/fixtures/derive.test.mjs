// Edge cases of the reference semantics (docs/redesign/SEMANTICS.md) implemented in
// docs/redesign/mockup/js/data/derive.js. Run: node --test tools/fixtures/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODEL, gameBest, stepRecord, gameRecordContext, nearRecords } from '../../docs/redesign/mockup/js/data/derive.js';
import { RECORDS } from '../../docs/redesign/mockup/js/data/catalog.js';
import { sortGames, nextSort } from '../../docs/redesign/mockup/js/data/sort.js';
import { monthsBefore } from '../../docs/redesign/mockup/js/clock.js';

const def = (code) => RECORDS.find((r) => r.code === code);
const game = (id, date, totals, extra = {}) => ({
  id, date, map: 'Tharsis', generations: 10,
  results: totals.map(([pid, total], i) => ({ player_id: pid, total, position: i + 1, mc: 0,
    scores: { terraform_rating: total, card_points: 0, card_resource_points: 0, greenery_points: 0, city_points: 0, turmoil_points: null } })),
  winners: [totals[0][0]], margin: totals.length > 1 ? totals[0][1] - totals[1][1] : 0, ...extra,
});

test('the first game sets a record without breaking it', () => {
  const d = def('highest_single_game_score');
  const g = game('g1', '2025-01-01', [['a', 80], ['b', 70]]);
  const { next, broken } = stepRecord(d, undefined, gameBest(d, g), g);
  assert.equal(broken, undefined);
  assert.equal(next.value, 80);
  assert.deepEqual(next.history.map((h) => h.kind), ['set']);
});

test('beating a record breaks it once even if several players beat it', () => {
  const d = def('highest_single_game_score');
  const g1 = game('g1', '2025-01-01', [['a', 80], ['b', 70]]);
  const s1 = stepRecord(d, undefined, gameBest(d, g1), g1).next;
  const g2 = game('g2', '2025-01-08', [['b', 95], ['c', 90]]);
  const { next, broken } = stepRecord(d, s1, gameBest(d, g2), g2);
  assert.equal(broken.value, 95);
  assert.deepEqual(broken.holders, ['b']);
  assert.deepEqual(broken.previous.holders, ['a']);
  assert.deepEqual(next.holders.map((h) => h.player_id), ['b']);
});

test('two players reaching the new best in the same game are co-holders of one break', () => {
  const d = def('highest_single_game_score');
  const g1 = game('g1', '2025-01-01', [['a', 80], ['b', 70]]);
  const s1 = stepRecord(d, undefined, gameBest(d, g1), g1).next;
  const g2 = game('g2', '2025-01-08', [['b', 95], ['c', 95]]);
  const { next, broken } = stepRecord(d, s1, gameBest(d, g2), g2);
  assert.deepEqual(broken.holders, ['b', 'c']);
  assert.equal(next.history.filter((h) => h.kind === 'broken').length, 1);
});

test('matching a record adds a co-holder without breaking it', () => {
  const d = def('highest_single_game_score');
  const g1 = game('g1', '2025-01-01', [['a', 80], ['b', 70]]);
  const s1 = stepRecord(d, undefined, gameBest(d, g1), g1).next;
  const g2 = game('g2', '2025-01-08', [['c', 80], ['a', 60]]);
  const { next, broken } = stepRecord(d, s1, gameBest(d, g2), g2);
  assert.equal(broken, undefined);
  assert.deepEqual(next.holders.map((h) => h.player_id), ['a', 'c']);
  assert.equal(next.history.at(-1).kind, 'tied');
});

test('higher-is-better records ignore 0; closest win keeps a 0 margin', () => {
  const turmoil = def('highest_turmoil_points');
  assert.equal(gameBest(turmoil, game('g', '2025-01-01', [['a', 50], ['b', 40]])), null);
  const closest = def('closest_win');
  const tie = game('g', '2025-01-01', [['a', 50], ['b', 50]], { margin: 0 });
  assert.equal(gameBest(closest, tie).value, 0);
});

test('records on the example: one break per record per game, none on the first game', () => {
  const first = MODEL.gameById['g-001'];
  assert.equal(first.recordsBroken.length, 0);
  for (const g of MODEL.games) {
    const codes = g.recordsBroken.map((b) => b.code);
    assert.equal(new Set(codes).size, codes.length, g.id);
  }
});

test('ties share the first position and are all winners', () => {
  for (const g of MODEL.games) {
    assert.deepEqual(g.winners, g.results.filter((r) => r.position === 1).map((r) => r.player_id));
    for (const r of g.results) {
      const mates = g.results.filter((x) => x.position === r.position).length;
      assert.equal(r.tied, mates > 1, `${g.id} ${r.player_id}`);
    }
  }
});

test('near records: at most 3, never broken, gap ≤ 3, closest first', () => {
  for (const g of MODEL.games) {
    const near = nearRecords(gameRecordContext(g, MODEL));
    assert.ok(near.length <= 3);
    assert.ok(near.every((c) => !c.broken && c.gap <= 3));
    assert.deepEqual(near.map((c) => c.gap), near.map((c) => c.gap).slice().sort((a, b) => a - b));
  }
});

test('archive order: date desc by default, other columns tie-break by date desc', () => {
  const name = (id) => MODEL.playerById[id].name;
  const byDate = sortGames(MODEL.games, { by: 'date', dir: 'desc' }, name);
  assert.equal(byDate[0].id, 'g-063');
  const byMap = sortGames(MODEL.games, { by: 'map', dir: 'asc' }, name);
  for (let i = 1; i < byMap.length; i++) {
    const [a, b] = [byMap[i - 1], byMap[i]];
    assert.ok(a.map.localeCompare(b.map, 'es') < 0 || (a.map === b.map && a.date >= b.date));
  }
  assert.deepEqual(nextSort({ by: 'map', dir: 'desc' }, 'map'), { by: 'map', dir: 'asc' });
  assert.deepEqual(nextSort({ by: 'map', dir: 'asc' }, 'date'), { by: 'date', dir: 'desc' });
});

const mini = (id, date, n, map = 'Tharsis', winner = 'a') => ({ id, date, map, winners: [winner], results: Array.from({ length: n }, () => ({})) });

test('date order: same day ties by fewest players, then id', () => {
  const games = [mini('g-3', '2025-01-01', 4), mini('g-1', '2025-01-01', 2), mini('g-2', '2025-01-02', 3), mini('g-4', '2025-01-01', 2)];
  const name = (id) => id;
  assert.deepEqual(sortGames(games, { by: 'date', dir: 'asc' }, name).map((g) => g.id), ['g-1', 'g-4', 'g-3', 'g-2']);
  assert.deepEqual(sortGames(games, { by: 'date', dir: 'desc' }, name).map((g) => g.id), ['g-2', 'g-4', 'g-1', 'g-3']);
});

test('other columns tie-break by date, newest first', () => {
  const games = [mini('g-1', '2025-01-01', 3, 'Hellas'), mini('g-2', '2025-02-01', 3, 'Hellas'), mini('g-3', '2025-01-15', 4, 'Elysium')];
  const name = (id) => id;
  assert.deepEqual(sortGames(games, { by: 'map', dir: 'desc' }, name).map((g) => g.id), ['g-2', 'g-1', 'g-3']);
  assert.deepEqual(sortGames(games, { by: 'players', dir: 'asc' }, name).map((g) => g.id), ['g-2', 'g-1', 'g-3']);
  assert.deepEqual(sortGames(games, { by: 'winner', dir: 'asc' }, name).map((g) => g.id), ['g-2', 'g-3', 'g-1']);
});

test('months before clamps to the end of the target month', () => {
  assert.equal(monthsBefore('2026-03-31', 1), '2026-02-28');
  assert.equal(monthsBefore('2024-03-30', 1), '2024-02-29');
  assert.equal(monthsBefore('2026-09-27', 3), '2026-06-27');
  assert.equal(monthsBefore('2026-01-15', 2), '2025-11-15');
});

test('routes: hash round trip with special characters, query and malformed ids', async () => {
  const { toHash, parseHash } = await import('../../docs/redesign/mockup/js/routes.js');
  const route = { name: 'profile', params: { id: 'p a/b?c' }, query: { tab: 'logros', mesa: '3' } };
  assert.deepEqual(parseHash(`#${toHash(route)}`), route);
  assert.deepEqual(parseHash('#records?mapa=Terra%20Cimmeria&exp=Turmoil').query, { mapa: 'Terra Cimmeria', exp: 'Turmoil' });
  assert.equal(parseHash('#jugador-%E0%A4%A').name, 'notFound');
  assert.equal(parseHash('#no-existe').name, 'notFound');
  assert.equal(parseHash(''), null);
});

test('equity: expected wins, ratio and relative position', async () => {
  const { modelFor } = await import('../../docs/redesign/mockup/js/data/derive.js');
  const p = modelFor().playerById['p-facu'];
  const rows = p.history;
  const expected = rows.reduce((s, h) => s + 1 / h.n, 0);
  assert.ok(Math.abs(p.equity.expected - expected) < 1e-9);
  assert.ok(Math.abs(p.equity.winsVsExpected - (p.wins - expected)) < 1e-9);
  const rel = rows.reduce((s, h) => s + (h.n - h.position) / (h.n - 1), 0) / rows.length;
  assert.ok(Math.abs(p.equity.relPos - rel) < 1e-9);
  assert.deepEqual(p.byTable.map((r) => r.n), [2, 3, 4, 5]);
  assert.equal(p.byTable.reduce((s, r) => s + r.games, 0), p.games);
});

test('table filter replays ELO from 1000 and never touches other tables', async () => {
  const { modelFor } = await import('../../docs/redesign/mockup/js/data/derive.js');
  const m3 = modelFor({ playerCount: 3 });
  assert.ok(m3.games.every((g) => g.results.length === 3));
  const first = m3.games[m3.games.length - 1];
  assert.ok(first.eloChanges.every((c) => c.before === 1000));
});

test('season race: averages, 3 games to qualify, D-15 champion', async () => {
  const { seasonRace, MIN_SEASON_GAMES } = await import('../../docs/redesign/mockup/js/data/derive.js');
  for (const s of MODEL.seasons) {
    const race = seasonRace(s, MODEL.gameById);
    assert.ok(race.qualified.every((r) => r.games >= MIN_SEASON_GAMES));
    assert.ok(race.pending.every((r) => r.games < MIN_SEASON_GAMES && r.missing === MIN_SEASON_GAMES - r.games));
    for (let i = 1; i < race.qualified.length; i++) {
      const [a, b] = [race.qualified[i - 1], race.qualified[i]];
      assert.ok(a.avg > b.avg || (a.avg === b.avg && (a.games > b.games || (a.games === b.games && a.best >= b.best))));
    }
    assert.equal(s.champion, s.end ? race.qualified[0]?.player_id ?? null : null);
  }
});

test('season race: Turmoil only over games with Turmoil; D-15 tie-breaks', async () => {
  const { seasonRace } = await import('../../docs/redesign/mockup/js/data/derive.js');
  const s = MODEL.seasons[0];
  const race = seasonRace(s, MODEL.gameById, { category: 'turmoil_points' });
  const withTurmoil = s.games.filter((id) => MODEL.gameById[id].expansions.includes('Turmoil')).length;
  assert.equal(race.games, s.games.length);
  assert.ok([...race.qualified, ...race.pending].every((r) => r.games <= withTurmoil));
  const g = (id, rows) => ({ id, expansions: [], results: rows.map(([player_id, total]) => ({ player_id, total, scores: {} })) });
  const games = { a: g('a', [['x', 90], ['y', 90]]), b: g('b', [['x', 80], ['y', 100]]), c: g('c', [['x', 100], ['y', 80]]), d: g('d', [['x', 90]]) };
  const tie = seasonRace({ games: ['a', 'b', 'c', 'd'] }, games);
  assert.deepEqual(tie.qualified.map((r) => r.player_id), ['x', 'y']);
});

test('season race: best game, then player id; no champion without qualifiers', async () => {
  const { seasonRace } = await import('../../docs/redesign/mockup/js/data/derive.js');
  const g = (id, rows) => ({ id, expansions: [], results: rows.map(([player_id, total]) => ({ player_id, total, scores: {} })) });
  const byBest = { a: g('a', [['x', 90], ['y', 100]]), b: g('b', [['x', 90], ['y', 80]]), c: g('c', [['x', 90], ['y', 90]]) };
  assert.deepEqual(seasonRace({ games: ['a', 'b', 'c'] }, byBest).qualified.map((r) => r.player_id), ['y', 'x']);
  const flat = { a: g('a', [['y', 90], ['x', 90]]), b: g('b', [['y', 90], ['x', 90]]), c: g('c', [['y', 90], ['x', 90]]) };
  assert.deepEqual(seasonRace({ games: ['a', 'b', 'c'] }, flat).qualified.map((r) => r.player_id), ['x', 'y']);
  const short = seasonRace({ games: ['a', 'b'] }, flat);
  assert.deepEqual(short.qualified, []);
  assert.deepEqual(short.pending.map((r) => r.missing), [1, 1]);
  const none = seasonRace({ games: ['a', 'b', 'c'] }, flat, { playerCount: 5 });
  assert.deepEqual([none.games, none.qualified, none.pending], [0, [], []]);
});

test('closed seasons crown the race leader, or nobody without qualifiers', () => {
  for (const s of MODEL.seasons.filter((x) => x.end)) {
    assert.equal(s.champion === null, s.race.qualified.length === 0);
  }
});
