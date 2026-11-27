import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashToPath, normalizeAriaUrls } from './hrefs.mjs';

test('mockup hashes map to the app routes (D-02)', () => {
  assert.equal(hashToPath('#inicio'), '/');
  assert.equal(hashToPath('#partida-g-063'), '/partidas/g-063');
  assert.equal(hashToPath('#jugador-p-facu?tab=partidas'), '/jugadores/p-facu?tab=partidas');
  assert.equal(hashToPath('#editar-g-1'), '/partidas/g-1/editar');
  assert.equal(hashToPath('#otra-cosa'), '#otra-cosa');
});

test('aria snapshots get their link urls rewritten', () => {
  assert.equal(normalizeAriaUrls('- link "Inicio":\n  - /url: "#inicio"'), '- link "Inicio":\n  - /url: /');
  assert.equal(normalizeAriaUrls('- /url: "#records"'), '- /url: /records');
});
