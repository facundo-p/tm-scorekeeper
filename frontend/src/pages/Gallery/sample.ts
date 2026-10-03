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
