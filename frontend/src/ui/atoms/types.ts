export type CubeColor =
  | 'rojo' | 'verde' | 'azul' | 'amarillo' | 'negro' | 'naranja' | 'violeta' | 'rosa' | 'blanco' | 'gris'

/** Lo mínimo de un jugador que necesitan los átomos. */
export interface PlayerLike {
  id: string
  name: string
  color: CubeColor | string
}

export type Size = 's' | 'm' | 'l'
