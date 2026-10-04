// Ayudantes para manejar la app solo con el teclado (Tab, Enter, Espacio, flechas).

/** Tab hasta que el foco cumpla `matches` (evaluado en la página con el elemento activo). */
export async function tabTo(page, matches, { max = 120, back = false } = {}) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
    if (await page.evaluate(matches)) return;
  }
  throw new Error(`no llegué con Tab a ${matches}`);
}

/** El foco está en un botón (o control) con ese nombre accesible visible. */
export const focusedNamed = (name) => new Function(`
  const el = document.activeElement;
  const text = (el?.getAttribute('aria-label') || el?.textContent || '').trim();
  return text === ${JSON.stringify(name)};
`);

export const focusedSelector = (selector) => new Function(`return document.activeElement?.matches(${JSON.stringify(selector)}) ?? false;`);
