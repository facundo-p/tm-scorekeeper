// #galeria: every atom and instrument on one page, with fixed example data, so the
// comparison harness can check the building blocks before the screens exist.
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
    <${Section} title="Vacío"><${Empty} icon="search" title="Ninguna partida coincide">Probá con otro filtro.</${Empty}></${Section}>`;
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
    <${Section} title="Cara a cara y pista de TR"><${H2HMatrix} players=${players} /><${TRTrack} game=${g} /></${Section}>
    <${Section} title="Estados"><${LoadingState} /><${ErrorState} onRetry=${() => {}} /></${Section}>`;
}

export function Gallery() {
  return html`<header class="screen-head"><div><h1 class="screen-head__title">Galería</h1>
    <p class="screen-head__sub">Átomos e instrumentos del sistema visual, con datos de ejemplo.</p></div></header>
    <${Atoms} /><${Instruments} />`;
}
