import { useMemo, useState, type ReactNode } from 'react'
import { PlanetContext } from './context'
import type { PlanetStage } from './stage'

/** Comparte el motor entre el lienzo (en la capa `.fx` del marco) y los slots de las pantallas (D-71). */
export function PlanetProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<PlanetStage | null>(null)
  const value = useMemo(() => ({ stage, setStage }), [stage])
  return <PlanetContext.Provider value={value}>{children}</PlanetContext.Provider>
}
