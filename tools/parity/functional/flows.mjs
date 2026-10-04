// Recorridos de la verificación funcional de la SPEC (F35.3, D-81): login, navegación, editar,
// eliminar, filtros y ficha de jugador. Corren sobre la candidata con la semilla recién cargada.
import { PARITY_PASSWORD, PARITY_USER } from '../serve/candidate.mjs';

const sections = (page) => page.getByRole('navigation', { name: 'Secciones' }).filter({ visible: true });
const pathIs = (base, path) => new RegExp(`^${base}${path}(\\?.*)?$`);

/** Sin sesión: las rutas protegidas llevan a Acceso; con usuario y contraseña se entra a Inicio. */
export async function login(page, base) {
  await page.goto(`${base}/ranking`);
  await page.waitForURL(pathIs(base, '/acceso'));
  await page.getByLabel('Usuario').fill(PARITY_USER);
  await page.getByLabel('Contraseña', { exact: true }).fill(PARITY_PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL(pathIs(base, '/'));
  await sections(page).waitFor();
  if (!(await page.evaluate(() => localStorage.getItem('tm_token')))) throw new Error('no quedó el token de sesión');
}

const DESTINATIONS = [
  { label: 'Partidas', path: '/partidas', heading: 'Partidas' },
  { label: 'Ranking', path: '/ranking', heading: 'Ranking' },
  { label: 'Trofeos', path: '/records', heading: 'Salón de récords' },
  { label: 'Registrar', path: '/registrar', heading: 'Registrar partida' },
];

/** Cada enlace de la navegación (riel en escritorio, dock en el teléfono) abre su pantalla. */
export async function navigate(page, base) {
  await page.goto(`${base}/`);
  for (const d of DESTINATIONS) {
    await sections(page).getByRole('link', { name: d.label }).click();
    await page.waitForURL(pathIs(base, d.path));
    await page.getByRole('heading', { level: 1, name: d.heading }).waitFor();
    const current = await sections(page).getByRole('link', { name: d.label }).getAttribute('aria-current');
    if (current !== 'page') throw new Error(`«${d.label}» no queda marcado como sección actual`);
  }
}

/** Editar una partida: sumar una generación, recorrer el asistente y volver al informe con el aviso. */
export async function editGame(page, base) {
  await page.goto(`${base}/partidas/g-063/editar`);
  const gens = page.getByRole('group', { name: 'Generaciones' });
  const before = Number(await gens.getByRole('spinbutton').inputValue());
  await gens.getByRole('button', { name: 'Sumar 1' }).click();
  for (const step of ['Mesa', 'Hitos y recompensas', 'Puntaje', 'Revisión']) {
    await page.getByRole('button', { name: `Siguiente: ${step}` }).click();
    await page.getByRole('heading', { level: 2, name: step }).waitFor();
  }
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.waitForURL(/\/partidas\/g-063\?aviso=editada$/);
  await page.getByText('Cambios guardados.', { exact: false }).waitFor();
  await page.getByText(`${before + 1} generaciones`).first().waitFor();
}

/** Eliminar pide confirmación, vuelve al archivo con el aviso y la partida ya no está. */
export async function deleteGame(page, base, viewport) {
  const id = viewport === 'mobile' ? 'g-001' : 'g-002';
  await page.goto(`${base}/partidas/${id}`);
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar partida' }).click();
  await page.waitForURL(/\/partidas\?aviso=eliminada$/);
  await page.getByText('Partida eliminada.', { exact: false }).waitFor();
  await page.goto(`${base}/partidas/${id}`);
  await page.getByText('Esta partida no está en el archivo').waitFor();
}

/** El filtro de mesa vive en la URL, avisa qué muestra y se quita (Ranking y Trofeos). */
export async function filters(page, base) {
  for (const path of ['/ranking', '/records']) {
    await page.goto(`${base}${path}`);
    await page.getByRole('button', { name: 'Mesas de 3 jugadores' }).first().click();
    await page.waitForURL(/[?&]mesa=3/);
    const notice = page.getByRole('status').filter({ hasText: 'Solo partidas de 3 jugadores' });
    await notice.waitFor();
    await notice.getByRole('button', { name: 'Quitar' }).click();
    await page.waitForURL(pathIs(base, path));
  }
}

/** Hoja de jugador desde el plantel del Ranking: desactivar (libera su color), alta y edición. */
export async function playerSheet(page, base, viewport) {
  const leaving = viewport === 'mobile' ? 'Gonza' : 'Lu';
  const name = `Prueba ${viewport}`;
  await page.goto(`${base}/ranking`);
  const sheet = page.getByRole('dialog');
  await page.getByRole('button', { name: `Editar a ${leaving}` }).click();
  await sheet.getByRole('button', { name: 'Desactivar' }).click();
  await sheet.waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'Agregar jugador' }).click();
  await sheet.getByLabel('Nombre').fill(name);
  await sheet.getByRole('button', { name: 'Agregar jugador' }).click();
  await sheet.waitFor({ state: 'detached' });
  await page.getByRole('button', { name: `Editar a ${name}` }).click();
  await sheet.getByLabel('Nombre').fill(`${name} bis`);
  await sheet.getByRole('button', { name: 'Guardar cambios' }).click();
  await sheet.waitFor({ state: 'detached' });
  await page.getByRole('button', { name: `Editar a ${name} bis` }).waitFor();
}
