// Order of the games archive (#65). Default: date, newest first. Ties: by date
// (newest first) for the other columns, and by number of players (fewest first)
// when sorting by date. Only the date order groups the list by month.
export const SORTS = [
  { id: 'date', label: 'Fecha' },
  { id: 'winner', label: 'Ganador' },
  { id: 'map', label: 'Mapa' },
  { id: 'players', label: 'Jugadores' },
];
export const DEFAULT_SORT = { by: 'date', dir: 'desc' };

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const byDate = (a, b) => cmp(a.date, b.date) || cmp(a.id, b.id);
const KEYS = {
  winner: (g, name) => name(g.winners[0]),
  map: (g) => g.map,
  players: (g) => g.results.length,
};

function compareKey(by, name) {
  const key = KEYS[by];
  return (a, b) => {
    const x = key(a, name);
    const y = key(b, name);
    return typeof x === 'string' ? x.localeCompare(y, 'es') : x - y;
  };
}

// `name(playerId)` resolves the winner's name for the "winner" column.
export function sortGames(games, { by, dir }, name) {
  const sign = dir === 'asc' ? 1 : -1;
  if (by === 'date') {
    return games.slice().sort((a, b) => sign * byDate(a, b) || a.results.length - b.results.length);
  }
  const primary = compareKey(by, name);
  return games.slice().sort((a, b) => sign * primary(a, b) || -byDate(a, b));
}

// Clicking the active column flips its direction; another column starts descending.
export const nextSort = (cur, by) => (cur.by === by ? { by, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { by, dir: 'desc' });
