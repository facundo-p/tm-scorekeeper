// Etapa sin WebGL2 (o si el motor no cargó o no compiló): los slots pintan el globo CSS.
// Vive fuera del chunk del motor para que `PlanetCanvas` la pueda usar si falla su import().
import type { PlanetStage } from './stage'

export const setPlanetState = (state: 'ready' | 'fallback' | null) => {
  if (state) document.documentElement.dataset.planet = state
  else delete document.documentElement.dataset.planet
}

export function fallbackStage(): PlanetStage {
  setPlanetState('fallback')
  return { supported: false, addSlot: () => ({ update() {}, remove() {} }), destroy: () => setPlanetState(null) }
}
