import { html, useState, useEffect, useRef, useMemo, useCallback, cls, reducedMotion } from './lib.js';
import { NavCtx, toHash, parseHash, hrefOf, SECTION } from './router.js';
import { Icon } from './ui/icons.js';
import { Cube } from './ui/atoms.js';
import { MODEL } from './data/derive.js';
import { createPlanetStage } from './fx/planet.js';
import { createSky } from './fx/stars.js';
import { StageCtx } from './ui/planet-slot.js';
import { Atlas } from './screens/atlas.js';
import { LoadingState, ErrorState } from './ui/states.js';
import { Login } from './screens/login.js';
import { Home } from './screens/home.js';
import { Games } from './screens/games.js';
import { GameReport } from './screens/game.js';
import { Register } from './screens/register.js';
import { Ceremony } from './screens/ceremony.js';
import { Ranking } from './screens/ranking.js';
import { Profile } from './screens/profile.js';
import { Records } from './screens/records.js';
import { Achievements } from './screens/achievements.js';
import { NotFound } from './screens/not-found.js';
import { Gallery } from './screens/gallery.js';

const SCREENS = {
  login: Login, home: Home, games: Games, game: GameReport, register: Register, edit: Register, ceremony: Ceremony, ranking: Ranking,
  profile: Profile, records: Records, achievements: Achievements, notFound: NotFound, gallery: Gallery,
};

const NAV = [
  { id: 'home', route: 'home', label: 'Inicio', icon: 'home' },
  { id: 'games', route: 'games', label: 'Partidas', icon: 'games' },
  { id: 'register', route: 'register', label: 'Registrar', icon: 'plus', primary: true },
  { id: 'ranking', route: 'ranking', label: 'Ranking', icon: 'ranking' },
  { id: 'trophies', route: 'records', label: 'Trofeos', icon: 'trophyNav' },
];

function Wordmark({ compact }) {
  return html`<span class=${cls('wordmark', compact && 'wordmark--compact')}>
    <svg class="wordmark__mark" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 2l15.6 9v18L20 38 4.4 29V11z" class="wm-hex"/>
      <path d="M8.5 25.5a14 14 0 0 1 23 0" class="wm-arc"/>
      <circle cx="20" cy="26" r="6.2" class="wm-planet"/>
      <circle cx="29.5" cy="13.5" r="1.6" class="wm-moon"/>
    </svg>
    ${!compact && html`<span class="wordmark__text"><b>Archivo</b><span>de Terraformación</span></span>`}
  </span>`;
}

// Navigation uses real links (#hash) so they can be opened, copied and read as links.
function NavLink({ n, section, base }) {
  return html`<a href=${hrefOf(n.route)} class=${cls(`${base}__item`, n.primary && `${base}__item--primary`, section === n.id && 'is-on')}
    aria-current=${section === n.id ? 'page' : null}>
    <span class=${`${base}__${base === 'rail' ? 'hex' : 'icon'}`}><${Icon} name=${n.icon} size=${base === 'rail' ? (n.primary ? 24 : 21) : (n.primary ? 26 : 22)} /></span>
    <span class=${`${base}__label`}>${n.label}</span>
  </a>`;
}

function Rail({ section }) {
  return html`<nav class="rail" aria-label="Secciones">
    <a href=${hrefOf('home')} class="rail__brand" aria-label="Inicio"><${Wordmark} compact /></a>
    <ul class="rail__list">
      ${NAV.map((n) => html`<li><${NavLink} n=${n} section=${section} base="rail" /></li>`)}
    </ul>
    <a href=${hrefOf('login')} class="rail__exit" aria-label="Salir"><${Icon} name="power" size=${18} /></a>
  </nav>`;
}

function Dock({ section }) {
  return html`<nav class="dock" aria-label="Secciones">
    ${NAV.map((n) => html`<${NavLink} n=${n} section=${section} base="dock" />`)}
  </nav>`;
}

function Ticker({ go }) {
  const items = useMemo(() => MODEL.feed.filter((f) => f.type !== 'game').slice(0, 8), []);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 6500);
    return () => clearInterval(t);
  }, []);
  const item = items[i];
  const player = MODEL.playerById[item.player_id];
  return html`<button type="button" class="ticker" onClick=${() => item.game_id && go('game', { id: item.game_id })}
    aria-live="polite" title="Ver la partida">
    <span class="ticker__rec" aria-hidden="true"></span>
    <span class="ticker__label">Transmisión</span>
    <span class="ticker__msg" key=${i}>${player && html`<${Cube} color=${player.color} size=${13} />`}${item.text}</span>
  </button>`;
}

function SeasonChip({ go }) {
  const s = MODEL.season;
  return html`<button type="button" class="season-chip" onClick=${() => go('home')} title="Progreso de la temporada">
    <span class="season-chip__ring" style=${`--pct:${(s.pct * 100).toFixed(1)}`} aria-hidden="true"></span>
    <span><span class="season-chip__t">Temporada ${s.number}</span><span class="season-chip__v">${Math.round(s.pct * 100)} % terraformado</span></span>
  </button>`;
}

function TopBar({ go }) {
  return html`<header class="topbar">
    <a href=${hrefOf('home')} class="topbar__brand" aria-label="Inicio"><${Wordmark} /></a>
    <${Ticker} go=${go} />
    <div class="topbar__aside">
      <span class="sample-chip" title="Las partidas y jugadores de este prototipo son de ejemplo">Datos de ejemplo</span>
      <${SeasonChip} go=${go} />
      <a href=${hrefOf('login')} class="topbar__exit" aria-label="Salir"><${Icon} name="power" size=${18} /></a>
    </div>
  </header>`;
}

function ProtoBar({ device, setDevice, openAtlas }) {
  return html`<div class="protobar" role="toolbar" aria-label="Herramientas del prototipo">
    <span class="protobar__tag">Prototipo</span>
    <button type="button" class="protobar__btn" onClick=${openAtlas}><${Icon} name="grid" size=${16} /><span>Pantallas</span></button>
    <span class="protobar__seg" role="group" aria-label="Vista">
      <button type="button" class=${cls('protobar__btn protobar__btn--icon', device === 'desktop' && 'is-on')} aria-pressed=${device === 'desktop'}
        aria-label="Vista de escritorio" data-tip="Escritorio" onClick=${() => setDevice('desktop')}><${Icon} name="desktop" size=${16} /></button>
      <button type="button" class=${cls('protobar__btn protobar__btn--icon', device === 'phone' && 'is-on')} aria-pressed=${device === 'phone'}
        aria-label="Vista de teléfono" data-tip="Móvil" onClick=${() => setDevice('phone')}><${Icon} name="phone" size=${16} /></button>
    </span>
  </div>`;
}

function initialRoute() {
  return parseHash(location.hash) ?? { name: 'home', params: {}, query: {} };
}

// ?demo=loading|error shows the loading or error state on every screen (comparison hooks).
const initialDemo = () => {
  const d = new URLSearchParams(location.search).get('demo');
  return d === 'loading' || d === 'error' ? d : 'normal';
};

export function App() {
  const [route, setRoute] = useState(initialRoute);
  const [device, setDevice] = useState(() => (new URLSearchParams(location.search).get('device') === 'phone' ? 'phone' : 'desktop'));
  const [atlas, setAtlas] = useState(false);
  const [demo, setDemo] = useState(initialDemo);
  const [stage, setStage] = useState(null);
  const fxRef = useRef(null);
  const deviceRef = useRef(null);
  const scrollRef = useRef(null);
  const skipHash = useRef(false);

  useEffect(() => {
    createSky(deviceRef.current);
    setStage(createPlanetStage(deviceRef.current));
  }, []);

  useEffect(() => {
    const onHash = () => {
      if (skipHash.current) { skipHash.current = false; return; }
      const r = parseHash(location.hash) ?? { name: 'home', params: {}, query: {} };
      setRoute(r);
      setAtlas(false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallback((name, params = {}, query = {}) => {
    const next = { name, params, query };
    setRoute(next);
    setAtlas(false);
    try {
      const token = toHash(next);
      if (location.hash.slice(1) !== token) { skipHash.current = true; location.hash = token; }
    } catch { /* sandboxed: memory routing only */ }
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);
  const back = useCallback(() => { try { history.back(); } catch { go('home'); } }, [go]);
  const nav = useMemo(() => ({ route, go, back }), [route, go, back]);

  useEffect(() => {
    const onMove = (e) => {
      const el = e.target.closest?.('[data-sheen]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    const host = deviceRef.current;
    host.addEventListener('pointermove', onMove, { passive: true });
    return () => host.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    const fit = () => {
      const s = Math.min(1, (innerHeight - 40) / 844, (innerWidth - 40) / 390);
      document.documentElement.style.setProperty('--fit', s.toFixed(3));
    };
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);

  const Screen = SCREENS[route.name] ?? Home;
  const section = SECTION[route.name];
  const bare = route.name === 'login' || route.name === 'ceremony';
  const routeKey = `${route.name}-${route.params.id ?? ''}-${demo}`;

  return html`<${NavCtx.Provider} value=${nav}>
    <${StageCtx.Provider} value=${stage}>
      <div class=${cls('stage', `stage--${device}`)}>
        <div class="device-fit">
          <div class=${cls('device', bare && 'device--bare')} ref=${deviceRef}>
            <div class="fx" ref=${fxRef}></div>
            ${!bare && html`<${Rail} section=${section} />`}
            <div class="scroller" ref=${scrollRef} data-scroll-root>
              ${!bare && html`<${TopBar} go=${go} />`}
              <main class=${cls('screen', `screen--${route.name}`)} key=${routeKey}>
                ${demo === 'loading' && !bare ? html`<${LoadingState} />`
                  : demo === 'error' && !bare ? html`<${ErrorState} onRetry=${() => setDemo('normal')} />`
                  : html`<${Screen} params=${route.params} query=${route.query ?? {}} />`}
              </main>
            </div>
            ${!bare && html`<${Dock} section=${section} />`}
            <div class="overlays" id="overlays"></div>
          </div>
        </div>
        <${ProtoBar} device=${device} setDevice=${setDevice} openAtlas=${() => setAtlas(true)} />
        ${atlas && html`<${Atlas} onClose=${() => setAtlas(false)} device=${device} setDevice=${setDevice} demo=${demo} setDemo=${setDemo} />`}
      </div>
    </${StageCtx.Provider}>
  </${NavCtx.Provider}>`;
}
