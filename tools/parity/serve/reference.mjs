// Lado de referencia: el mockup servido estático, sin red externa.
// - jsdelivr → paquetes de npm de tools/parity/node_modules
// - Google Fonts → tipografías locales de la app (frontend/public/fonts); fonts.gstatic.com bloqueado
// - Se ocultan los controles del prototipo
// - `ref = 'mockup@<sha>'` sirve una versión vieja del mockup (git archive a un directorio temporal)
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FONTS_DIR, MOCKUP_DIR, OUT_DIR, PARITY_DIR, ROOT } from '../config.mjs';
import { serveStatic } from './static.mjs';

const HIDE_PROTOTYPE = '.protobar, .sample-chip { display: none !important; }';

function mockupAt(sha) {
  const dir = resolve(OUT_DIR, `.ref-${sha}`);
  if (existsSync(resolve(dir, 'docs/redesign/mockup/index.html'))) return resolve(dir, 'docs/redesign/mockup');
  mkdirSync(dir, { recursive: true });
  const tar = execFileSync('git', ['-C', ROOT, 'archive', sha, 'docs/redesign/mockup']);
  execFileSync('tar', ['-x', '-C', dir], { input: tar });
  return resolve(dir, 'docs/redesign/mockup');
}

function npmFile(url) {
  const m = new URL(url).pathname.match(/^\/npm\/((?:@[^/]+\/)?[^@/]+)@([^/]+)\/(.+)$/);
  if (!m) return null;
  const [, pkg, version, path] = m;
  const installed = JSON.parse(readFileSync(resolve(PARITY_DIR, 'node_modules', pkg, 'package.json'), 'utf8')).version;
  if (installed !== version) throw new Error(`jsdelivr pide ${pkg}@${version} y está instalado ${installed}`);
  return resolve(PARITY_DIR, 'node_modules', pkg, path);
}

function fontsCss() {
  return readFileSync(resolve(FONTS_DIR, 'fonts.css'), 'utf8');
}

async function routeNetwork(context) {
  await context.route('https://cdn.jsdelivr.net/**', (route) => route.fulfill({ path: npmFile(route.request().url()) }));
  await context.route('https://fonts.googleapis.com/**', (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith('.woff2')) return route.fulfill({ path: resolve(FONTS_DIR, pathname.split('/').pop()) });
    return route.fulfill({ contentType: 'text/css', body: fontsCss() });
  });
  await context.route('https://fonts.gstatic.com/**', (route) => route.abort());
}

export async function startReference({ ref } = {}) {
  const dir = ref ? mockupAt(ref.replace(/^mockup@/, '')) : MOCKUP_DIR;
  const server = await serveStatic({ '/': dir });
  return {
    name: ref ?? 'mockup',
    url: (scenario) => `${server.url}/${scenario.ref?.search ?? ''}${scenario.ref?.hash ?? ''}`,
    prepare: routeNetwork,
    styles: HIDE_PROTOTYPE,
    close: server.close,
  };
}
