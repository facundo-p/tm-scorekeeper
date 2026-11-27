// La ceremonia con movimiento: «Saltar animación» lleva al final y de ahí se va al informe (F31).
export async function skipCeremony(page, base) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`${base}/partidas/g-063/ceremonia`);
  const skip = page.getByRole('button', { name: 'Saltar animación' });
  await skip.waitFor();
  await skip.click();
  await page.getByRole('heading', { level: 2, name: 'Juli' }).waitFor();
  await page.getByRole('region', { name: 'Logros' }).waitFor();
  if (await skip.count()) throw new Error('«Saltar animación» sigue a la vista después de saltar');
  // Con teclado: el bloque entra con un clip-path que en Chromium sin GPU tarda en arrancar.
  await page.getByRole('button', { name: 'Ver informe completo' }).press('Enter');
  await page.waitForURL(/\/partidas\/g-063(\?.*)?$/, { timeout: 15000 });
}
