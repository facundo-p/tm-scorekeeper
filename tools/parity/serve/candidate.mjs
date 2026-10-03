// Lado candidato: la app real con datos de la semilla.
//   1. recrea tm_parity, corre `alembic upgrade head` y carga fixtures/seed.json
//   2. levanta uvicorn con credenciales de prueba
//   3. `vite build --mode parity` y lo sirve con `vite preview`
//   4. inyecta la sesión (token de /auth/login cuando exista) en localStorage
import { execFileSync, spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { ROOT } from '../config.mjs';

const BACKEND = resolve(ROOT, 'backend');
const FRONTEND = resolve(ROOT, 'frontend');
const PY = resolve(BACKEND, '.venv/bin/python');
const DB_URL = process.env.PARITY_DATABASE_URL ?? 'postgresql://tm_user:tm_pass@localhost:5432/tm_parity';
const API_PORT = Number(process.env.PARITY_API_PORT ?? 8765);
const WEB_PORT = Number(process.env.PARITY_WEB_PORT ?? 4765);
export const PARITY_USER = 'parity';
export const PARITY_PASSWORD = 'parity-password';
// Claves de localStorage que lee el frontend (D-03): el token y la marca de sesión vieja.
export const TOKEN_KEY = 'tm_token';
const LEGACY_SESSION_KEY = 'tm_session';

const backendEnv = () => ({
  ...process.env, DATABASE_URL: DB_URL, FRONTEND_URL: `http://127.0.0.1:${WEB_PORT}`,
  AUTH_USERNAME: PARITY_USER, AUTH_SECRET: 'parity-secret-not-for-production',
  AUTH_PASSWORD_HASH: execFileSync(PY, ['-c', passwordHashScript()], { cwd: BACKEND }).toString().trim(),
});

// El script de hash existe desde F20; antes devuelve vacío y el backend no exige login.
const passwordHashScript = () => `
try:
    from scripts.hash_password import hash_password
    print(hash_password(${JSON.stringify(PARITY_PASSWORD)}))
except ImportError:
    print("")`;

function prepareDatabase(env) {
  execFileSync('psql', [DB_URL, '-qc', 'drop schema public cascade; create schema public;'], { stdio: 'ignore' });
  execFileSync(resolve(BACKEND, '.venv/bin/alembic'), ['upgrade', 'head'], { cwd: BACKEND, env, stdio: 'ignore' });
  execFileSync(PY, ['-m', 'scripts.load_fixture'], { cwd: BACKEND, env, stdio: 'ignore' });
}

async function waitHttp(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await fetch(url).then(() => true, () => false)) return;
    await new Promise((ok) => setTimeout(ok, 250));
  }
  throw new Error(`no responde: ${url}`);
}

// Grupo de procesos propio: al cerrar se termina también lo que lance (npx → vite).
function startProcess(cmd, args, opts) {
  const child = spawn(cmd, args, { ...opts, stdio: 'ignore', detached: true });
  return () => { try { process.kill(-child.pid, 'SIGTERM'); } catch { /* ya terminó */ } };
}

async function login(api) {
  const res = await fetch(`${api}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: PARITY_USER, password: PARITY_PASSWORD }),
  }).catch(() => null);
  return res?.ok ? (await res.json()).access_token : null;
}

function buildFrontend(api) {
  execFileSync('npx', ['vite', 'build', '--mode', 'parity', '--outDir', 'dist-parity', '--emptyOutDir'],
    { cwd: FRONTEND, env: { ...process.env, VITE_API_URL: api }, stdio: 'ignore' });
}

export async function startCandidate() {
  const env = backendEnv();
  const api = `http://127.0.0.1:${API_PORT}`;
  prepareDatabase(env);
  const stopApi = startProcess(resolve(BACKEND, '.venv/bin/uvicorn'), ['main:app', '--host', '127.0.0.1', '--port', String(API_PORT)], { cwd: BACKEND, env });
  await waitHttp(`${api}/docs`);
  buildFrontend(api);
  const stopWeb = startProcess('npx', ['vite', 'preview', '--outDir', 'dist-parity', '--host', '127.0.0.1', '--port', String(WEB_PORT), '--strictPort'], { cwd: FRONTEND });
  await waitHttp(`http://127.0.0.1:${WEB_PORT}/`);
  const token = await login(api);
  const storage = { [LEGACY_SESSION_KEY]: 'true', ...(token ? { [TOKEN_KEY]: token } : {}) };
  return {
    name: 'app',
    url: (scenario) => `http://127.0.0.1:${WEB_PORT}${scenario.cand?.path ?? '/'}${scenario.cand?.search ?? ''}`,
    // `fresh: true` (por ejemplo, Acceso) arranca sin sesión.
    prepare: (context, scenario) => (scenario?.fresh ? undefined
      : context.addInitScript((s) => Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v)), storage)),
    close: async () => { stopWeb(); stopApi(); },
  };
}
