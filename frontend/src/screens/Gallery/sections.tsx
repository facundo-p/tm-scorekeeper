import { useState, type ReactNode } from 'react'
import { MAP_ORDER } from '@/domain/catalog'
import {
  Button, Chip, CorpEmblem, Cube, Delta, Empty, ExpansionTags, Field, MapBadge, Medal, NewBadge, NumberField, Plate,
  PlayerTag, Readout, SectionHead, SelectField, Switch, Tabs, TextField, TierPips,
} from '@/ui/atoms'
import { Sheet, SheetActions } from '@/ui/sheet'
import { ErrorState, LoadingState } from '@/ui/states'
import { CUBE_COLORS, MEDAL_TIERS, SAMPLE_EXPANSIONS, SAMPLE_PLAYER, SAMPLE_TABS } from './sample'
import styles from './Gallery.module.css'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Plate className={styles.gallery__sec} label={title}>
      <SectionHead title={title} />
      <div className={styles.gallery__row}>{children}</div>
    </Plate>
  )
}

export function Buttons() {
  return (
    <Section title="Botones">
      <Button variant="primary" icon="plus">Registrar</Button><Button>Secundario</Button>
      <Button variant="ghost" icon="filter">Fantasma</Button><Button variant="danger">Eliminar</Button>
      <Button size="s">Chico</Button><Button disabled>Deshabilitado</Button><Button icon="close" label="Cerrar" />
    </Section>
  )
}

export function CubesAndPlayers() {
  return (
    <Section title="Cubos y jugadores">
      {CUBE_COLORS.map((c) => <Cube key={c} color={c} size={22} label={c} />)}
      <PlayerTag player={SAMPLE_PLAYER} /><PlayerTag player={SAMPLE_PLAYER} size="l" sub="1172" />
      <PlayerTag player={SAMPLE_PLAYER} size="s" link={false} />
    </Section>
  )
}

export function CorpsMapsExpansions() {
  return (
    <Section title="Corporaciones, mapas y expansiones">
      <CorpEmblem name="Ecoline" /><CorpEmblem name="Point Luna" withName /><CorpEmblem name="Helion" size="s" />
      {MAP_ORDER.map((m) => <MapBadge key={m} map={m} />)}
      <ExpansionTags expansions={SAMPLE_EXPANSIONS} draft />
    </Section>
  )
}

export function ChipsBadgesTabs() {
  const [tab, setTab] = useState('a')
  return (
    <Section title="Chips, insignias y pestañas">
      <Chip icon="generation">11 generaciones</Chip><Chip tone="gold">Récord</Chip><NewBadge />
      <Tabs items={SAMPLE_TABS} value={tab} onChange={setTab} label="Pestañas de ejemplo" />
    </Section>
  )
}

export function DeltasReadoutsTiers() {
  return (
    <Section title="Deltas, lecturas y niveles">
      <Delta value={12} /><Delta value={-7} /><Delta value={0} />
      <Readout label="Partidas" value="38" /><Readout label="Mejor" value="130" sub="puntos" accent />
      {MEDAL_TIERS.map((t) => <Medal key={t} glyph="trophy" tier={t} />)}
      <TierPips tier={3} max={5} />
    </Section>
  )
}

export function EmptySection() {
  return <Section title="Vacío"><Empty icon="search" title="Ninguna partida coincide">Probá con otro filtro.</Empty></Section>
}

const MAP_OPTIONS = MAP_ORDER.map((m) => ({ value: m, label: m }))

export function Fields() {
  const [name, setName] = useState('Facu')
  const [map, setMap] = useState(MAP_ORDER[0])
  const [gens, setGens] = useState(11)
  const [draft, setDraft] = useState(true)
  return (
    <Section title="Campos">
      <TextField label="Nombre" value={name} onChange={setName} />
      <SelectField label="Mapa" value={map} onChange={setMap} options={MAP_OPTIONS} />
      <NumberField label="Generaciones" value={gens} min={1} max={30} onChange={setGens} />
      <Field as="div" label="Draft"><Switch checked={draft} onChange={setDraft}>{draft ? 'Con draft' : 'Sin draft'}</Switch></Field>
    </Section>
  )
}

export function States() {
  return <Section title="Estados"><LoadingState /><ErrorState onRetry={() => {}} /></Section>
}

export function SheetDemo() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <Section title="Hoja">
      <Button icon="info" onClick={() => setOpen(true)}>Abrir hoja</Button>
      {open && (
        <Sheet title="Hoja de ejemplo" onClose={close}>
          <p>En el teléfono sube desde abajo; en pantallas anchas es un diálogo centrado. Escape o el fondo la cierran.</p>
          <SheetActions><Button variant="ghost" onClick={close}>Cancelar</Button><Button variant="primary" icon="check" onClick={close}>Aceptar</Button></SheetActions>
        </Sheet>
      )}
    </Section>
  )
}
