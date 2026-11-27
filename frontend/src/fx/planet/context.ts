import { createContext, useContext } from 'react'
import type { PlanetStage } from './stage'

export interface PlanetContextValue {
  stage: PlanetStage | null
  setStage: (stage: PlanetStage | null) => void
}

export const PlanetContext = createContext<PlanetContextValue>({ stage: null, setStage: () => {} })

/** El motor del planeta, o null mientras se carga (o fuera del proveedor). */
export const usePlanetStage = () => useContext(PlanetContext).stage
