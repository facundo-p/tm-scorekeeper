// Registrar una partida solo con el teclado, en 390 y 1440 px (F30, #33).
import { focusedNamed, focusedSelector, tabTo } from './keyboard.mjs';

async function next(page, label) {
  await tabTo(page, focusedNamed(label));
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { level: 2, name: label.replace('Siguiente: ', '') }).waitFor();
}

/** El buscador de corporación: se escribe parte del nombre y Enter elige la primera sugerencia (D-87). */
async function chooseCorp(page, playerId, text) {
  await tabTo(page, focusedSelector(`#corp-${playerId}`));
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
}

export async function registerWithKeyboard(page, base) {
  await page.goto(`${base}/registrar`);
  await page.getByRole('heading', { level: 1, name: 'Registrar partida' }).waitFor();
  await tabTo(page, focusedSelector('input[name="map"]'));
  await page.keyboard.press('Space');
  await next(page, 'Siguiente: Mesa');
  for (const name of ['Facu', 'Nico']) {
    await tabTo(page, focusedNamed(name));
    await page.keyboard.press('Enter');
  }
  await chooseCorp(page, 'p-facu', 'helion');
  await chooseCorp(page, 'p-nico', 'ecoline');
  await next(page, 'Siguiente: TR y M€');
  await tabTo(page, focusedNamed('Terraform Rating de Facu'));
  await page.keyboard.type('25');
  for (const step of ['Recompensas', 'Hitos', 'Recursos de cartas', 'Puntos de cartas', 'Vegetación', 'Ciudades', 'Revisión']) {
    await next(page, `Siguiente: ${step}`);
  }
  await tabTo(page, focusedNamed('Guardar partida'));
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/partidas\/[^/?]+(\/ceremonia)?(\?.*)?$/, { timeout: 15000 });
}
