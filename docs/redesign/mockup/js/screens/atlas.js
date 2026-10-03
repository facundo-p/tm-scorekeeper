// Prototype index: every screen and state, the device toggle, and the design notes.
import { html, useEffect, useRef, cls } from '../lib.js';
import { MODEL } from '../data/derive.js';
import { useNav } from '../router.js';
import { Icon } from '../ui/icons.js';
import { registerStart } from './register.js';

const bigGame = MODEL.games.find((g) => g.results.length === 5 && g.expansions.includes('Turmoil')) ?? MODEL.games[3];

const GROUPS = [
  ['Entrada', [
    ['Acceso', 'login', {}, 'Marte sin terraformar; al entrar, el planeta vuela al inicio.'],
    ['Inicio', 'home', {}, 'Temporada en curso, parámetros globales, bitácora.'],
  ]],
  ['Partidas', [
    ['Archivo de partidas', 'games', {}, 'Filtros en una fila, calendario de actividad, pista de puntaje.'],
    ['Informe: última partida', 'game', { id: MODEL.games[0].id }, 'Récords rotos, logros, ELO, hitos y recompensas.'],
    ['Informe: 5 jugadores con Turmoil', 'game', { id: bigGame.id }, `${bigGame.map}, ${bigGame.date}.`],
    ['Ceremonia de fin de partida', 'ceremony', { id: MODEL.games[0].id }, 'La secuencia que se abre al guardar.'],
  ]],
  ['Registrar partida', [
    ['Paso 1: partida', 'register', { step: 0 }, 'Mapa, fecha, generaciones, expansiones.'],
    ['Paso 2: mesa', 'register', { step: 1 }, 'Jugadores y corporaciones.'],
    ['Paso 3: hitos y recompensas', 'register', { step: 2 }, 'Se marcan tocando cubos.'],
    ['Paso 4: puntaje', 'register', { step: 3 }, 'Planilla con totales en vivo.'],
    ['Paso 5: revisión', 'register', { step: 4 }, 'Posiciones y desempate antes de guardar.'],
  ]],
  ['Jugadores', [
    ['Ranking', 'ranking', {}, 'ELO, clasificación, cara a cara, gestión de jugadores.'],
    ['Perfil de Facu', 'profile', { id: 'p-facu' }, 'Líder del ranking.'],
    ['Perfil de Juli', 'profile', { id: 'p-juli' }, 'Ganadora de la última partida.'],
  ]],
  ['Trofeos', [
    ['Salón de récords', 'records', {}, 'Placas con la historia de cada récord.'],
    ['Logros', 'achievements', {}, 'Medallas por material, progreso por jugador.'],
  ]],
];

export function Atlas({ onClose, device, setDevice, demo, setDemo }) {
  const nav = useNav();
  const ref = useRef(null);
  useEffect(() => { ref.current?.querySelector('button')?.focus(); }, []);
  const open = (route, params) => {
    if (route === 'register') registerStart.step = params.step;
    setDemo('normal');
    nav.go(route, route === 'register' ? { id: `paso${params.step + 1}` } : params);
  };
  return html`<div class="atlas-backdrop" onClick=${(e) => e.target === e.currentTarget && onClose()}
    onKeyDown=${(e) => e.key === 'Escape' && onClose()}>
    <aside class="atlas" role="dialog" aria-modal="true" aria-labelledby="atlas-title" ref=${ref}>
      <header class="atlas__head">
        <h2 id="atlas-title">Mapa del prototipo</h2>
        <button type="button" class="atlas__close" onClick=${onClose} aria-label="Cerrar"><${Icon} name="close" size=${20} /></button>
      </header>
      <p class="atlas__lede">Rediseño completo del frontend de TM Scorekeeper. Todo es navegable y los datos son de ejemplo (63 partidas generadas con las reglas reales del backend).</p>

      <section class="atlas__sec">
        <h3>Vista</h3>
        <div class="atlas__seg">
          <button type="button" class=${cls(device === 'desktop' && 'is-on')} aria-pressed=${device === 'desktop'} onClick=${() => setDevice('desktop')}><${Icon} name="desktop" size=${16} />Escritorio</button>
          <button type="button" class=${cls(device === 'phone' && 'is-on')} aria-pressed=${device === 'phone'} onClick=${() => setDevice('phone')}><${Icon} name="phone" size=${16} />Móvil</button>
        </div>
      </section>

      ${GROUPS.map(([title, items]) => html`<section class="atlas__sec">
        <h3>${title}</h3>
        <ul class="atlas__list">
          ${items.map(([label, route, params, note]) => html`<li><button type="button" class="atlas__item" onClick=${() => open(route, params)}>
            <b>${label}</b><span>${note}</span></button></li>`)}
        </ul>
      </section>`)}

      <section class="atlas__sec">
        <h3>Estados</h3>
        <div class="atlas__seg atlas__seg--wrap">
          ${[['normal', 'Normal'], ['loading', 'Cargando'], ['error', 'Error de conexión']].map(([id, label]) => html`
            <button type="button" class=${cls(demo === id && 'is-on')} aria-pressed=${demo === id} onClick=${() => setDemo(id)}>${label}</button>`)}
        </div>
        <p class="atlas__hint">El estado vacío aparece en Partidas al filtrar por Mesa de 2 jugadores con Lu y Gonza.</p>
      </section>

      <section class="atlas__sec atlas__notes">
        <h3>Decisiones de diseño</h3>
        <ul>
          <li><b>Un planeta, todo el tiempo.</b> Marte vive detrás de la interfaz y viaja entre pantallas: se terraforma con la temporada del grupo y gira hasta la región de cada mapa con la grilla de 61 hexágonos del tablero.</li>
          <li><b>El vocabulario del tablero.</b> Termómetro de −30 a +8 °C, arco de oxígeno, 9 océanos, pista de TR con casilleros naranjas y cubos de jugador en lugar de avatares.</li>
          <li><b>Placas, no tarjetas.</b> Paneles de casco con esquinas biseladas; récords con banda azul (cartas activas), logros en hexágonos de acero, titanio, oro, plasma y Gaia.</li>
          <li><b>Registrar en 5 pasos.</b> Antes eran 11. Hitos y recompensas se marcan tocando cubos; el puntaje es una planilla con totales en vivo.</li>
          <li><b>Una ceremonia.</b> Al guardar, la suma por categoría, el ganador, el ELO, los récords y los logros llegan en una sola secuencia.</li>
        </ul>
        <h3>Funciones nuevas</h3>
        <ul>
          <li>Temporadas: el grupo terraforma su propio Marte (Inicio).</li>
          <li>Cara a cara, rivalidades, némesis y víctima favorita (Ranking, Perfil).</li>
          <li>ADN de puntaje y arquetipo de cada jugador (Perfil).</li>
          <li>Rendimiento por mapa y por corporación (Perfil).</li>
          <li>Historia de cada récord y "cerca del récord" (Récords, Informe).</li>
          <li>7 récords y 6 logros propuestos, calculados con datos que ya existen.</li>
          <li>Color de cubo elegible, borrador automático del formulario, calendario de actividad.</li>
        </ul>
        <p class="atlas__hint">Documento completo en docs/redesign/README.md y revisión técnica en docs/redesign/REVIEW.md.</p>
      </section>
    </aside>
  </div>`;
}
