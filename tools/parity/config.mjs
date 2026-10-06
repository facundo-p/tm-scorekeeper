// Configuración congelada del arnés (SPEC v2.0 §7). Igual en los dos lados.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PARITY_DIR = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(PARITY_DIR, '../..');
export const MOCKUP_DIR = resolve(ROOT, 'docs/redesign/mockup');
export const FONTS_DIR = resolve(ROOT, 'frontend/public/fonts');
export const FONTS_CSS = resolve(ROOT, 'frontend/src/styles/fonts.css');
export const OUT_DIR = resolve(PARITY_DIR, 'out');

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};

export const CHROMIUM_ARGS = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--force-color-profile=srgb',
  '--font-render-hinting=none',
  // Rasterización por CPU: el texto de capas con scroll propio no cambia de posición sub-píxel según la carga.
  '--disable-gpu-rasterization',
];

export const FROZEN = {
  time: '2026-09-27T21:00:00-03:00',
  locale: 'es-AR',
  timezoneId: 'America/Argentina/Buenos_Aires',
  reducedMotion: 'reduce',
};

// Umbrales por frame. `pixels` es el % de píxeles distintos fuera del planeta.
export const THRESHOLDS = {
  pixels: { desktop: 0.3, mobile: 0.5 },
  selfPixels: 0.01,
  planet: 2,
  heightPx: 4,
  stylePx: 0.5,
};

export const PIXELMATCH = { threshold: 0.1, includeAA: false };
export const READY_TIMEOUT_MS = 60000;
export const MAX_FRAMES = 12;

// Estilos computados que se comparan en cada `probe` si el escenario no dice otros.
export const PROBE_PROPS = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color',
  'background-color', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-top-width'];
