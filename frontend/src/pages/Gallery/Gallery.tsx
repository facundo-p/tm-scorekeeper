// /__galeria (solo con `vite --mode parity`): los átomos del sistema visual con datos fijos,
// para compararlos con #galeria del mockup (escenarios gal-atoms y gal-sheet, D-42).
import { Frame, ScreenHead } from '@/ui/frame'
import {
  Buttons, ChipsBadgesTabs, CorpsMapsExpansions, CubesAndPlayers, DeltasReadoutsTiers, EmptySection, Fields, SheetDemo, States,
} from './sections'

export default function Gallery() {
  return (
    <Frame screen="gallery" variant="plain">
      <ScreenHead title="Galería" sub="Átomos, campos y estados del sistema visual, con datos de ejemplo." />
      <Buttons /><CubesAndPlayers /><CorpsMapsExpansions /><ChipsBadgesTabs /><DeltasReadoutsTiers />
      <EmptySection /><Fields /><States /><SheetDemo />
    </Frame>
  )
}
