// #galeria: the atoms (and, with ?parte=instrumentos, the instruments) on a plain page
// with fixed example data, so the harness compares the building blocks before the
// screens exist (D-42).
import { html, useState } from '../lib.js';
import { MODEL } from '../data/derive.js';
import { MAP_ORDER } from '../data/catalog.js';
import {
  Button, Cube, PlayerTag, CorpEmblem, MapBadge, ExpansionTags, Chip, NewBadge, Tabs, Delta, Readout, TierPips, Medal,
  Empty, Plate, SectionHead,
} from '../ui/atoms.js';
import {
  Thermometer, OxygenArc, OceanSlots, ScoreTrack, CategoryLegend, ScoreBars, CompositionBar, Sparkline, FormStrip,
  EloChart, H2HMatrix, TRTrack, EloShift,
} from '../ui/instruments.js';
import { LoadingState, ErrorState } from '../ui/states.js';
import { Sheet } from '../ui/sheet.js';
import { Stepper2 } from './register.js';

const COLORS = ['rojo', 'verde', 'azul', 'amarillo', 'negro', 'naranja', 'violeta', 'rosa', 'blanco', 'gris'];
const G = () => MODEL.gameById['g-063'];
const facu = () => MODEL.playerById['p-facu'];

function Section({ title, children }) {
  return html`<${Plate} class="gallery__sec" label=${title}><${SectionHead} title=${title} /><div class="gallery__row">${children}</div></${Plate}>`;
}

function Atoms() {
  const [tab, setTab] = useState('a');
  return html`
    <${Section} title="Botones">
      <${Button} variant="primary" icon="plus">Registrar</${Button}><${Button}>Secundario</${Button}>
      <${Button} variant="ghost" icon="filter">Fantasma</${Button}><${Button} variant="danger">Eliminar</${Button}>
      <${Button} size="s">Chico</${Button}><${Button} disabled>Deshabilitado</${Button}><${Button} icon="close" label="Cerrar" />
    </${Section}>
    <${Section} title="Cubos y jugadores">
      ${COLORS.map((c) => html`<${Cube} color=${c} size=${22} label=${c} />`)}
      <${PlayerTag} player=${facu()} /><${PlayerTag} player=${facu()} size="l" sub="1172" /><${PlayerTag} player=${facu()} size="s" link=${false} />
    </${Section}>
    <${Section} title="Corporaciones, mapas y expansiones">
      <${CorpEmblem} name="Ecoline" /><${CorpEmblem} name="Point Luna" withName /><${CorpEmblem} name="Helion" size="s" />
      ${MAP_ORDER.map((m) => html`<${MapBadge} map=${m} />`)}
      <${ExpansionTags} expansions=${['Prelude', 'Colonies', 'Turmoil', 'Venus next']} draft />
    </${Section}>
    <${Section} title="Chips, insignias y pestañas">
      <${Chip} icon="generation">11 generaciones</${Chip}><${Chip} tone="gold">Récord</${Chip}><${NewBadge} />
      <${Tabs} items=${[{ id: 'a', label: 'Resumen', icon: 'chart' }, { id: 'b', label: 'Partidas', icon: 'games', count: 38 }]}
        value=${tab} onChange=${setTab} label="Pestañas de ejemplo" />
    </${Section}>
    <${Section} title="Deltas, lecturas y niveles">
      <${Delta} value=${12} /><${Delta} value=${-7} /><${Delta} value=${0} />
      <${Readout} label="Partidas" value="38" /><${Readout} label="Mejor" value="130" sub="puntos" accent />
      ${[0, 1, 2, 3, 4, 5].map((t) => html`<${Medal} glyph="trophy" tier=${t} />`)}
      <${TierPips} tier=${3} max=${5} />
    </${Section}>
    <${Section} title="Vacío"><${Empty} icon="search" title="Ninguna partida coincide">Probá con otro filtro.</${Empty}></${Section}>
    <${Fields} />
    <${Section} title="Estados"><${LoadingState} /><${ErrorState} onRetry=${() => {}} /></${Section}>
    <${SheetDemo} />`;
}

function Fields() {
  const [gens, setGens] = useState(11);
  const [draft, setDraft] = useState(true);
  return html`<${Section} title="Campos">
    <label class="field"><span class="field__label">Nombre</span><input class="input" type="text" value="Facu" /></label>
    <label class="field"><span class="field__label">Mapa</span>
      <select class="input">${MAP_ORDER.map((m) => html`<option>${m}</option>`)}</select></label>
    <div class="field"><span class="field__label" id="gal-gens">Generaciones</span>
      <${Stepper2} value=${gens} min=${1} max=${30} labelledby="gal-gens" onChange=${setGens} /></div>
    <div class="field"><span class="field__label">Draft</span>
      <label class="switch"><input type="checkbox" checked=${draft} onChange=${(e) => setDraft(e.target.checked)} />
        <span class="switch__track"></span><span>${draft ? 'Con draft' : 'Sin draft'}</span></label></div>
  </${Section}>`;
}

function SheetDemo() {
  const [open, setOpen] = useState(false);
  return html`<${Section} title="Hoja">
    <${Button} icon="info" onClick=${() => setOpen(true)}>Abrir hoja</${Button}>
    ${open && html`<${Sheet} title="Hoja de ejemplo" onClose=${() => setOpen(false)}>
      <p>En el teléfono sube desde abajo; en pantallas anchas es un diálogo centrado. Escape o el fondo la cierran.</p>
      <div class="sheet-actions">
        <${Button} variant="ghost" onClick=${() => setOpen(false)}>Cancelar</${Button}>
        <${Button} variant="primary" icon="check" onClick=${() => setOpen(false)}>Aceptar</${Button}>
      </div>
    </${Sheet}>`}
  </${Section}>`;
}

function Instruments() {
  const g = G();
  const players = MODEL.players.filter((p) => p.active && p.games);
  return html`
    <${Section} title="Parámetros globales"><${Thermometer} value=${-4} /><${OxygenArc} value=${9} /><${OceanSlots} value=${6} /></${Section}>
    <${Section} title="Puntaje"><${ScoreTrack} game=${g} /><${CategoryLegend} /><${ScoreBars} game=${g} showTable /></${Section}>
    <${Section} title="Composición y forma">
      <${CompositionBar} share=${facu().composition.share} label="Facu" />
      <${Sparkline} values=${facu().eloSeries.map((s) => s.elo)} /><${FormStrip} form=${facu().form} />
    </${Section}>
    <${Section} title="ELO"><${EloChart} players=${players} highlight=${['p-facu']} /><${EloShift} game=${g} /></${Section}>
    <${Section} title="Cara a cara y pista de TR"><${H2HMatrix} players=${players} /><${TRTrack} game=${g} /></${Section}>`;
}

export function Gallery({ query = {} }) {
  const instruments = query.parte === 'instrumentos';
  return html`<header class="screen-head"><div><h1 class="screen-head__title">${instruments ? 'Galería de instrumentos' : 'Galería'}</h1>
    <p class="screen-head__sub">${instruments ? 'Instrumentos del sistema visual' : 'Átomos, campos y estados del sistema visual'}, con datos de ejemplo.</p></div></header>
    ${instruments ? html`<${Instruments} />` : html`<${Atoms} />`}`;
}
