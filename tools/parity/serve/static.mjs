// Servidor estático mínimo (node:http) para el mockup y otros directorios.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

function cleanPath(urlPath) {
  try {
    return normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  } catch {
    return null;
  }
}

async function resolveFile(root, urlPath) {
  const clean = cleanPath(urlPath);
  if (clean === null) return null;
  let file = resolve(join(root, clean));
  const rel = relative(resolve(root), file);
  if (rel.startsWith('..')) return null;
  const info = await stat(file).catch(() => null);
  if (info?.isDirectory()) file = join(file, 'index.html');
  return (await stat(file).catch(() => null))?.isFile() ? file : null;
}

// mounts: { '/': dir, '/fonts/': otherDir }. Devuelve { url, close }.
export async function serveStatic(mounts) {
  const prefixes = Object.keys(mounts).sort((a, b) => b.length - a.length);
  const server = createServer(async (req, res) => {
    const prefix = prefixes.find((p) => req.url.startsWith(p));
    const file = prefix && (await resolveFile(mounts[prefix], req.url.slice(prefix.length - 1)));
    if (!file) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(file));
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((ok) => server.close(ok)) };
}
