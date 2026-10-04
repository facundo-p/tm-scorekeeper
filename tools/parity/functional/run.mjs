#!/usr/bin/env node
// Chequeos funcionales sobre la candidata (no comparan con el mockup): flujos que tienen que andar.
//   node tools/parity/functional/run.mjs
import { launch, newPage } from '../lib/browser.mjs';
import { startCandidate } from '../serve/candidate.mjs';
import { registerWithKeyboard } from './register-keyboard.mjs';

const CHECKS = [
  { id: 'register-keyboard', viewports: ['mobile', 'desktop'], run: registerWithKeyboard },
];

async function main() {
  const cand = await startCandidate();
  const browser = await launch();
  let failed = 0;
  for (const check of CHECKS) {
    for (const viewport of check.viewports) {
      const { context, page } = await newPage(browser, viewport, cand, { id: check.id });
      try {
        await check.run(page, cand.base ?? new URL(cand.url({ cand: { path: '/' } })).origin);
        console.log(`ok    ${check.id} · ${viewport}`);
      } catch (err) {
        failed++;
        console.log(`FALLA ${check.id} · ${viewport} — ${err.message.split('\n')[0]}`);
      } finally {
        await context.close();
      }
    }
  }
  await browser.close(); await cand.close();
  process.exit(failed ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(2); });
