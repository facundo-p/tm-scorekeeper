#!/usr/bin/env node
// Arnés de comparación visual y estructural mockup ↔ app (v2.0, F16).
//   node tools/parity/run.mjs --phase NN [--gated] [--screens …]  mockup contra la app (--gated: solo los exigidos)
//   node tools/parity/run.mjs --self [--ref mockup@<sha>]     mockup contra sí mismo (o contra una versión vieja)
// Sale con 1 si falla algún escenario exigido.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { OUT_DIR } from './config.mjs';
import { parseArgs } from './lib/args.mjs';
import { launch, newPage } from './lib/browser.mjs';
import { ariaTree, axeSerious, captureFrames, probeStyles } from './lib/capture.mjs';
import { evaluate, normalizeAria, planetChecked } from './lib/evaluate.mjs';
import { runActions } from './lib/actions.mjs';
import { waitReady } from './lib/ready.mjs';
import { writeImages, writeReport } from './lib/report.mjs';
import { isGated, loadScenarios } from './lib/scenarios.mjs';
import { startReference } from './serve/reference.mjs';

async function openScenario(page, side, scenario) {
  if (scenario.storage) await page.addInitScript((s) => Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v)), scenario.storage);
  await page.goto(side.url(scenario));
  if (side.styles) await page.addStyleTag({ content: side.styles });
  await waitReady(page, scenario);
  await runActions(page, scenario.actions);
  await waitReady(page, scenario);
}

async function captureSide(browser, side, scenario, viewport) {
  const { context, page, log } = await newPage(browser, viewport, side, scenario);
  try {
    await openScenario(page, side, scenario);
    const state = await page.evaluate(() => ({ hash: location.hash, dialogs: document.querySelectorAll('[role="dialog"]').length }));
    const shot = await captureFrames(page, scenario.frames);
    return { ...shot, state, aria: await ariaTree(page), styles: await probeStyles(page, scenario.probes), axe: await axeSerious(page), errors: log.errors };
  } finally {
    await context.close();
  }
}

// A failing scenario is captured once more before it counts (RUNBOOK: an unstable
// comparison is repeated once); the retry is recorded in the summary.
async function runEntry(ctx, scenario, viewport) {
  const first = await runEntryOnce(ctx, scenario, viewport);
  if (first.pass) return first;
  const second = await runEntryOnce(ctx, scenario, viewport);
  return { ...second, retried: true, firstFailures: first.failures };
}

async function runEntryOnce(ctx, scenario, viewport) {
  const key = `${scenario.id}-${viewport}`;
  try {
    const ref = await captureSide(ctx.browser, ctx.ref, scenario, viewport);
    // Antes de `planetFromPhase` la candidata no tiene planeta: no se lo espera (D-70).
    const candScenario = planetChecked(scenario, ctx.opts.phase) ? scenario : { ...scenario, planet: 'none' };
    const cand = await captureSide(ctx.browser, ctx.cand, candScenario, viewport);
    const result = evaluate(scenario, viewport, ref, cand, ctx.opts.mode, ctx.opts.phase);
    const files = writeImages(ctx.dir, key, ref, cand, result);
    const aria = JSON.stringify(normalizeAria(ref.aria)) === JSON.stringify(normalizeAria(cand.aria)) ? undefined : { ref: ref.aria, cand: cand.aria };
    return { id: scenario.id, viewport, gated: isGated(scenario, ctx.opts), pass: !result.failures.length, failures: result.failures, result, files, axe: { ref: ref.axe, cand: cand.axe }, state: { ref: ref.state, cand: cand.state }, aria };
  } catch (err) {
    return { id: scenario.id, viewport, gated: isGated(scenario, ctx.opts), pass: false, failures: [`excepción: ${err.message}`], result: { frames: [] }, files: [] };
  }
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => { while (next < items.length) { const i = next++; out[i] = await fn(items[i]); } };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

async function sides(opts) {
  if (opts.mode === 'self') return { ref: await startReference({ ref: opts.ref }), cand: await startReference() };
  const { startCandidate } = await import('./serve/candidate.mjs');
  return { ref: await startReference({ ref: opts.ref }), cand: await startCandidate() };
}

function summarize(opts, entries, run) {
  const strip = ({ result, files, ...e }) => ({ ...e, frames: result.frames.map((f) => (f.error ? { error: f.error } : { pixels: f.pixels, planet: f.planet })) });
  const gatedFails = entries.filter((e) => e.gated && !e.pass);
  return { run, mode: opts.mode, phase: opts.phase, ref: opts.ref ?? 'mockup', total: entries.length,
    passed: entries.filter((e) => e.pass).length, gatedFailures: gatedFails.map((e) => `${e.id}-${e.viewport}`), entries: entries.map(strip) };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const run = `${new Date().toISOString().replace(/[:.]/g, '-')}-${opts.mode}`;
  const dir = resolve(opts.out ?? resolve(OUT_DIR, run));
  mkdirSync(dir, { recursive: true });
  // --gated: solo los escenarios que ya bloquean en esta fase (los demás tardan y solo avisan).
  const scenarios = loadScenarios(opts).filter((s) => !opts.gated || isGated(s, opts));
  const jobs = scenarios.flatMap((s) => s.viewports.filter((v) => !opts.viewports || opts.viewports.includes(v)).map((v) => [s, v]));
  const { ref, cand } = await sides(opts);
  const browser = await launch();
  const ctx = { browser, ref, cand, opts, dir };
  const entries = await pool(jobs, opts.concurrency, ([s, v]) => runEntry(ctx, s, v));
  await browser.close(); await ref.close(); await cand.close();
  const summary = summarize(opts, entries, run);
  writeReport(dir, summary, entries);
  for (const e of entries) console.log(`${e.pass ? 'ok   ' : e.gated ? 'FALLA' : 'aviso'} ${e.id} · ${e.viewport}${e.retried ? ' (reintentado)' : ''}${e.pass ? '' : ` — ${e.failures[0]}`}`);
  console.log(`${summary.passed}/${summary.total} OK · reporte: ${resolve(dir, 'report.html')}`);
  process.exit(summary.gatedFailures.length ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(2); });
