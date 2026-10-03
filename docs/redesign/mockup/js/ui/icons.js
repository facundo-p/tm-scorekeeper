// Hand-drawn 24px icon set. UI icons are strokes in currentColor; game glyphs
// (tiles, resources, maps) use fill classes defined in css/components.css.
import { html } from '../lib.js';

const st = (d) => `<path d="${d}" class="i-st"/>`;
const HEX = 'M12 2l8.66 5v10L12 22l-8.66-5V7z';
const HEX_SM = 'M12 4.5l6.5 3.75v7.5L12 19.5l-6.5-3.75v-7.5z';

const ICONS = {
  // Navigation and UI
  home: st('M3 20h18M5 20v-5.5a7 7 0 0 1 14 0V20M10 20v-4h4v4M12 7.5V4M10.5 4h3'),
  games: st('M6 3h9l4 4v14H6zM15 3v4h4M9 11.5h7M9 15.5h7M9 7.5h3'),
  plus: st('M12 5v14M5 12h14'),
  ranking: st('M4 20h16M5 15.5l4-4 3.5 3 6.5-7.5M15 7h4v4'),
  trophyNav: st('M8 4h8v5a4 4 0 0 1-8 0zM8 6H5.5A2.5 2.5 0 0 0 8 10M16 6h2.5A2.5 2.5 0 0 1 16 10M12 13v4M8.5 20h7M10 17h4'),
  users: st('M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.2c2 .7 3.5 2.8 3.5 5.8'),
  back: st('M15 5l-7 7 7 7'),
  next: st('M9 5l7 7-7 7'),
  down: st('M5 9l7 7 7-7'),
  close: st('M6 6l12 12M18 6L6 18'),
  filter: st('M4 5h16l-6 7.5V18l-4 2v-7.5z'),
  calendar: st('M4 6h16v14H4zM4 10.5h16M8 3.5v4M16 3.5v4'),
  edit: st('M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4'),
  power: st('M12 3v8M7 6.5a7 7 0 1 0 10 0'),
  check: st('M5 12.5l4.5 4.5L19 7.5'),
  minus: st('M5 12h14'),
  info: st('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5'),
  table: st('M4 5h16v14H4zM4 10h16M4 14.5h16M10 5v14'),
  chart: st('M4 4v16h16M7.5 15l3.5-4.5 3 2.5 4.5-6'),
  grid: st('M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z'),
  phone: st('M7.5 3h9v18h-9zM11 18h2'),
  desktop: st('M3 4.5h18v12H3zM9 20.5h6M12 16.5v4'),
  lock: st('M6 11h12v9.5H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3'),
  search: st('M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20'),
  swap: st('M7 7.5h12l-3.5-3.5M17 16.5H5l3.5 3.5'),
  spark: st('M12 3v5M12 16v5M3 12h5M16 12h5M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18'),
  dot: '<circle cx="12" cy="12" r="4" class="i-fill"/>',
  notes: st('M5 4h14v16H5zM8.5 8.5h7M8.5 12h7M8.5 15.5h4'),
  sound: st('M4 9.5h4L13 5v14l-5-4.5H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11'),
  mute: st('M4 9.5h4L13 5v14l-5-4.5H4zM17 9.5l4.5 5M21.5 9.5L17 14.5'),

  // Score categories and game concepts
  tr: `<path d="${HEX}" class="g-tr-bg"/><path d="M7.5 15.5l4.5-6 4.5 6" class="g-ink-st"/><path d="M12 9.5v8" class="g-ink-st"/>`,
  award: `<circle cx="12" cy="9.5" r="5.5" class="g-award"/><path d="M8.6 13.6L7 21l5-2.6 5 2.6-1.6-7.4" class="g-award-dk"/><circle cx="12" cy="9.5" r="2.4" class="g-ink"/>`,
  milestone: `<path d="M6.5 21.5V3.5" class="g-ink-st g-thin"/><path d="M7 4h11.5l-2.6 4.2 2.6 4.3H7z" class="g-milestone"/>`,
  resource: `<ellipse cx="12" cy="15" rx="4.6" ry="3.8" class="g-resource"/><circle cx="6.4" cy="9.6" r="2" class="g-resource"/><circle cx="10" cy="6.4" r="2" class="g-resource"/><circle cx="14" cy="6.4" r="2" class="g-resource"/><circle cx="17.6" cy="9.6" r="2" class="g-resource"/>`,
  card: `<rect x="5.5" y="2.5" width="13" height="19" rx="1.5" class="g-card"/><path d="M8 6.5h8" class="g-ink-st g-thin"/><circle cx="12" cy="14.5" r="3.6" class="g-card-vp"/>`,
  greenery: `<path d="${HEX}" class="g-greenery"/><path d="M12 17.5c-3.6-1.4-4.4-5.2-1.6-9.5 2.6 1.4 4.7 5.2 1.6 9.5zM12 17.5v-6" class="g-leaf"/>`,
  city: `<path d="${HEX}" class="g-city"/><path d="M7 17V11.5h3V17M10 17V8h4v9M14 17v-6h3v6M6.5 17h11" class="g-city-ink"/>`,
  ocean: `<path d="${HEX}" class="g-ocean"/><path d="M6.5 11c1.8-1.4 3.7-1.4 5.5 0s3.7 1.4 5.5 0M6.5 14.5c1.8-1.4 3.7-1.4 5.5 0s3.7 1.4 5.5 0" class="g-wave"/>`,
  turmoil: `<circle cx="12" cy="7.5" r="3.4" class="g-turmoil"/><path d="M5 20.5c0-4.2 3.1-7 7-7s7 2.8 7 7z" class="g-turmoil"/>`,
  mc: `<rect x="3" y="3" width="18" height="18" rx="4" class="g-mc"/><text x="12" y="16.2" class="g-mc-txt">M€</text>`,
  steel: `<rect x="3" y="3" width="18" height="18" rx="3" class="g-steel"/><path d="M7 8h10M7 16h10M12 8v8" class="g-ink-st"/>`,
  titanium: `<rect x="3" y="3" width="18" height="18" rx="3" class="g-titanium"/><path d="M12 6l2 4.3 4.6.6-3.4 3.1.9 4.6L12 16.4 7.9 18.6l.9-4.6-3.4-3.1 4.6-.6z" class="g-ink"/>`,
  plant: `<path d="M12 21c-6-2.5-7.5-9.5-2.5-17 4.5 2.4 8.3 9.5 2.5 17zM12 21V10" class="g-plant"/>`,
  energy: `<path d="M13.5 2.5L5 13.5h6l-1.5 8 8.5-11h-6z" class="g-energy"/>`,
  heat: `<path d="M12 21.5c-4 0-6.5-2.8-6.5-6.2 0-3.6 3-5.6 3.6-9.8 2.5 1.7 3.4 3.9 3.3 5.9 1-1 1.6-2.3 1.7-3.9 2.6 2.2 4.4 4.8 4.4 7.8 0 3.4-2.5 6.2-6.5 6.2z" class="g-heat"/>`,
  temperature: `<path d="M10 14.2V5a2 2 0 0 1 4 0v9.2a4 4 0 1 1-4 0z" class="g-temp-st"/><circle cx="12" cy="17.4" r="2.2" class="g-temp"/><path d="M12 15.5V8" class="g-temp-line"/>`,
  oxygen: `<circle cx="10.5" cy="12" r="6.5" class="g-oxy-st"/><text x="18.4" y="20" class="g-oxy-txt">2</text>`,
  generation: st('M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4.2h-4.2'),
  players: st('M12 11a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8zM5.5 20a6.5 6.5 0 0 1 13 0'),
  draft: st('M8.5 4.5h7v10h-7zM4 8l3.5-1M20 8l-3.5-1M6 19.5h12M15 17.5l3 2-3 2'),

  // Expansions
  prelude: `<rect x="5" y="3" width="14" height="18" rx="1.6" class="g-exp"/><path d="M9.5 16.5V7.5h3a2.6 2.6 0 0 1 0 5.2h-3" class="g-exp-ink"/>`,
  colonies: `<ellipse cx="12" cy="12" rx="9.5" ry="3.6" class="g-exp-st"/><circle cx="12" cy="12" r="4.2" class="g-exp"/><circle cx="20" cy="10.6" r="1.4" class="g-exp"/>`,
  venus: `<circle cx="12" cy="9" r="5" class="g-venus-st"/><path d="M12 14v7.5M8.5 18h7" class="g-venus-line"/>`,

  // Achievement and record glyphs
  trophy: `<path d="M7.5 3.5h9v6a4.5 4.5 0 0 1-9 0z" class="g-metal"/><path d="M7.5 5.5H5a2.5 2.5 0 0 0 2.6 4.2M16.5 5.5H19a2.5 2.5 0 0 1-2.6 4.2" class="g-metal-st"/><path d="M12 14v3.5M8.5 21h7M9.5 17.5h5V21h-5z" class="g-metal"/>`,
  crown: `<path d="M3.5 18.5l-1-10.5 5.2 4.2L12 5l4.3 7.2 5.2-4.2-1 10.5z" class="g-metal"/><path d="M4 21h16" class="g-metal-st"/>`,
  flame: `<path d="M12 21.5c-4 0-6.5-2.8-6.5-6.2 0-3.6 3-5.6 3.6-9.8 2.5 1.7 3.4 3.9 3.3 5.9 1-1 1.6-2.3 1.7-3.9 2.6 2.2 4.4 4.8 4.4 7.8 0 3.4-2.5 6.2-6.5 6.2z" class="g-metal"/><path d="M12 19.5c-1.6 0-2.6-1.1-2.6-2.5 0-1.5 1.2-2.4 1.5-4 1.9 1.1 3.7 2.4 3.7 4 0 1.4-1 2.5-2.6 2.5z" class="g-ink"/>`,
  maps: `<path d="M8 3.5l4.3 2.5v5L8 13.5 3.7 11V6z" class="g-metal"/><path d="M16 3.5l4.3 2.5v5L16 13.5 11.7 11V6z" class="g-metal-dim"/><path d="M12 11l4.3 2.5v5L12 21l-4.3-2.5v-5z" class="g-metal"/>`,
  steal: `<path d="M4 10.5c0-3 3.6-5 8-5s8 2 8 5v1.5c0 2.4-2.4 3.8-4.5 3.8-1.6 0-2.4-1-3.5-1s-1.9 1-3.5 1C6.4 15.8 4 14.4 4 12z" class="g-metal"/><path d="M7.5 10.6h2.8M13.7 10.6h2.8" class="g-ink-st"/>`,
  lone: `<path d="M12 3.5l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 15.6l-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" class="g-metal-st"/><circle cx="12" cy="11.4" r="2" class="g-metal"/>`,
  eye: `<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" class="g-metal"/><circle cx="12" cy="12" r="3.3" class="g-ink"/>`,
  corp: `<path d="M4 20.5V9l8-5.5 8 5.5v11.5z" class="g-metal"/><path d="M9 20.5v-6h6v6M8 11h2M14 11h2" class="g-ink-st"/>`,
  photo: `<path d="M5 3.5v17" class="g-metal-st"/><path d="M5.5 4h13v9h-13z" class="g-metal-dim"/><path d="M5.5 4h3.3v3h-3.3zM12.1 4h3.3v3h-3.3zM8.8 7h3.3v3H8.8zM15.4 7h3.1v3h-3.1zM5.5 10h3.3v3H5.5zM12.1 10h3.3v3h-3.3z" class="g-metal"/>`,
  blitz: `<path d="M13.5 2.5L5 13.5h6l-1.5 8 8.5-11h-6z" class="g-metal"/>`,
  giant: `<path d="M2.5 20.5l6.5-12 3 4.5 2.5-3.5 7 11z" class="g-metal"/><path d="M14 4.5v5M11.5 7l2.5-2.5L16.5 7" class="g-metal-st"/>`,
  table: `<circle cx="12" cy="4.6" r="2.2" class="g-metal"/><circle cx="19.6" cy="10" r="2.2" class="g-metal"/><circle cx="16.7" cy="19" r="2.2" class="g-metal"/><circle cx="7.3" cy="19" r="2.2" class="g-metal"/><circle cx="4.4" cy="10" r="2.2" class="g-metal"/><circle cx="12" cy="12.4" r="3" class="g-metal-dim"/>`,
  margin: `<path d="M3.5 12h17M7 8.5L3.5 12 7 15.5M17 8.5l3.5 3.5-3.5 3.5" class="g-metal-st"/><path d="M12 5v14" class="g-metal-st g-thin"/>`,
  engine: `<path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z" class="g-ink"/><path d="M10.6 2.5h2.8l.5 2.6 2.2 1 2.3-1.5 2 2-1.5 2.3 1 2.2 2.6.5v2.8l-2.6.5-1 2.2 1.5 2.3-2 2-2.3-1.5-2.2 1-.5 2.6h-2.8l-.5-2.6-2.2-1-2.3 1.5-2-2 1.5-2.3-1-2.2-2.6-.5v-2.8l2.6-.5 1-2.2-1.5-2.3 2-2 2.3 1.5 2.2-1z" class="g-metal g-evenodd"/>`,
  peak: `<path d="M2.5 20.5l7-13 3.5 5.5 2-3 6.5 10.5z" class="g-metal"/><path d="M9.5 7.5V2.5l4 1.6-4 1.6" class="g-metal-st"/>`,
};

// Map glyphs: a hexagon frame with the region's signature landform.
const MAP_GLYPHS = {
  tharsis: '<path d="M4.5 16.5l3-5 3 5M9.5 16.5l3-6 3 6M14.5 16.5l3-5 3 5" class="m-st"/><path d="M6.5 9.5l2-3.5 2 3.5" class="m-st m-thin"/>',
  hellas: '<circle cx="12" cy="12" r="5.5" class="m-st"/><circle cx="12" cy="12" r="2.5" class="m-st m-thin"/>',
  elysium: '<path d="M5.5 16.5l5-8.5h3l5 8.5" class="m-st"/><path d="M10.5 8l1.5 1.4L13.5 8" class="m-st m-thin"/>',
  utopia: '<path d="M5 10c2.3-1.2 4.7-1.2 7 0s4.7 1.2 7 0M5 13.5c2.3-1.2 4.7-1.2 7 0s4.7 1.2 7 0M7 17c1.7-.8 3.3-.8 5 0s3.3.8 5 0" class="m-st m-thin"/>',
  cimmeria: '<circle cx="9" cy="10" r="2.6" class="m-st"/><circle cx="15.3" cy="13.6" r="2" class="m-st"/><circle cx="10.4" cy="16" r="1.2" class="m-st m-thin"/>',
  borealis: '<path d="M6 10.5a7 4 0 0 1 12 0c-1.8 1.4-3.8 2-6 2s-4.2-.6-6-2z" class="m-fill"/><path d="M6 15c2-.9 4-.9 6 0s4 .9 6 0" class="m-st m-thin"/>',
  amazonis: '<path d="M4.5 14c3-3 6-3 9 0s4.5 2.2 6 1M4.5 10c3-2 6-2 9 0" class="m-st m-thin"/>',
};

export function Icon({ name, size = 20, label, class: className }) {
  const body = ICONS[name] ?? ICONS.dot;
  return html`<svg class=${`icon ${className ?? ''}`} width=${size} height=${size} viewBox="0 0 24 24"
    role=${label ? 'img' : null} aria-label=${label ?? null} aria-hidden=${label ? null : 'true'}
    dangerouslySetInnerHTML=${{ __html: body }}></svg>`;
}

export function MapGlyph({ map, glyph, size = 28, label }) {
  const body = `<path d="${HEX}" class="m-hex"/>${MAP_GLYPHS[glyph] ?? ''}`;
  return html`<svg class="map-glyph" data-map=${glyph} width=${size} height=${size} viewBox="0 0 24 24"
    role=${label ? 'img' : null} aria-label=${label ?? map ?? null} aria-hidden=${label || map ? null : 'true'}
    dangerouslySetInnerHTML=${{ __html: body }}></svg>`;
}

export const HEX_PATH = HEX;
export const HEX_SMALL_PATH = HEX_SM;
