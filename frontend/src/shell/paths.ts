// Rutas de la app (D-02): castellano, como el mockup. Las pantallas usan estas funciones en vez
// de escribir rutas a mano.
export const PATHS = {
  login: '/acceso',
  home: '/',
  games: '/partidas',
  game: (id: string) => `/partidas/${encodeURIComponent(id)}`,
  ceremony: (id: string) => `/partidas/${encodeURIComponent(id)}/ceremonia`,
  edit: (id: string) => `/partidas/${encodeURIComponent(id)}/editar`,
  register: '/registrar',
  ranking: '/ranking',
  profile: (id: string) => `/jugadores/${encodeURIComponent(id)}`,
  records: '/records',
  achievements: '/logros',
} as const

/** Sección de la navegación que se resalta para cada pantalla. */
export type Section = 'home' | 'games' | 'register' | 'ranking' | 'trophies'

export interface NavItem {
  id: Section
  to: string
  label: string
  icon: string
  primary?: boolean
}

export const NAV: NavItem[] = [
  { id: 'home', to: PATHS.home, label: 'Inicio', icon: 'home' },
  { id: 'games', to: PATHS.games, label: 'Partidas', icon: 'games' },
  { id: 'register', to: PATHS.register, label: 'Registrar', icon: 'plus', primary: true },
  { id: 'ranking', to: PATHS.ranking, label: 'Ranking', icon: 'ranking' },
  { id: 'trophies', to: PATHS.records, label: 'Trofeos', icon: 'trophyNav' },
]

/** Sección según la ruta (null fuera de la navegación: 404). */
export function sectionOf(pathname: string): Section | null {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/partidas')) return 'games'
  if (pathname.startsWith('/registrar')) return 'register'
  if (pathname.startsWith('/ranking') || pathname.startsWith('/jugadores')) return 'ranking'
  if (pathname.startsWith('/records') || pathname.startsWith('/logros')) return 'trophies'
  return null
}
