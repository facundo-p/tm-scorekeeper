// /__galeria (solo con `vite --mode parity`): los átomos del sistema visual con datos fijos y, con
// `?parte=instrumentos`, los instrumentos con datos de la API, para compararlos con #galeria del
// mockup (escenarios gal-atoms, gal-sheet y gal-instruments, D-42).
import { useSearchParams } from 'react-router-dom'
import { Frame, ScreenHead } from '@/ui/frame'
import { Instruments } from './instruments'
import {
  Buttons, ChipsBadgesTabs, CorpsMapsExpansions, CubesAndPlayers, DeltasReadoutsTiers, EmptySection, Fields, SheetDemo, States,
} from './sections'

function Atoms() {
  return (
    <>
      <Buttons /><CubesAndPlayers /><CorpsMapsExpansions /><ChipsBadgesTabs /><DeltasReadoutsTiers />
      <EmptySection /><Fields /><States /><SheetDemo />
    </>
  )
}

export default function Gallery() {
  const [params] = useSearchParams()
  const instruments = params.get('parte') === 'instrumentos'
  return (
    <Frame screen="gallery" variant="plain">
      <ScreenHead title={instruments ? 'Galería de instrumentos' : 'Galería'}
        sub={`${instruments ? 'Instrumentos del sistema visual' : 'Átomos, campos y estados del sistema visual'}, con datos de ejemplo.`} />
      {instruments ? <Instruments /> : <Atoms />}
    </Frame>
  )
}
