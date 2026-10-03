// Tiny router: screen state lives in memory and mirrors to a plain #token, so the
// browser's back button works and any screen can be deep-linked.
import { createContext, useContext } from './lib.js';

export const NavCtx = createContext(null);
export const useNav = () => useContext(NavCtx);

const SIMPLE = { acceso: 'login', inicio: 'home', partidas: 'games', registrar: 'register', ranking: 'ranking', records: 'records', logros: 'achievements' };
const SIMPLE_REV = Object.fromEntries(Object.entries(SIMPLE).map(([k, v]) => [v, k]));
const PREFIXED = { 'partida-': 'game', 'ceremonia-': 'ceremony', 'jugador-': 'profile' };

export function toHash(route) {
  if (SIMPLE_REV[route.name]) return SIMPLE_REV[route.name];
  const prefix = Object.keys(PREFIXED).find((k) => PREFIXED[k] === route.name);
  return prefix ? `${prefix}${route.params.id}` : 'inicio';
}

export function parseHash(hash) {
  const h = hash.replace(/^#/, '');
  if (SIMPLE[h]) return { name: SIMPLE[h], params: {} };
  for (const [prefix, name] of Object.entries(PREFIXED)) {
    if (h.startsWith(prefix)) return { name, params: { id: h.slice(prefix.length) } };
  }
  return null;
}

// Which nav section a screen belongs to (for the rail/dock highlight).
export const SECTION = {
  home: 'home', games: 'games', game: 'games', register: 'register', ceremony: 'games',
  ranking: 'ranking', profile: 'ranking', records: 'trophies', achievements: 'trophies', login: null,
};
