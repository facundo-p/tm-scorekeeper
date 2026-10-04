// Datos de ejemplo fijos de la galería (D-45): los mismos que muestra #galeria del mockup.
import type { CubeColor, PlayerLike, TabItem } from '@/ui/atoms'

export const CUBE_COLORS: CubeColor[] = ['rojo', 'verde', 'azul', 'amarillo', 'negro', 'naranja', 'violeta', 'rosa', 'blanco', 'gris']

export const SAMPLE_PLAYER: PlayerLike = { id: 'p-facu', name: 'Facu', color: 'rojo' }

export const SAMPLE_EXPANSIONS = ['Prelude', 'Colonies', 'Turmoil', 'Venus next']

export const SAMPLE_TABS: TabItem[] = [
  { id: 'a', label: 'Resumen', icon: 'chart' },
  { id: 'b', label: 'Partidas', icon: 'games', count: 38 },
]

export const MEDAL_TIERS = [0, 1, 2, 3, 4, 5]

// Galería de instrumentos (F27, D-73): los datos salen de la API de la candidata (tm_parity), como
// MODEL en el mockup; solo el orden de los jugadores es fijo, el de PLAYERS_SEED del mockup.
export const SAMPLE_GAME_ID = 'g-063'
export const GALLERY_PLAYER_ORDER = ['p-facu', 'p-nico', 'p-juli', 'p-caro', 'p-tomi', 'p-meli', 'p-santi', 'p-lu', 'p-gonza', 'p-pato']
