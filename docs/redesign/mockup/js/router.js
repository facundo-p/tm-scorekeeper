// Tiny router: screen state lives in memory and mirrors to a plain #token, so the
// browser's back button works and any screen can be deep-linked. Filters and tabs
// travel in the hash as a query: #records?mapa=Tharsis, #jugador-p-facu?tab=partidas
// (the per-screen table filter ?mesa=N arrives in phase 18).
import { createContext, useContext } from './lib.js';

export const NavCtx = createContext(null);
export const useNav = () => useContext(NavCtx);

const SIMPLE = {
  acceso: 'login', inicio: 'home', partidas: 'games', registrar: 'register', ranking: 'ranking', records: 'records',
  logros: 'achievements', galeria: 'gallery',
};
const SIMPLE_REV = Object.fromEntries(Object.entries(SIMPLE).map(([k, v]) => [v, k]));
const PREFIXED = { 'partida-': 'game', 'ceremonia-': 'ceremony', 'jugador-': 'profile', 'editar-': 'edit' };

function queryString(query = {}) {
  const q = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function toHash(route) {
  const q = queryString(route.query);
  if (SIMPLE_REV[route.name]) return `${SIMPLE_REV[route.name]}${q}`;
  const prefix = Object.keys(PREFIXED).find((k) => PREFIXED[k] === route.name);
  return prefix ? `${prefix}${encodeURIComponent(route.params.id)}${q}` : `no-encontrada${q}`;
}

export const hrefOf = (name, params = {}, query = {}) => `#${toHash({ name, params, query })}`;

export function parseHash(hash) {
  const raw = hash.replace(/^#/, '');
  const cut = raw.indexOf('?');
  const h = cut < 0 ? raw : raw.slice(0, cut);
  const qs = cut < 0 ? '' : raw.slice(cut + 1);
  const query = Object.fromEntries(new URLSearchParams(qs));
  if (!h) return null;
  if (SIMPLE[h]) return { name: SIMPLE[h], params: {}, query };
  for (const [prefix, name] of Object.entries(PREFIXED)) {
    if (h.startsWith(prefix)) return { name, params: { id: decodeURIComponent(h.slice(prefix.length)) }, query };
  }
  return { name: 'notFound', params: {}, query };
}

// Which nav section a screen belongs to (for the rail/dock highlight).
export const SECTION = {
  home: 'home', games: 'games', game: 'games', register: 'register', edit: 'games', ceremony: 'games',
  ranking: 'ranking', profile: 'ranking', records: 'trophies', achievements: 'trophies', login: null, notFound: null, gallery: null,
};
