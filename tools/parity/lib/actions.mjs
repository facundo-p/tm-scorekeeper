// Acciones por rol accesible, para que los mismos pasos sirvan en el mockup y en la app.
// Formas: { click: Target } · { fill: Target, value } · { select: Target, option } · { press: 'Tab' | Target, key } · { scroll: Target | number }
// Target = { role, name, exact?, nth? } | { label } | { text } | { selector }
// `expect: Target` waits until that element is visible; if it isn't after the
// first try, the action is repeated once (clicks lost while the page settles).
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
  // `option` es el texto visible: los ids de las opciones pueden diferir entre el mockup y la app.
  if (action.select) return locate(page, action.select).selectOption({ label: String(action.option) });
  if (action.press && typeof action.press === 'string') return page.keyboard.press(action.press);
  if (action.press) return locate(page, action.press).press(action.key);
  if (action.scroll !== undefined) return scrollTo(page, action.scroll);
  if (action.wait) return page.waitForTimeout(Number(action.wait));
  throw new Error(`acción desconocida: ${JSON.stringify(action)}`);
}

async function runChecked(page, action) {
  await runOne(page, action);
  if (!action.expect) return;
  const target = locate(page, action.expect);
  const visible = await target.waitFor({ state: 'visible', timeout: 5000 }).then(() => true, () => false);
  if (visible) return;
  await runOne(page, action);
  await target.waitFor({ state: 'visible', timeout: 10000 });
}

export async function runActions(page, actions = []) {
  for (const action of actions) await runChecked(page, action);
  // El mouse queda quieto en la esquina en los dos lados (sin hover residual).
  if (actions.length) await page.mouse.move(0, 0);
}
