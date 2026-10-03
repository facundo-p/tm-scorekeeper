// Solo se recrean bases de comparación o de tests: nunca la de desarrollo ni la de producción.
const ALLOWED = ['_parity', '_test'];

export function databaseName(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, '')) || null;
  } catch {
    return null;
  }
}

export function assertDisposableDatabase(url) {
  const name = databaseName(url);
  if (!name || !ALLOWED.some((s) => name.endsWith(s))) {
    throw new Error(`la base '${name}' no termina en ${ALLOWED.join(' ni ')}: el arnés no la recrea`);
  }
  return name;
}
