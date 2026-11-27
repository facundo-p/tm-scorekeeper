// Enlaces del mockup (#hash) → rutas de la app (D-02), para comparar el árbol de accesibilidad:
// el mismo enlace se escribe `#partida-g-063` en el mockup y `/partidas/g-063` en la app.
const SIMPLE = { inicio: '/', acceso: '/acceso', partidas: '/partidas', registrar: '/registrar', ranking: '/ranking',
  records: '/records', logros: '/logros', galeria: '/__galeria' };
const PREFIXED = [['partida-', (id) => `/partidas/${id}`], ['ceremonia-', (id) => `/partidas/${id}/ceremonia`],
  ['editar-', (id) => `/partidas/${id}/editar`], ['jugador-', (id) => `/jugadores/${id}`]];

export function hashToPath(hash) {
  const raw = hash.replace(/^#/, '');
  const cut = raw.indexOf('?');
  const name = cut < 0 ? raw : raw.slice(0, cut);
  const query = cut < 0 ? '' : raw.slice(cut);
  if (SIMPLE[name]) return `${SIMPLE[name]}${query}`;
  const prefixed = PREFIXED.find(([p]) => name.startsWith(p));
  return prefixed ? `${prefixed[1](name.slice(prefixed[0].length))}${query}` : hash;
}

/** Reescribe las líneas `/url: "#…"` de un snapshot de accesibilidad del mockup. */
export const normalizeAriaUrls = (snapshot) =>
  snapshot.replace(/\/url: "?(#[^"\n]*)"?/g, (_, hash) => `/url: ${hashToPath(hash)}`);
