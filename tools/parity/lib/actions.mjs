// Acciones por rol accesible, para que los mismos pasos sirvan en el mockup y en la app.
// Formas: { click: Target } · { fill: Target, value } · { press: 'Tab' | Target, key } · { scroll: Target | number }
// Target = { role, name, exact?, nth? } | { label } | { text } | { selector }
function locate(page, target) {
  let loc;
  if (target.role) loc = page.getByRole(target.role, { name: target.name, exact: target.exact ?? false });
  else if (target.label) loc = page.getByLabel(target.label, { exact: target.exact ?? false });
  else if (target.text) loc = page.getByText(target.text, { exact: target.exact ?? false });
  else loc = page.locator(target.selector);
  return target.nth === undefined ? loc.first() : loc.nth(target.nth);
}

async function scrollTo(page, target) {
  if (typeof target === 'number') {
    await page.evaluate((y) => { (document.querySelector('[data-scroll-root]') ?? document.querySelector('.scroller') ?? document.scrollingElement).scrollTop = y; }, target);
    return;
  }
  await locate(page, target).scrollIntoViewIfNeeded();
}

async function runOne(page, action) {
  if (action.click) return locate(page, action.click).click();
  if (action.fill) return locate(page, action.fill).fill(String(action.value ?? ''));
  if (action.press && typeof action.press === 'string') return page.keyboard.press(action.press);
  if (action.press) return locate(page, action.press).press(action.key);
  if (action.scroll !== undefined) return scrollTo(page, action.scroll);
  if (action.wait) return page.waitForTimeout(Number(action.wait));
  throw new Error(`acción desconocida: ${JSON.stringify(action)}`);
}

export async function runActions(page, actions = []) {
  for (const action of actions) await runOne(page, action);
  // El mouse queda quieto en la esquina en los dos lados (sin hover residual).
  if (actions.length) await page.mouse.move(0, 0);
}
