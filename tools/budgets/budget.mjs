// Presupuestos del bundle (F35.3, CLOSE-03, D-83): lógica pura sobre el manifiesto de Vite.
// El JS inicial es la entrada (index.html) más todo lo que importa en forma estática; lo que se
// carga con import() (pantallas, motor del planeta) queda afuera.

export const INITIAL_JS_MAX_KB = 100; // kB gzip, en miles de bytes como los informa Vite
export const PLANET_MODULE = 'src/fx/planet/stage.ts';

/** Clave del manifiesto de la entrada (la única con isEntry). */
export function entryKey(manifest) {
  const keys = Object.keys(manifest).filter((k) => manifest[k].isEntry);
  if (keys.length !== 1) throw new Error(`se esperaba una entrada en el manifiesto y hay ${keys.length}`);
  return keys[0];
}

/** Claves de los chunks que se bajan al abrir la app: la entrada y sus imports estáticos. */
export function initialKeys(manifest) {
  const seen = new Set();
  const visit = (key) => {
    if (seen.has(key) || !manifest[key]) return;
    seen.add(key);
    for (const dep of manifest[key].imports ?? []) visit(dep);
  };
  visit(entryKey(manifest));
  return [...seen];
}

/**
 * Revisa los presupuestos. `gzipSize(file)` devuelve los bytes gzip de un archivo de dist.
 * Devuelve { initialKb, files, failures }.
 */
export function checkBudgets(manifest, gzipSize, { maxKb = INITIAL_JS_MAX_KB, planet = PLANET_MODULE } = {}) {
  const keys = initialKeys(manifest);
  const files = keys.map((k) => manifest[k].file).filter((f) => f.endsWith('.js'));
  const initialKb = files.reduce((sum, f) => sum + gzipSize(f), 0) / 1000;
  const failures = [];
  if (initialKb > maxKb) failures.push(`JS inicial ${initialKb.toFixed(2)} kB gzip > ${maxKb} kB`);
  const stage = manifest[planet];
  if (!stage) failures.push(`el motor del planeta (${planet}) no tiene chunk propio`);
  else if (keys.includes(planet) || files.includes(stage.file)) failures.push('el motor del planeta quedó en el JS inicial');
  return { initialKb, files, failures };
}
